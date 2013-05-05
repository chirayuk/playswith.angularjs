// Part of and included by app.js

var PAGE_TYPE = "PLAYSWITH";

// TODO(chirayu):  These functions need to go into a class or directive instead
// of being spread out like this.
function process_playswith_startup_data(serverResult) {
  var startupData = {};
  var homepage = startupData.homepage = (serverResult.homepage || {});
  var projects = startupData.projects = (serverResult.projects || []);
  // Create a map of projects by id.
  var projects_by_id = startupData.projects_by_id = {};
  projects.forEach(function (project) {
      projects_by_id[project.id] = project;
    });
  // Fill in project references in the homepage object.
  homepage.sections.forEach(function (section) {
    section.projects = section.project_ids.map(function (project_id) {
        if (!projects_by_id[project_id]) {
          console.log("NOT FOUND: project_id = %O, projects_by_id = %O",
                      project_id, projects_by_id);
        }
        return projects_by_id[project_id];
      });
    });
  startupData.project_ids = Object.keys(startupData.projects_by_id);
  console.log("process_playswith_startup_data: Final startupData = %O", startupData);
  return startupData;
}


playsWith.factory("playswithStartupData", function ($http, $q) {
    var url = "/rpc/playswith_page.get_startup_data";
    var deferred = $q.defer();
    var startupData = {
      ready: deferred.promise,
      homepage: null,
      projects: null,
      projects_by_id: null
    };
    $http({method: "POST", url: url, data: {} }).
      success(function(data, status) {
          var resolvedStartupData = process_playswith_startup_data(data);
          angular.copy(resolvedStartupData, startupData);
          startupData.ready = deferred.promise;
          deferred.resolve(true);
        }).
      error(function(projects, status) {
          deferred.reject(false);
        });
    return startupData;
});


playsWith.controller("playswithRootController", function ($scope) {
  $scope.type = PAGE_TYPE;
});


playsWith.controller("playswithHomepageController", function ($scope, playswithStartupData) {
  $scope.startupData = playswithStartupData;
});


directives.playswithProjectSummary = function () {
  console.log("directives.playswithProjectSummary");
  return {
    restrict: "A",
    template: {% filter to_json -%}
      <div class="span4">
        <h3>{{project.name}}</h3>
        <div ng-bind-html-unsafe="project.description"></div>
        {# <span ng-show="project.tags">
          <br><span project-tags="project.tags"></span>
        </span> #}
      </div>
      {%- endfilter %},
    scope: {
      project: "="
    }
  };
};



directives.playswithSelectProject = function (playswithStartupData) {
  console.log("directives.playswithSelectProject");
  return {
    restrict: "A",
    scope: {
      project: "=",
      onRemove: "&"
    },
    controller: function ($scope, playswithStartupData) {
      $scope.projectCopy = {};
      angular.copy($scope.project, $scope.projectCopy);
      $scope.$watch("projectCopy", function (newValue, oldValue) {
        angular.copy($scope.projectCopy, $scope.project);
      });

      var projectToName = function (project) { return project.name; };
      var projectIdToName = function (project_id) { return playswithStartupData.projects_by_id[project_id].name; };

      $scope.select2Data = {
        data: {
          results: playswithStartupData.projects,
          text: projectToName
        },
        formatSelection: projectToName,
        formatResult: projectToName,
        containerCssClass: "projectSelect2"
        };
    },

    template: {% filter to_json -%}
        <div class="span4">
            <input ui-select2="select2Data" ng-model="projectCopy" type="hidden" style="width:280px" class="input-large">
        <button class="btn btn-link" ng-click="onRemove()">remove</button><br><br>
        {# <div style="height: 300px" playswith-project-summary project="project"></div> #}
        <div ng-bind-html-unsafe="project.description"></div>
        <br><br>
        </div>
    {%- endfilter %}
  };
}


directives.playswithSectionFormControl = function () {
  console.log("directives.playswithSectionFormControl");
  return {
    restrict: "A",
    scope: {
      section: "=",
      onRemove: "&"
    },
    controller: function ($scope) {
      console.log("CKCK: section = %O", $scope.section);
      $scope.removeProjectAtIndex = function (index) {
        $scope.section.projects.splice(index, 1);
      };
    },

    template: {% filter to_json -%}
        <div class="row">
          <h1><div style="width: auto; padding-bottom: .1em;" contenteditable="true" ng-model="section.title" title="Click to edit" class="span12"></div>
          <small class="btn btn-link" ng-click="onRemove()">remove</small></h1>
        </div>
        {# Not used.  Commented out.
          <div single-form-control-group id="section-description" label="Description">
            <input ng-model="section.description" type="text" class="input-block-level">
          </div>
        #}
        <div class="row inline-block-container">
          <div ng-repeat="project in section.projects">
            <div playswith-select-project project="project" on-remove="removeProjectAtIndex($index)"></div>
          </div>
        </div>
      {%- endfilter %}
  };
}


directives.editPlayswithHomePage = function (playswithStartupData, $window) {
  console.log("directives.editPlayswithHomePage");
  return {
    restrict: "A",
    scope: {},
    controller: function ($scope, $http) {
      $scope.ready = false;
      playswithStartupData.ready.then(function() {
        $scope.homepage = playswithStartupData.homepage;
        $scope.ready = true;
      });
      $scope.submit_disabled = false;
      $scope.in_progress = false;

      $scope.removeSectionAtIndex = function (index) {
        $scope.homepage.sections.splice(index, 1);
      };

      var getCleanHomepage = function () {
        var cleanHomepage = {};
        console.log("Saving:  $scope is %O", $scope);
        angular.copy($scope.homepage, cleanHomepage);
        cleanHomepage.sections.forEach(function (section) {
          section.project_ids = section.projects.map(
              function (project) {return project.id});
          delete section.projects;
        });
        return cleanHomepage;
      };

      $scope.saveChanges = function() {
        var url = "/rpc/playswith_page.update_homepage";
        console.log("editPlayswithHomePage: saveChanges: homepage = %O", $scope.homepage);
        $scope.submit_disabled = true;
        $scope.in_progress = true;
        $http({method: "POST", url: url, data: getCleanHomepage() }).
            success(function(data, status) {
                $scope.submit_disabled = false;
                $scope.in_progress = false;
                $window.location.href = "/playswith";
              }).
            error(function(data, status) {
                $scope.submit_disabled = false;
                $scope.in_progress = false;
              });
      }
    },

    template: {% filter to_json -%}
        <div ng-switch on="ready">
        <div ng-switch-when="false">
          Loading ... <i class="icon-spinner icon-spin"></i>
        </div>
        <div ng-switch-when="true">
          <div class="alert alert-info"><b>Tip:</b> Click on an item to edit.</div>
          <br>
          <div ng-click="saveChanges()" class="btn btn-primary btn-large">Save changes and update homepage</div>
          <h1 contenteditable="true" ng-model="homepage.title" title="Click to edit page heading"></h1>
          <div contenteditable="true" ng-model="homepage.description" title="Click to edit"></div>

          {# Sections. #}
          <div ng-switch on="homepage.sections.length">
            <div ng-switch-when="0">
              TODO(chirayu): Add link to create a new section.
            </div>
            <div ng-switch-default>
              <div ng-repeat="section in homepage.sections">
                <div playswith-section-form-control section="section" on-remove="removeSectionAtIndex($index)"></div>
              </div>
            </div>
          </div>
        </div>
        </div>

      {%- endfilter %}
  };
} // end editPlayswithHomePage directive.



directives.playswithHomepage = function (playswithStartupData) {
  console.log("directives.playswithHomepage");
  return {
    restrict: "A",
    scope: {},
    controller: function ($scope) {
      $scope.type = PAGE_TYPE;
      $scope.homepage = playswithStartupData.homepage;
    },
    template: {% filter to_json -%}
      <div>
        <h1>{{homepage.title}}</h1>
        <p ng-show="homepage.description">{{homepage.description}}</p>
        <br>
        <a class="btn btn-large btn-link" href="/playswith/create">Submit a project</a>&nbsp;&nbsp;
        <a class="btn btn-large btn-link" href="/playswith/pending">See submissions</a>
        <a class="btn btn-large btn-link" href="/playswith/edit_homepage">Edit the homepage</a>
      </div>
        <div ng-repeat="section in homepage.sections">
          <div>
            <h1>{{section.title}}</h1>
            <p ng-show="section.description">{{section.description}}</p>
          </div>
          <div class="row inline-block-container">
            <div ng-repeat="project in section.projects">
              <div playswith-project-summary project="project"></div>
            </div>
          </div>
        </div>
      </div>
    {%- endfilter %}
  };
}


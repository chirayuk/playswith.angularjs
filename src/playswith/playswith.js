// Part of app.js (included there.)


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
    // delete section.project_ids;
    });
  console.log("process_playswith_startup_data: Final startupData = %O", startupData);
  return startupData;
}


playsWith.controller("playswithRootController", function ($scope) {
  $scope.type = "PLAYSWITH";
});


playsWith.controller("playswithHomepageController", function ($scope, playswithStartupData) {
  $scope.startupData = playswithStartupData;
});


playsWith.factory("playswithStartupData", function ($http, $q) {
    var url = "/rpc/playswith_page.get_startup_data";
    var homepageDeferred = $q.defer();
    var projectsDeferred = $q.defer();
    var projectsByIdDeferred = $q.defer();
    var startupData = {
      homepage: homepageDeferred.promise,
      projects: projectsDeferred.promise,
      projects_by_id: projectsByIdDeferred.promise
    };
    $http({method: "POST", url: url, data: {} }).
      success(function(data, status) {
          var resolvedStartupData = process_playswith_startup_data(data);
          angular.copy(resolvedStartupData, startupData);
          homepageDeferred.resolve(resolvedStartupData.homepage);
          projectsDeferred.resolve(resolvedStartupData.projects);
          projectsByIdDeferred.resolve(resolvedStartupData.projects_by_id);
        }).
      error(function(projects, status) {
          homepageDeferred.reject(null);
          projectsDeferred.reject(null);
          projectsByIdDeferred.reject(null);
        });
    console.log("CKCK: playswithStartupData service is: %O", startupData);
    return startupData;
});


directives.playswithProjectIdSelect = function (playswithStartupData) {
  console.log("directives.playswithProjectIdSelect");
  return {
    restrict: "A",
    controller: function ($scope) {
      $scope.getProjectById = function (id) {
        console.log("CKCK: getProjectById: id=%O", id);
        return playswithStartupData.projects_by_id[id];
      };
    },
    link: function (scope, elem, attrs) {
      var projectToName = function (project) { return project.name; };
      var makeSelect2 = function () {
        elem.select2({
            data: {
              results: playswithStartupData.projects,
              text: projectToName
            },
            formatSelection: projectToName,
            formatResult: projectToName
            });
      }
      if (playswithStartupData.projects.then) {
        playswithStartupData.projects.then(makeSelect2);
      } else {
        makeSelect2();
      }
    }
  };
}


directives.playswithSelectProject = function (playswithStartupData) {
  console.log("directives.playswithSelectProject");
  return {
    restrict: "A",
    scope: {
      project: "=",
      onRemove: "&"
    },
    controller: function ($scope, playswithStartupData) {
      var projectToName = function (project) { return project.name; };
      $scope.select2Data = {
        data: {
          results: playswithStartupData.projects,
          text: projectToName
        },
        formatSelection: projectToName,
        formatResult: projectToName
        };
    },

    template: {% filter to_json -%}
        <div single-form-control-group id="project" label="Project">
          <input ui-select2="select2Data" ng-model="project" type="text" style="width:200px">
          <button class="btn btn-link" ng-click="onRemove()">remove</button>
          <div class="row">
            <div class="span4" playswith-project-summary project="project"></div>
          </div>
        </div>
    {%- endfilter %}
  };
}


directives.playswithSectionFormControl = function () {
  console.log("directives.playswithSectionFormControl");
  return {
    restrict: "A",
    scope: {
      section: "="
    },
    controller: function ($scope) {
      $scope.removeProjectAtIndex = function (index) {
        $scope.section.projects.splice(index, 1);
      };
    },

    template: {% filter to_json -%}
        <div single-form-control-group id="section-title" label="Title">
          <input ng-model="section.title" type="text" class="input-block-level">
        </div>
        {# Not used.  Commented out.
          <div single-form-control-group id="section-description" label="Description">
            <input ng-model="section.description" type="text" class="input-block-level">
          </div>
        #}

        <div ng-repeat="project in section.projects">
          <div playswith-select-project project="project" on-remove="removeProjectAtIndex($index)"></div>
        </div>
      {%- endfilter %}
  };
}


directives.editPlayswithHomePage = function () {
  console.log("directives.editPlayswithHomePage");
  return {
    restrict: "A",
    scope: {
      homepage: "="
    },
    controller: function ($scope, $http) {
      $scope.submit_disabled = false;
      $scope.in_progress = false;

      $scope.saveChanges = function() {
        var url = "/rpc/playswith_page.update_homepage";
        console.log("editPlayswithHomePage: saveChanges: homepage = %O", $scope.homepage);
        $scope.submit_disabled = true;
        $scope.in_progress = true;
        $http({method: "POST", url: url, data: $scope.homepage }).
            success(function(data, status) {
                $scope.submit_disabled = false;
                $scope.in_progress = false;
                angular.copy(data, $scope.homepage);
                $scope.onUpdate();
              }).
            error(function(data, status) {
                $scope.submit_disabled = false;
                $scope.in_progress = false;
              });
      }
    },

    template: {% filter to_json -%}
        <form class="well form-horizontal" novalidate method="post" accept-charset="utf-8">
          <div single-form-control-group id="heading" label="Page Heading">
            <span contentEditable="true" ng-model="homepage.title" title="Click to edit page heading" class="input-block-level">{{homepage.title}}</span>
          </div>
          <div single-form-control-group id="description" label="Page Body">
              <div contentEditable="true" ng-model="homepage.description" title="Click to edit">{{homepage.description}}</div>
          </div>

          {# Sections. #}
          <div ng-switch on="homepage.sections.length">
            <div ng-switch-when="0">
              TODO(chirayu): Add link to create a new section.
            </div>
            <div ng-switch-default>
              <div ng-repeat="section in homepage.sections">
                <hr>
                <h4>Section</h4>
                <div playswith-section-form-control section="section"></div>
              </div>
            </div>
          </div>
        </form>

      {%- endfilter %}
  };
} // end editPlayswithHomePage directive.

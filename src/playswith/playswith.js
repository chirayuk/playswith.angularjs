// Part of app.js (included there.)


// TODO(chirayu):  These functions need to go into a class or directive instead
// of being spread out like this.
function process_playswith_startup_data(startupData, startup_data) {
  var homepage = startupData.homepage = (startup_data.homepage || {});
  var projects = startupData.projects = (startup_data.projects || []);
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
          process_playswith_startup_data(startupData, data);
          startupData.homepageDeferred.resolve(data.homepage);
          startupData.projectsDeferred.resolve(data.projects);
          startupData.projectsByIdDeferred.resolve(data.projects_by_id);
        }).
      error(function(projects, status) {
          startupData.homepageDeferred.reject(null);
          startupData.projectsDeferred.reject(null);
          startupData.projectsByIdDeferred.reject(null);
        });
    console.log("CKCK: playswithStartupData service is: %O", startupData);
    return startupData;
});


directives.playswithSectionFormControl = function () {
  console.log("directives.playswithSectionFormControl");
  return {
    restrict: "A",
    scope: {
      section: "="
    },
    controller: function ($scope, playswithStartupData) {
      $scope.getProjectById = function (id) {
        console.log("CKCK: getProjectById: playswithStartupData: %O, id: %O",
                    playswithStartupData, id);
        return playswithStartupData.projects_by_id[id];
      };
    },
    template: {% filter to_json -%}
        <div single-form-control-group id="section-title" label="Title">
          <input ng-model="section.title" type="text" class="input-block-level">
        </div>
        {# Not used.  Commented out.
        <div single-form-control-group id="section-description" label="Description">
          <input ng-model="section.description" type="text" class="input-block-level">
        </div> #}
        <div ng-repeat="project_id in section.project_ids">
          <div single-form-control-group id="project-id" label="Project">
            <input ng-model="project_id" type="text">
            <div class="row">
              <div class="span4" playswith-project-summary project="getProjectById(project_id)"></div>
            </div>
          </div>
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
            <input ng-model="homepage.title" type="text" class="input-block-level"
                   placeholder="Complimentary Libraries, Tools, and Techniques">
          </div>
          <div single-form-control-group id="description" label="Page Body">
            <textarea ng-model="homepage.description"
                      rows=8 class="input-block-level">
              {{homepage.description}}
            </textarea>
          </div>

          {# Sections. #}
          <div ng-repeat="section in homepage.sections">
            <div playswith-section-form-control section="section"></div>
          </div>

        </form>

      {%- endfilter %}
  };
} // end editPlayswithHomePage directive.

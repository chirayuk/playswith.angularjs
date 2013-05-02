// Part of app.js (included there.)


// TODO(chirayu):  These functions need to go into a class or directive instead
// of being spread out like this.
function process_playswith_startup_data(scope, startup_data) {
  var homepage = scope.homepage = (startup_data.homepage || {});
  var projects = scope.projects = (startup_data.projects || []);
  // Create a map of projects by id.
  var projects_by_id = scope.projects_by_id = {};
  projects.forEach(function (project) {
      console.log("process_playswith_startup_data: id = %O, project = %O",
                  project.id, project);
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
  console.log("process_playswith_startup_data: Final scope = %O", scope);
}


function load_playswith_startup_data(scope, $http, $q) {
  var url = "/rpc/playswith_page.get_startup_data";
  scope.homepage = $q.defer();
  scope.projects = $q.defer();
  $http({method: "POST", url: url, data: {} }).
      success(function(data, status) {
          scope.status = status;
          // scope.homepage.resolve(data.homepage);
          // scope.projects.resolve(data.projects);
          console.log("get_startup_data: data = %O", data);
          process_playswith_startup_data(scope, data);
          console.log("load_playswith_startup_data: %O", data);
        }).
      error(function(projects, status) {
          scope.status = status;         
          scope.homepage.reject(null);
          scope.projects.reject(null);
        });
}



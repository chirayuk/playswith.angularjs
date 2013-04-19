"use strict";

function controller($scope, $http) {
  $scope.project = {};
  $scope.status_text = "Not yet submitted.";

  $scope.create = function() {
    // var url = "/rpc/view.create_project";
    var url = "/rpc/view.create_pending_project";
    $scope.status_text = "Submitting ...";
    console.log("%O", $scope.project);
    $http({method: "POST", url: url, data: $scope.project }).
        success(function(project, status) {
            $scope.status = status;
            $scope.project = project;
            console.log("Created project: %O", project);
            $scope.status_text = "Success!";
          }).
        error(function(data, status) {
            $scope.status = status;         
            $scope.status_text = "Failed.";
          });
  }
}

"use strict";

function load_projects($scope, $http) {
  var url = "/rpc/view.get_project_list";
  $http({method: "POST", url: url, data: {} }).
      success(function(data, status) {
          $scope.status = status;
          $scope.data = data;
          console.log("load_projects: %O", data);
        }).
      error(function(projects, status) {
          $scope.status = status;         
          $scope.data = null;
        });
}


function load_pending_projects($scope, $http) {
  var url = "/rpc/view.get_pending_project_list";
  $http({method: "POST", url: url, data: {} }).
      success(function(data, status) {
          $scope.status = status;
          $scope.projects = data.projects;
          console.log("load_pending_projects: projects = %O", data);
        }).
      error(function(projects, status) {
          $scope.status = status;         
          $scope.projects = null;
        });
}


// Main app module.
var playsWith = angular.module('playsWith', []);

playsWith.filter("utcTimestampToDate", function ($filter) {
  return function (utctimestamp, format) {
    var utctimestampInMillis = utctimestamp * 1000;
    return $filter('date')(utctimestampInMillis, format);
  };
});



playsWith.controller("homepageController", function ($scope, $http) {
  $scope.projects = load_projects($scope, $http);
});


playsWith.controller("pendingProjectsController", function ($scope, $http) {
  $scope.projects = [];
  $scope.status_text = "Not yet submitted.";
  load_pending_projects($scope, $http);

  $scope.approve = function(project) {
    var url = "/rpc/view.approve_project";
    $scope.status_text = "Approving ...";
    console.log("%O", project);
    $http({method: "POST", url: url, data: project }).
        success(function(project, status) {
            $scope.status = status;
            console.log("Approved project: %O", project);
            load_pending_projects($scope, $http);
            $scope.status_text = "Success!";
          }).
        error(function(data, status) {
            $scope.status = status;         
            $scope.status_text = "Failed.";
          });
  }
});

playsWith.controller("submitNewProjectController", function ($scope, $http) {
  $scope.project = {};
  $scope.status_text = "Not yet submitted.";

  $scope.addToPending = function() {
    var url = "/rpc/view.create_pending_project";
    $scope.status_text = "Submitting ...";
    console.log("%O", $scope.project);
    $http({method: "POST", url: url, data: $scope.project }).
        success(function(project, status) {
            $scope.status = status;
            $scope.project = project;
            console.log("addToPending: project with id = %O", project);
            $scope.status_text = "Success!";
          }).
        error(function(data, status) {
            $scope.status = status;         
            $scope.status_text = "Failed.";
          });
  }
});


var directives = playsWith.directives = {};

directives.projectInfoSmall = function () {
  console.log("directives.projectInfoSmall");
  return {
    restrict: "A",
    template: "<div>\n        <h3>{{project.name}}</h3>\n        <p>{{project.description}}</p>\n        <div ng-show=\"project.thumbnail_url\"><img ng-src=\"{{project.thumbnail_url}}\">\n      </div>",
    scope: {
      project: "="
    },
    link: function($scope) {
      console.log("projectInfoSmall: link: project = %O", $scope.project);
    }
  };
};

directives.pendingProjectInfo = function () {
  console.log("directives.pendingProjectInfo");
  return {
    restrict: "A",
    template: "<div>\n        <h3>Name: {{project.name}}</h3>\n        <p>Description: {{project.description}}</p>\n        <p>Submission time: {{project.submission_timestamp | utcTimestampToDate:\"medium\" }}</p>\n        <div ng-show=\"project.thumbnail_url\"><img ng-src=\"{{project.thumbnail_url}}\">\n      </div>",
    scope: {
      project: "="
    },
    link: function($scope) {
      console.log("projectInfoSmall: link: project = %O", $scope.project);
    }
  };
};

playsWith.directive(directives);
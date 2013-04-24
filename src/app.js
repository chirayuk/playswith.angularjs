{% import "src/utils.jinja" as utils -%}

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


function load_project_requests($scope, $http) {
  var url = "/rpc/view.get_project_request_list";
  $http({method: "POST", url: url, data: {} }).
      success(function(data, status) {
          $scope.status = status;
          $scope.requests = data.requests;
          console.log("load_project_requests: requests = %O", data);
        }).
      error(function(projects, status) {
          $scope.status = status;         
          $scope.requests = null;
        });
}


// Main app module.
{# var playsWith = angular.module('playsWith', ['ngSanitize']); #}
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


playsWith.controller("projectRequestsController", function ($scope, $http) {
  $scope.requests = [];
  $scope.status_text = "Not yet submitted.";
  load_project_requests($scope, $http);

  $scope.approve = function(request) {
    var url = "/rpc/view.approve_project_request";
    $scope.status_text = "Approving ...";
    console.log("%O", request);
    $http({method: "POST", url: url, data: request }).
        success(function(request, status) {
            $scope.status = status;
            console.log("Approved request: %O", request);
            load_project_requests($scope, $http);
            $scope.status_text = "Success!";
          }).
        error(function(data, status) {
            $scope.status = status;         
            $scope.status_text = "Failed.";
          });
  }
});

playsWith.controller("newProjectRequestController", function ($scope, $http) {
  $scope.request = {project: {} };
  $scope.status_text = "Not yet submitted.";

  $scope.addToPending = function() {
    var url = "/rpc/view.create_project_request";
    $scope.status_text = "Submitting ...";
    console.log("%O", $scope.request);
    // TODO(chirayu): Better way of getting tags.  UI should have some kind of
    // autocomplete as well.
    var tags = $scope.request.project.tags;
    if (tags && tags.trim) {
      $scope.request.project.tags = tags.split(",").map(
          function(tag) { return tag.trim() });
    }
    $http({method: "POST", url: url, data: $scope.request }).
        success(function(request, status) {
            $scope.status = status;
            $scope.request = request;
            console.log("addToPending: request with id = %O", request);
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
    template: {% filter to_json -%}
      <div>
        <h3>{{project.name}}</h3>
        <div ng-bind-html-unsafe="project.description"></div>
        <p>Website: <a rel="nofollow" href="{{project.url"}}>{{project.url}}</a></p>
        Tags: <span ng-repeat="tag in project.tags">
            {{tag}}
          </span>
        <div ng-show="project.thumbnail_url"><img ng-src="{{project.thumbnail_url}}">
      </div>
      {%- endfilter %},
    scope: {
      project: "="
    },
    link: function($scope) {
      console.log("projectInfoSmall: link: project = %O", $scope.project);
    }
  };
};

directives.projectRequest = function () {
  console.log("directives.projectRequest");
  return {
    restrict: "A",
    template: {% filter to_json %}
      <div>
        <h3>Name: {{request.project.name}}</h3>
        <p>Description: {{request.project.description}}</p>
        <p>Submission time: {{request.submission_timestamp | utcTimestampToDate:"medium" }}</p>
        <p>Website: <a href="{{request.project.url"}}>{{request.project.url}}</a></p>
        Tags: <ul>
        <li ng-repeat="tag in request.project.tags">
          {{tag}}
        </li>
        <div ng-show="request.thumbnail_url"><img ng-src="{{request.thumbnail_url}}">
      </div>
      {%- endfilter %},
    scope: {
      request: "="
    },
    link: function($scope) {
      console.log("projectInfoSmall: link: request = %O", $scope.request);
    }
  };
};

playsWith.directive(directives);

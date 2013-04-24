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

directives.newProjectRequest = function () {
  console.log("directives.newProjectRequest");
  return {
    restrict: "A",

    controller: function ($scope, $http) {
      $scope.request = {project: {} };
      $scope.submit_disabled = false;
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
        $scope.submit_disabled = true;
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
                $scope.submit_disabled = false;
              });
      }
    },

    template: {% filter to_json -%}
      <div>
        <h1>Submit a new project</h1>
        <form class="form-horizontal" novalidate method="post" accept-charset="utf-8">
          <div class="control-group">
            <label class="control-label" for="inputName">Name</label>
              <div class="controls">
                <input ng-model="request.project.name" type="text" id="inputName" placeholder="Project Name">
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputDescription">Description</label>
              <div class="controls">
                <textarea ng-model="request.project.description" rows=5 id="inputDescription"></textarea>
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputURL">URL</label>
              <div class="controls">
                <input ng-model="request.project.url" type="text" id="inputURL" placeholder="Main URL">
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputThumbnailUrl">Thumbnail URL</label>
              <div class="controls">
                <input ng-model="request.thumbnail_url" type="text" id="inputThumbnailUrl" placeholder="http://">
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputTagsCsv">Tags<br>(space/comma separated)</label>
              <div class="controls">
                <input ng-model="request.project.tags" type="text" id="inputTagsCsv" placeholder="name@example.com">
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputSubmitterEmail">Submitter E-mail</label>
              <div class="controls">
                <input ng-model="request.submitter_email" type="text" id="inputSubmitterEmail" placeholder="name@example.com">
              </div>
          </div>
          <div class="form-actions">
            <button ng-click="addToPending()" type="submit" ng-disabled="submit_disabled" class="btn btn-primary">Submit Request</button>
          </div>
        </form>
        <br>
        <b>Status:</b> {{ status_text }}
      {%- endfilter %},
    scope: {},
    link: function($scope) {
      console.log("newProjectRequest: link: request = %O", $scope.request);
    }
  };
};


directives.projectRequest = function () {
  console.log("directives.projectRequest");
  return {
    restrict: "A",
    template: {% filter to_json %}
      <div>
        <div class="row">
          <div class="span2 pwa-item-label">Name</div>
          <div class="span10"><b>{{request.project.name}}</b></div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Description</div>
          <div class="span10" ng-bind-html-unsafe="request.project.description"></div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Website</div>
          <div class="span10"><a href="{{request.project.url"}}>{{request.project.url}}</a></div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Tags</div>
          <div class="span10">
            <ul>
              <li ng-repeat="tag in request.project.tags">
                {{tag}}
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Submitter E-mail</div>
          <div class="span10">{{request.submitter_email}}</div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Submission time</div>
          <div class="span10">{{request.submission_timestamp | utcTimestampToDate:"medium" }}</div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Thumbnail</div>
          <div class="span10" ng-show="request.thumbnail_url"><img ng-src="{{request.thumbnail_url}}"></div>
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

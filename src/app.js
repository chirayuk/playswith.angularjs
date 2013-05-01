{% import "src/utils.jinja" as utils -%}

function load_projects($scope, $http) {
  var url = "/rpc/project.get_project_list";
  $http({method: "POST", url: url, data: {type: $scope.type} }).
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
  var url = "/rpc/project.get_project_request_list";
  $http({method: "POST", url: url, data: {type: $scope.type} }).
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


playsWith.controller("playswithRootController", function ($scope) {
  $scope.type = "PLAYSWITH";
});

playsWith.controller("builtwithRootController", function ($scope) {
  $scope.type = "BUILTWITH";
});

playsWith.controller("homepageController", function ($scope, $http) {
  $scope.projects = load_projects($scope, $http);
});


playsWith.controller("projectRequestsController", function ($scope, $http) {
  $scope.requests = [];
  console.log("CKCK: projectRequestsController: Controller is being created.");
  load_project_requests($scope, $http);
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
        <p>Website: <a rel="nofollow" href="{{project.url}}">{{project.url}}</a></p>
        <span ng-show="project.tags">
          Tags: <span project-tags="project.tags"></span>
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


directives.projectTags = function() {
  return {
    restrict: "A",
    scope: {
      tags: "=projectTags",
    },
    template: {% filter to_json -%}
      <span class="label label-info bwa-tag"
            ng-repeat="tag in tags">
        {{tag}}
      </span>
      {%- endfilter %},
  };
}


directives.previewProjectRequest = function () {
  console.log("directives.previewProjectRequest");
  return {
    restrict: "A",
    template: {% filter to_json -%}
      <div style="well">
        <h3>{{request.project.name}}</h3>
        <div ng-bind-html-unsafe="request.project.description"></div>
        <p ng-show="request.project.url">Website: <a rel="nofollow" href="{{request.project.url}}">{{request.project.url}}</a></p>
        <span ng-show="request.project.tags">
          Tags: <span project-tags="request.project.tags"></span>
        </span>
        <div ng-show="request.thumbnail_url"><img ng-src="{{request.thumbnail_url}}">
      </div>
      {%- endfilter %},
  };
}


directives.newProjectRequest = function () {
  console.log("directives.newProjectRequest");
  return {
    restrict: "A",
    scope: {
      type: "=",
    },

    controller: function ($scope, $http) {
      $scope.request = {project: {type: $scope.type} };
      console.log("CKCK: type=%O, request=%O", $scope.type, $scope.request);
    },

    link: function($scope) {
      console.log("newProjectRequest: link: request = %O", $scope.request);
    },

    template: {% filter to_json -%}
      <div edit-project-request type="type" request="request"></div>
      {%- endfilter %}

  };
};


directives.editProjectRequest = function () {
  console.log("directives.editProjectRequest");
  return {
    restrict: "A",
    scope: {
      type: "=",
      request: "=",
      onUpdate: "&"
    },
    link: function($scope) {
      console.log("editProjectRequest: link: type = %O, request = %O", $scope.type, $scope.request);
    },
    controller: function ($scope, $http) {
      $scope.submit_disabled = false;
      $scope.in_progress = false;
      $scope.status_text = "Not yet submitted.";

      $scope.getSubmitButtonText = function() {
        if ($scope.request.id) {
          return "Save";
        } else {
          return "Submit Request";
        }
      };

      $scope.getUrl = function() {
        if ($scope.request.id) {
          return "/rpc/project.update_project_request";
        } else {
          return "/rpc/project.create_project_request";
        }
      };

      $scope.saveChanges = function() {
        var url = $scope.getUrl();
        $scope.status_text = "Saving ...";
        console.log("%O", $scope.request);
        $scope.submit_disabled = true;
        $scope.in_progress = true;
        $http({method: "POST", url: url, data: $scope.request }).
            success(function(request, status) {
                $scope.submit_disabled = false;
                $scope.in_progress = false;
                $scope.status = status;
                angular.copy(request, $scope.request);
                console.log("saveChanges: request with id = %O", request);
                $scope.status_text = "Success!";
                $scope.onUpdate();
              }).
            error(function(data, status) {
                $scope.submit_disabled = false;
                $scope.in_progress = false;
                $scope.status = status;         
                $scope.status_text = "Failed.";
              });
      }
    },

    template: {% filter to_json -%}
      <div>
        <div class="row">
        <form class="well form-horizontal span6 pull-left float:left" novalidate method="post" accept-charset="utf-8">
          <div class="control-group">
            <label class="control-label" for="inputName">Name</label>
              <div class="controls">
                <input ng-model="request.project.name" type="text" id="inputName" placeholder="Project Name">
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputDescription">Description</label>
              <div class="controls">
                <textarea ng-model="request.project.description" rows=8 id="inputDescription"></textarea>
                <p class="muted">
                  [[ 'You may use <a href="url"> tags. ' | e ]]
                  <em>All other tags and attributes will be stripped out.</em>
                  The preview display lies.  The server will strip it out!
                </p>
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputURL">URL</label>
              <div class="controls">
                <input ng-model="request.project.url" type="text" id="inputURL" placeholder="Main URL">
              </div>
          </div>
          <div ng-switch on="type">
            <div ng-switch-when="BUILTWITH">
              <div class="control-group">
                <label class="control-label" for="inputThumbnailUrl">Thumbnail URL</label>
                  <div class="controls">
                    <input ng-model="request.thumbnail_url" type="text" id="inputThumbnailUrl" placeholder="http://">
                    <p class="muted">A copy of this image will be stored on the server and used.  This link must serve a jpeg or png image.</p>
                  </div>
              </div>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputTagsCsv">Tags (csv)</label>
              <div class="controls">
                <input ng-list ng-model="request.project.tags" type="text" id="inputTagsCsv" placeholder="Production, Animations, Open Source">
              </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="inputSubmitterEmail">Submitter E-mail</label>
              <div class="controls">
                <input ng-model="request.submitter_email" type="text" id="inputSubmitterEmail" placeholder="name@example.com">
                <p class="muted">We'll use this e-mail address to contact you with any questions we have about this submission.</p>
              </div>
          </div>
          <div class="form-actions">
            <button ng-click="saveChanges()" type="submit" ng-disabled="submit_disabled" class="btn btn-primary">
              {{getSubmitButtonText()}}
            </button>
            <span ng-show="in_progress">&nbsp;&nbsp;<i class="icon-spinner icon-spin"></i></span>
          </div>
        </form>
        <div class="span4 offset1">
          {# TODO(chirayu): Fix this to now use style.  Need a margin fixed heading tag. #}
          <div style="margin-top:-5em;"><h2>Preview</h2></div>
          <div class="well" preview-project-request></div>
        </div>
        </div>
        <br>
        <b>Status:</b> {{ status_text }}
      {%- endfilter %}
  };
};


directives.projectRequest = function () {
  console.log("directives.projectRequest");
  return {
    restrict: "A",
    scope: {
      request: "="
    },
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
          <div class="span10"><a href="{{request.project.url}}">{{request.project.url}}</a></div>
        </div>
        <div class="row">
          <div class="span2 pwa-item-label">Tags</div>
          <div class="span10">
            <span project-tags="request.project.tags"></span>
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
          <div class="span10" ng-show="request.project.thumbnail_url"><img ng-src="{{request.project.thumbnail_url}}"></div>
        </div>
        
      {%- endfilter %},
    link: function($scope) {
      console.log("projectInfoSmall: link: request = %O", $scope.request);
    }
  };
};


directives.projectRequestWithEdit = function () {
  console.log("directives.projectRequestWithEdit");
  return {
    restrict: "A",
    scope: {
      type: "=",
      request: "="
    },
    controller: function($scope, $http) {
      $scope.edit = function(request) {
        $scope.mode = "edit";
      }

      $scope.doneEditing = function(request) {
        $scope.mode = "display";
      }

      $scope.approve = function(request) {
        var url = "/rpc/project.approve_project_request";
        $scope.status_text = "Approving ...";
        console.log("%O", request);
        $http({method: "POST", url: url, data: request }).
            success(function(request, status) {
                $scope.status = status;
                console.log("Approved request: %O", request);
                $scope.status_text = "Success!";
                $scope.mode = "approved";
              }).
            error(function(data, status) {
                $scope.status = status;         
                $scope.status_text = "Failed.";
              });
      }

      $scope.reject = function(request) {
        var url = "/rpc/project.reject_project_request";
        $scope.status_text = "Rejecting ...";
        console.log("%O", request);
        $http({method: "POST", url: url, data: request }).
            success(function(request, status) {
                $scope.status = status;
                console.log("Rejected request: %O", request);
                $scope.status_text = "Success!";
                $scope.mode = "rejected";
              }).
            error(function(data, status) {
                $scope.status = status;         
                $scope.status_text = "Failed.";
              });
      }
    },

    link: function($scope, $http) {
      $scope.mode = "display";
      $scope.status_text = "Not yet submitted.";
    },

    template: {% filter to_json %}
      <div ng-switch on="mode">
        <div ng-switch-when="approved">
          <b>{{request.project.name}}</b>&nbsp;&nbsp;<span class="label label-success">Approved!</span>
        </div>
        <div ng-switch-when="rejected">
          <b>{{request.project.name}}</b>&nbsp;&nbsp;<span class="label label-warning">Rejected!</span>
        </div>
        <div ng-switch-when="edit">
          <div edit-project-request type="type" request="request" on-update="doneEditing()"></div>
        </div>
        <div ng-switch-when="display">
          <div project-request type="type" request="request"></div><br>
          <div class="center">
            <a ng-click="approve(request)" class="btn btn-primary"><i class="icon-ok icon-large"></i>
              Approve
            </a>
            <a ng-click="reject(request)" class="btn btn-danger"><i class="icon-trash icon-large"></i>
              Reject
            </a>
            <a ng-click="edit(request)" class="btn btn-info"><i class="icon-pencil icon-large"></i>
              Edit
            </a>
          </div>
          <br>
          <b>Status:</b> {{ status_text }}
        </div>
      </div>
        
      {%- endfilter %}
  };
};





playsWith.directive(directives);

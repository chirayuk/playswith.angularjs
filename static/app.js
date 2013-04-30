function load_projects($scope, $http) {
  var url = "/rpc/project.get_project_list";
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
  var url = "/rpc/project.get_project_request_list";
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
  load_project_requests($scope, $http);

});

var directives = playsWith.directives = {};

directives.projectInfoSmall = function () {
  console.log("directives.projectInfoSmall");
  return {
    restrict: "A",
    template: "<div>\n        <h3>{{project.name}}</h3>\n        <div ng-bind-html-unsafe=\"project.description\"></div>\n        <p>Website: <a rel=\"nofollow\" href=\"{{project.url}}\">{{project.url}}</a></p>\n        <span ng-show=\"project.tags\">\n          Tags: <span project-tags=\"project.tags\"></span>\n        </span>\n        <div ng-show=\"project.thumbnail_url\"><img ng-src=\"{{project.thumbnail_url}}\">\n      </div>",
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
    template: "<span class=\"label label-info bwa-tag\"\n            ng-repeat=\"tag in tags\">\n        {{tag}}\n      </span>",
  };
}


directives.previewProjectRequest = function () {
  console.log("directives.previewProjectRequest");
  return {
    restrict: "A",
    template: "<div style=\"well\">\n        <h3>{{request.project.name}}</h3>\n        <div ng-bind-html-unsafe=\"request.project.description\"></div>\n        <p ng-show=\"request.project.url\">Website: <a rel=\"nofollow\" href=\"{{request.project.url}}\">{{request.project.url}}</a></p>\n        <span ng-show=\"request.project.tags\">\n          Tags: <span project-tags=\"request.project.tags\"></span>\n        </span>\n        <div ng-show=\"request.thumbnail_url\"><img ng-src=\"{{request.thumbnail_url}}\">\n      </div>",
  };
}


directives.newProjectRequest = function () {
  console.log("directives.newProjectRequest");
  return {
    restrict: "A",

    controller: function ($scope, $http) {
      $scope.request = {project: {} };
      $scope.submit_disabled = false;
      $scope.status_text = "Not yet submitted.";

      $scope.addToPending = function() {
        var url = "/rpc/project.create_project_request";
        $scope.status_text = "Submitting ...";
        console.log("%O", $scope.request);
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

    template: "<div>\n        <h1>Submit a new project</h1>\n        <div class=\"row\">\n        <form class=\"well form-horizontal span6 pull-left float:left\" novalidate method=\"post\" accept-charset=\"utf-8\">\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputName\">Name</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.project.name\" type=\"text\" id=\"inputName\" placeholder=\"Project Name\">\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputDescription\">Description</label>\n              <div class=\"controls\">\n                <textarea ng-model=\"request.project.description\" rows=8 id=\"inputDescription\"></textarea>\n                <p class=\"muted\">\n                  You may use &lt;a href=&#34;url&#34;&gt; tags. \n                  <em>All other tags and attributes will be stripped out.</em>\n                  The preview display lies.  The server will strip it out!\n                </p>\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputURL\">URL</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.project.url\" type=\"text\" id=\"inputURL\" placeholder=\"Main URL\">\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputThumbnailUrl\">Thumbnail URL</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.thumbnail_url\" type=\"text\" id=\"inputThumbnailUrl\" placeholder=\"http://\">\n                <p class=\"muted\">A copy of this image will be stored on the server and used.  This link must serve a jpeg or png image.</p>\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputTagsCsv\">Tags (csv)</label>\n              <div class=\"controls\">\n                <input ng-list ng-model=\"request.project.tags\" type=\"text\" id=\"inputTagsCsv\" placeholder=\"Production, Animations, Open Source\">\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputSubmitterEmail\">Submitter E-mail</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.submitter_email\" type=\"text\" id=\"inputSubmitterEmail\" placeholder=\"name@example.com\">\n                <p class=\"muted\">We'll use this e-mail address to contact you with any questions we have about this submission.</p>\n              </div>\n          </div>\n          <div class=\"form-actions\">\n            <button ng-click=\"addToPending()\" type=\"submit\" ng-disabled=\"submit_disabled\" class=\"btn btn-primary\">Submit Request</button>\n          </div>\n        </form>\n        <div class=\"span4 offset1\">\n          \n          <div style=\"margin-top:-5em;\"><h2>Preview</h2></div>\n          <div class=\"well\" preview-project-request></div>\n        </div>\n        </div>\n        <br>\n        <b>Status:</b> {{ status_text }}",
    scope: {},
    link: function($scope) {
      console.log("newProjectRequest: link: request = %O", $scope.request);
    }
  };
};


directives.editProjectRequest = function () {
  console.log("directives.editProjectRequest");
  return {
    restrict: "A",
    scope: {
      request: "=",
      onUpdate: "&"
    },
    controller: function ($scope, $http) {
      $scope.submit_disabled = false;
      $scope.status_text = "Not yet submitted.";

      $scope.saveChanges = function() {
        var url = "/rpc/project.update_project_request";
        $scope.status_text = "Saving ...";
        console.log("%O", $scope.request);
        $scope.submit_disabled = true;
        $http({method: "POST", url: url, data: $scope.request }).
            success(function(request, status) {
                $scope.status = status;
                $scope.request = request;
                console.log("saveChanges: request with id = %O", request);
                $scope.status_text = "Success!";
                $scope.onUpdate();
              }).
            error(function(data, status) {
                $scope.status = status;         
                $scope.status_text = "Failed.";
                $scope.submit_disabled = false;
              });
      }
    },

    template: "<div>\n        <div class=\"row\">\n        <form class=\"well form-horizontal span6 pull-left float:left\" novalidate method=\"post\" accept-charset=\"utf-8\">\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputName\">Name</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.project.name\" type=\"text\" id=\"inputName\" placeholder=\"Project Name\">\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputDescription\">Description</label>\n              <div class=\"controls\">\n                <textarea ng-model=\"request.project.description\" rows=8 id=\"inputDescription\"></textarea>\n                <p class=\"muted\">\n                  You may use &lt;a href=&#34;url&#34;&gt; tags. \n                  <em>All other tags and attributes will be stripped out.</em>\n                  The preview display lies.  The server will strip it out!\n                </p>\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputURL\">URL</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.project.url\" type=\"text\" id=\"inputURL\" placeholder=\"Main URL\">\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputThumbnailUrl\">Thumbnail URL</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.thumbnail_url\" type=\"text\" id=\"inputThumbnailUrl\" placeholder=\"http://\">\n                <p class=\"muted\">A copy of this image will be stored on the server and used.  This link must serve a jpeg or png image.</p>\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputTagsCsv\">Tags (csv)</label>\n              <div class=\"controls\">\n                <input ng-list ng-model=\"request.project.tags\" type=\"text\" id=\"inputTagsCsv\" placeholder=\"Production, Animations, Open Source\">\n              </div>\n          </div>\n          <div class=\"control-group\">\n            <label class=\"control-label\" for=\"inputSubmitterEmail\">Submitter E-mail</label>\n              <div class=\"controls\">\n                <input ng-model=\"request.submitter_email\" type=\"text\" id=\"inputSubmitterEmail\" placeholder=\"name@example.com\">\n                <p class=\"muted\">We'll use this e-mail address to contact you with any questions we have about this submission.</p>\n              </div>\n          </div>\n          <div class=\"form-actions\">\n            <button ng-click=\"saveChanges()\" type=\"submit\" ng-disabled=\"submit_disabled\" class=\"btn btn-primary\">Submit Request</button>\n          </div>\n        </form>\n        <div class=\"span4 offset1\">\n          \n          <div style=\"margin-top:-5em;\"><h2>Preview</h2></div>\n          <div class=\"well\" preview-project-request></div>\n        </div>\n        </div>\n        <br>\n        <b>Status:</b> {{ status_text }}",
    link: function($scope) {
      console.log("editProjectRequest: link: request = %O", $scope.request);
    }
  };
};


directives.projectRequest = function () {
  console.log("directives.projectRequest");
  return {
    restrict: "A",
    scope: {
      request: "="
    },
    template: "\n      <div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Name</div>\n          <div class=\"span10\"><b>{{request.project.name}}</b></div>\n        </div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Description</div>\n          <div class=\"span10\" ng-bind-html-unsafe=\"request.project.description\"></div>\n        </div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Website</div>\n          <div class=\"span10\"><a href=\"{{request.project.url}}\">{{request.project.url}}</a></div>\n        </div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Tags</div>\n          <div class=\"span10\">\n            <span project-tags=\"request.project.tags\"></span>\n          </div>\n        </div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Submitter E-mail</div>\n          <div class=\"span10\">{{request.submitter_email}}</div>\n        </div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Submission time</div>\n          <div class=\"span10\">{{request.submission_timestamp | utcTimestampToDate:\"medium\" }}</div>\n        </div>\n        <div class=\"row\">\n          <div class=\"span2 pwa-item-label\">Thumbnail</div>\n          <div class=\"span10\" ng-show=\"request.project.thumbnail_url\"><img ng-src=\"{{request.project.thumbnail_url}}\"></div>\n        </div>",
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
                load_project_requests($scope, $http);
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
                load_project_requests($scope, $http);
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

    template: "\n      <div ng-switch on=\"mode\">\n        <div ng-switch-when=\"approved\">\n          <b>{{request.project.name}}</b>&nbsp;&nbsp;<span class=\"label label-success\">Approved!</span>\n        </div>\n        <div ng-switch-when=\"rejected\">\n          <b>{{request.project.name}}</b>&nbsp;&nbsp;<span class=\"label label-warning\">Rejected!</span>\n        </div>\n        <div ng-switch-when=\"edit\">\n          <div edit-project-request request=\"request\" on-update=\"doneEditing()\"></div>\n        </div>\n        <div ng-switch-when=\"display\">\n          <div ng-controller=\"projectRequestsController\" project-request request=\"request\"></div><br>\n          <div class=\"center\">\n            <a ng-click=\"approve(request)\" class=\"btn btn-primary\"><i class=\"icon-ok icon-large\"></i>\n              Approve\n            </a>\n            <a ng-click=\"reject(request)\" class=\"btn btn-danger\"><i class=\"icon-trash icon-large\"></i>\n              Reject\n            </a>\n            <a ng-click=\"edit(request)\" class=\"btn btn-info\"><i class=\"icon-pencil icon-large\"></i>\n              Edit\n            </a>\n          </div>\n          <br>\n          <b>Status:</b> {{ status_text }}\n        </div>\n      </div>"
  };
};





playsWith.directive(directives);
# -*- coding: UTF-8 -*-

import calendar
import io
import time
import yaml

import logging
logger = logging.getLogger(__name__)

from protorpc import message_types
from protorpc import remote

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb

import models

package = "org.angularjs.playswith"


class Error(Exception):
  pass



projects_list_json = yaml.load(io.StringIO(ur'''
# List of tools
-   name: Karma
    description: |
        Karma runs your unit tests faster than any other tool we know. The 1K+
        AngularJS tests run in ~3 seconds. It runs tests every time you save. It
        runs tests on real browsers including Android and iOS. It integrates with
        WebStorm's debugger. It works with any test framework, but comes with
        specific support for Jasmine and Mocha, and AngularJS' scenario runner. It
        will change your life. No, we can't believe the name either.
    tags:
    -   featured
    -   development
    -   testing

-   name: UglifyJS
    description: |
        AngularJS offers minified versions of all of its libraries, but what
        about your code? If you want your code to load quickly, this may be the
        tool for you!
    tags:
    -   featured
    -   deployment

-   name: YouTube on PS3
    thumbnail_url: http://builtwith.angularjs.org/projects/yt-ps3/thumb.png
    description: The YouTube application for Sony's PlayStation 3.
    url: http://us.playstation.com/youtube/
    info: http://youtube-global.blogspot.com/2012/08/game-on-get-new-youtube-app-for.html
    # submitter: alimills
    # submissionDate: "2012-08-14"
    tags:
    -   featured
    -   Production
    -   Entertainment
    -   Animations
    -   Local Storage
    -   Video API
    -   Google Closure
    -   No jQuery
  '''))


def get_project_request_by_id(project_request_id):
    project_request = ndb.Key(urlsafe=project_request_id).get()
    return project_request


class ViewService(remote.Service):
  @remote.method(message_types.VoidMessage, models.ProjectList)
  def get_project_list(self, request):
    query = models.ProjectModel.query()
    projects = query.iter()
    return models.ProjectList(projects=[project.msg for project in projects])

  # Admin/testing only.  Use create_request.
  @remote.method(models.Project, models.Project)
  def create_project(self, project):
    project_model = models.ProjectModel(msg=project)
    key = project_model.put()
    project.id = key.urlsafe()
    return project

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def create_project_request(self, project_request):
    project_request.id = None
    project_request.project.id = None
    project_request.project.thumbnail_key = None
    project_request.submission_timestamp = calendar.timegm(time.gmtime())
    project_request_model = models.ProjectRequestModel(msg=project_request)
    key = project_request_model.put()
    project_request.id = key.urlsafe()
    return project_request

  @remote.method(message_types.VoidMessage, models.ProjectRequestList)
  def get_project_request_list(self, request):
    query = models.ProjectRequestModel.query()
    project_models = list(query.iter())
    for model in project_models:
      model.msg.id = model.key.urlsafe()
      logging.warn("CKCK: id = {0}".format(model.key))
    return models.ProjectRequestList(requests=[model.msg for model in project_models])

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def approve_project_request(self, project_request):
    # TODO(chirayu): Ensure that this id exists.  Add more checks.
    project_request_model = get_project_request_by_id(project_request.id)
    # TODO(chirayu): Set the key based on the project_request_model key.
    project_model = models.ProjectModel(msg=project_request.project, parent=project_request_model.key)
    key = project_model.put()
    project_request.id = key.urlsafe()
    # TODO(chirayu): Create a link from this project to it's approval chain / history.
    project_request_model.key.delete()
    return project_request

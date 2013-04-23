# -*- coding: UTF-8 -*-

import io
import yaml

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


def get_pending_project_by_id(project_id):
    project_model = ndb.Key(urlsafe=project_id).get()
    return project_model


class ViewService(remote.Service):
  @remote.method(message_types.VoidMessage, models.ProjectList)
  def get_project_list_ckck(self, request):
    return models.ProjectList(projects=[
      models.Project(**project_json)
      for project_json in projects_list_json])

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

  @remote.method(models.Project, models.Project)
  def create_pending_project(self, project):
    project_model = models.PendingProjectModel(msg=project)
    key = project_model.put()
    project.id = key.urlsafe()
    return project

  @remote.method(message_types.VoidMessage, models.ProjectList)
  def get_pending_project_list(self, request):
    query = models.PendingProjectModel.query()
    project_models = list(query.iter())
    for model in project_models:
      model.msg.id = model.key.urlsafe()
    return models.ProjectList(projects=[model.msg for model in project_models])

  @remote.method(models.Project, models.Project)
  def approve_project(self, project):
    # TODO(chirayu): Ensure that this id exists.  Add more checks.
    pending_project_model = get_pending_project_by_id(project.id)
    project_model = models.ProjectModel(msg=pending_project_model.msg)
    key = project_model.put()
    project.id = key.urlsafe()
    # TODO(chirayu): Create a link from this project to it's approval chain / history.
    pending_project_model.key.delete()
    return project

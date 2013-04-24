# -*- coding: UTF-8 -*-

import calendar
import datetime
import io
import time
import yaml

from protorpc import message_types
from protorpc import remote

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb

import models

package = "org.angularjs.playswith"


class Error(Exception):
  pass


playswith_list_json = yaml.load(io.StringIO(ur'''
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
    info_url: http://youtube-global.blogspot.com/2012/08/game-on-get-new-youtube-app-for.html
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


def _project_json_to_project(project_json):
  # The json format is a modified version of the one from
  # builtwith.angularjs.org and contains fields some fields such as submission
  # date that are part of the request.  Remove those.
  project_json.pop("submissionDate", None)
  project_json.pop("submitter", None)
  def rename_field(old_name, new_name):
    value = project_json.pop(old_name, None)
    if value:
      project_json[new_name] = value
  rename_field("thumb", "thumbnail_url")
  rename_field("desc", "description")
  rename_field("src", "src_url")
  rename_field("info", "info_url")
  # thumbnail urls are relative.  Translate them.
  project_json["thumbnail_url"] = "/static/img/projects/{0}".format(
      project_json["thumbnail_url"])
  return project_json

def _get_default_projects_json():
  with io.open("rpc/test_projects.json", "rt", encoding="utf8") as f:
    builtwith_json = yaml.load(f)
  projects_json = map(_project_json_to_project, builtwith_json["projects"])
  return projects_json

def _get_default_projects():
  projects_json = _get_default_projects_json()
  return [models.Project(**project_dict) for project_dict in projects_json]


def _create_project(project):
  project_model = models.ProjectModel(msg=project)
  key = project_model.put()
  project.id = key.urlsafe()
  return project


class TestService(remote.Service):
  # Bootstrap some sample projects.
  @remote.method(message_types.VoidMessage, message_types.VoidMessage)
  def create_test_projects(self, request):
    projects = _get_default_projects()
    for project in projects:
      _create_project(project)
    return message_types.VoidMessage()

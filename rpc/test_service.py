# -*- coding: UTF-8 -*-

import calendar
import datetime
import io
import logging
import time
import yaml

from protorpc import message_types
from protorpc import remote

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb

import models

package = "org.angularjs.playswith"
logger = logging.getLogger(__name__)

class Error(Exception):
  pass


def _builtwith_project_json_to_project(project_json):
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

def _get_builtwith_default_projects_json():
  with io.open("rpc/test_projects.json", "rt", encoding="utf8") as f:
    builtwith_json = yaml.load(f)
  projects_json = map(_builtwith_project_json_to_project, builtwith_json["projects"])
  return projects_json

def _get_playswith_default_projects_json():
  with io.open("rpc/test_playswith_projects.yaml", "rt", encoding="utf8") as f:
    playswith_json = yaml.load(f)
  projects_json = []
  for category_dict in playswith_json:
    category_name = category_dict["category"]
    for project_dict in category_dict["projects"]:
      tags = project_dict.setdefault("tags", [])
      tags.append(category_name)
      projects_json.append(project_dict)
  return projects_json

def _get_default_projects():
  projects_json = _get_builtwith_default_projects_json()
  return [models.Project(**project_dict) for project_dict in projects_json]

def _get_default_projects():
  projects_json = _get_playswith_default_projects_json()
  return [models.Project(**project_dict) for project_dict in projects_json]


def _create_project(project):
  models.sanitize_project(project)
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

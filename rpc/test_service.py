# -*- coding: UTF-8 -*-

import calendar
import datetime
import io
import logging
import os
import time
import yaml

from protorpc import messages
from protorpc import message_types
from protorpc import remote

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb

import key_ids
import models
import playswith_model
import utils

from . import playswith_page_service

package = "org.angularjs.playswith"
logger = logging.getLogger(__name__)

class Error(Exception):
  pass


class DebugDump(messages.Message):
  text = messages.StringField(1)

def _get_root_url():
  assert "HTTP_HOST" in os.environ and "HTTPS" in os.environ
  host = os.environ["HTTP_HOST"]
  scheme = ("http", "https")[os.environ["HTTPS"] == "on"]
  return "{0}://{1}".format(scheme, host)

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
  project_json["type"] = models.Project.Type.BUILTWITH
  return project_json

def _get_builtwith_default_projects_json():
  with io.open("rpc/test_projects.json", "rt", encoding="utf8") as f:
    builtwith_json = yaml.load(f)
  projects_json = [_builtwith_project_json_to_project(project)
                   for project in builtwith_json["projects"]]
  return projects_json

def _get_playswith_default_projects_json():
  with io.open("rpc/test_playswith_projects.yaml", "rt", encoding="utf8") as f:
    playswith_json = yaml.load(f)
  projects_json = []
  for category_dict in playswith_json:
    category_name = category_dict["category"]
    for project_dict in category_dict["projects"]:
      tags = project_dict.setdefault("tags", [])
      project_dict["type"] = models.Project.Type.PLAYSWITH
      tags.append(category_name)
      projects_json.append(project_dict)
  return projects_json


def _get_default_projects():
  projects_json = (_get_playswith_default_projects_json() +
                   _get_builtwith_default_projects_json())
  return [models.Project(**project_dict) for project_dict in projects_json]


def _create_project(project, id=None):
  models.sanitize_project(project)
  project_model = models.ProjectModel(msg=project, id=id)
  key = project_model.put()
  project.id = key.urlsafe()
  return project


# Define some yaml helpers here.

def parse_yaml_section(loader, node):
  return playswith_model.Section(
      **loader.construct_mapping(node, deep=True))
yaml.add_constructor(u"!section", parse_yaml_section)

def parse_yaml_playswith_homepage(loader, node):
  return playswith_model.HomePage(
      **loader.construct_mapping(node, deep=True))
yaml.add_constructor(u"!playswith_homepage", parse_yaml_playswith_homepage)


def _get_playswith_homepage():
  with io.open("seed_data/playswith_homepage.yaml", "rt", encoding="utf8") as f:
    homepage = yaml.load(f)
    logger.info("_get_playswith_homepage: %r", homepage)
    return homepage

def _get_playswith_homepage_model():
  homepage = _get_playswith_homepage()
  model = playswith_model.HomePageModel(
      msg=homepage, id=key_ids.PLAYSWITH_HOMEPAGE_ID)
  return model

def _get_playswith_homepage_expanded_model():
  homepage = _get_playswith_homepage()
  homepage_expanded = playswith_page_service.expand_homepage(homepage)
  model = playswith_model.HomePageExpandedModel(
      msg=homepage_expanded, id=key_ids.PLAYSWITH_HOMEPAGE_ID)
  return model

def _lookup_playswith_homepage_model():
  key = ndb.Key(playswith_model.HomePageModel, key_ids.PLAYSWITH_HOMEPAGE_ID)
  return key.get()

def _lookup_playswith_homepage_expanded_model():
  key = ndb.Key(playswith_model.HomePageExpandedModel, key_ids.PLAYSWITH_HOMEPAGE_ID)
  return key.get()


class TestService(remote.Service):
  @remote.method(message_types.VoidMessage, DebugDump)
  @utils.log_exceptions
  def debug_dump(self, request):
    import os, pprint
    text=pprint.pformat(sorted(os.environ.items()))
    print text
    return DebugDump(text=text)

  # Bootstrap some sample projects.
  @remote.method(message_types.VoidMessage, message_types.VoidMessage)
  @utils.log_exceptions
  def create_test_projects(self, request):
    projects = _get_default_projects()
    for project in projects:
      _create_project(project, id=project.name)
    return message_types.VoidMessage()

  # Bootstrap the playswith homepage.
  @remote.method(message_types.VoidMessage, message_types.VoidMessage)
  @utils.log_exceptions
  def create_playswith_homepage(self, request):
    homepage_model = _get_playswith_homepage_model()
    homepage_model.put()
    return message_types.VoidMessage()

  @remote.method(message_types.VoidMessage, message_types.VoidMessage)
  @utils.log_exceptions
  def create_playswith_homepage_expanded(self, request):
    homepage_expanded_model = _get_playswith_homepage_expanded_model()
    homepage_expanded_model.put()
    return message_types.VoidMessage()

  @remote.method(message_types.VoidMessage, playswith_model.HomePage)
  def lookup_playswith_homepage(self, request):
    return _lookup_playswith_homepage_model().msg

  @remote.method(message_types.VoidMessage, playswith_model.HomePageExpanded)
  def lookup_playswith_homepage_expanded(self, request):
    return _lookup_playswith_homepage_expanded_model().msg

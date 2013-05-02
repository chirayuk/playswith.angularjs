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

import key_ids
import models
import playswith_model

package = "org.angularjs.playswith"


class Error(Exception):
  pass


def get_homepage_model():
  key = ndb.Key(playswith_model.HomePageModel, key_ids.PLAYSWITH_HOMEPAGE_ID)
  return key.get()

def get_homepage_expanded_model():
  key = ndb.Key(playswith_model.HomePageExpandedModel, key_ids.PLAYSWITH_HOMEPAGE_ID)
  return key.get()


def expand_section(section):
  # Inline the projects by fetching them from the db.
  project_keys = [ndb.Key(models.ProjectModel, project_id)
      for project_id in section.project_ids]
  project_models = ndb.get_multi(project_keys)
  return playswith_model.SectionExpanded(
      title=section.title,
      description=section.description,
      projects=[project_model.msg for project_model in project_models
                if project_model])

def expand_homepage(homepage):
  return playswith_model.HomePageExpanded(
      title=homepage.title,
      description=homepage.description,
      sections=[expand_section(section) for section in homepage.sections])


class PlayswithPageService(remote.Service):
  @remote.method(message_types.VoidMessage, playswith_model.HomePage)
  def get_homepage(self, request):
    model = get_homepage_model()
    return model.msg

  @remote.method(message_types.VoidMessage, playswith_model.HomePageExpanded)
  def get_homepage_expanded(self, request):
    model = get_homepage_expanded_model()
    return model.msg

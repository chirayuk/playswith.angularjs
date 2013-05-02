# -*- coding: UTF-8 -*-

from protorpc import messages
from protorpc import remote
from protorpc.wsgi import service

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb

import models
import sanitize

package = "org.angularjs.playswith"


class Section(messages.Message):
  title  = messages.StringField(1, required=True)
  description  = messages.StringField(2)
  project_ids = messages.StringField(3, repeated=True)


def sanitize_section(section):
  if section.description:
    section.description = sanitize.sanitize_html(section.description)


class SectionExpanded(messages.Message):
  title  = messages.StringField(1, required=True)
  description  = messages.StringField(2)
  projects = messages.MessageField(models.Project, 3, repeated=True)


class HomePage(messages.Message):
  title  = messages.StringField(1, required=True)
  description  = messages.StringField(2)
  sections = messages.MessageField(Section, 3, repeated=True)


def sanitize_homepage(homepage):
  if homepage.description:
    homepage.description = sanitize.sanitize_html(homepage.description)


class HomePageExpanded(messages.Message):
  title  = messages.StringField(1, required=True)
  description  = messages.StringField(2)
  sections = messages.MessageField(SectionExpanded, 3, repeated=True)


class HomePageModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(HomePage)


class HomePageExpandedModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(HomePageExpanded)


class StartupData(messages.Message):
  homepage = messages.MessageField(HomePage, 1)
  projects = messages.MessageField(models.Project, 2, repeated=True)

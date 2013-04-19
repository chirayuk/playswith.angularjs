# -*- coding: UTF-8 -*-

from protorpc import messages
from protorpc import remote
from protorpc.wsgi import service

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb


package = "org.angularjs.playswith"


class Project(messages.Message):
  id  = messages.StringField(1)
  name  = messages.StringField(2)
  description  = messages.StringField(3)
  tags  = messages.StringField(4, repeated=True)
  url  = messages.StringField(5)
  info  = messages.StringField(6)
  thumbnail_url  = messages.StringField(7)
  # submitter  = messages.StringField(3, repeated=True)
  # submissionDate  = messages.StringField(3, repeated=True)


class ProjectModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(
      Project,
      indexed_fields=[
          "id",
          "name",
          "description",
          "tags",
          "info",
          ]
      )


class PendingProjectModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(
      Project,
      indexed_fields=[
          "id",
          "name",
          "description",
          "tags",
          "info",
          ]
      )


class ProjectList(messages.Message):
  projects = messages.MessageField(Project, 1, repeated=True)

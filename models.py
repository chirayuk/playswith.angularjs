# -*- coding: UTF-8 -*-

from protorpc import messages
from protorpc import remote
from protorpc.wsgi import service

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb

import sanitize

package = "org.angularjs.playswith"


class Project(messages.Message):
  id  = messages.StringField(1)
  name  = messages.StringField(2)
  description  = messages.StringField(3)
  tags  = messages.StringField(4, repeated=True)
  url  = messages.StringField(5)
  info_url  = messages.StringField(6)
  src_url  = messages.StringField(7)
  thumbnail_url  = messages.StringField(8)


def sanitize_project(project):
  if project.description:
    project.description = sanitize.sanitize_html(project.description)
  if project.url:
    project.url = sanitize.sanitize_url(project.url)
  if project.info_url:
    project.info_url = sanitize.sanitize_url(project.info_url)
  if project.src_url:
    project.src_url = sanitize.sanitize_url(project.src_url)
  # Thumbnail URLs should always point back to our server.
  if project.thumbnail_url and not project.thumbnail_url.startswith("/"):
    project.thumbnail_url = None


class ProjectModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(
      Project,
      indexed_fields=[
          "id",
          "name",
          "tags",
          ]
      )


class ProjectRequest(messages.Message):
  id  = messages.StringField(1)
  project = messages.MessageField(Project, 2)
  thumbnail_url = messages.StringField(3)
  submitter_email = messages.StringField(4)
  submission_timestamp  = messages.IntegerField(5)
  notes = messages.StringField(6)


class ProjectRequestModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(
      ProjectRequest,
      indexed_fields=[
          "project.id",
          "project.name",
          "project.tags",
          "submitter_email",
          ]
      )


class ApprovedProjectRequestModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(
      ProjectRequest,
      indexed_fields=[
          "project.id",
          "project.name",
          "project.tags",
          "submitter_email",
          ]
      )

class RejectedProjectRequestModel(ndb.Model):
  msg = ndb.msgprop.MessageProperty(
      ProjectRequest,
      indexed_fields=[
          "project.id",
          "project.name",
          "project.tags",
          "submitter_email",
          ]
      )



class ProjectList(messages.Message):
  projects = messages.MessageField(Project, 1, repeated=True)


class ProjectRequestList(messages.Message):
  requests = messages.MessageField(ProjectRequest, 1, repeated=True)

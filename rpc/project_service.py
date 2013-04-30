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
import image_utils

package = "org.angularjs.playswith"


class Error(Exception):
  pass



def get_project_request_by_id(project_request_id):
    project_request = ndb.Key(urlsafe=project_request_id).get()
    return project_request


class ProjectService(remote.Service):
  @remote.method(message_types.VoidMessage, models.ProjectList)
  def get_project_list(self, request):
    query = models.ProjectModel.query()
    projects = query.iter()
    return models.ProjectList(projects=[project.msg for project in projects])

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def create_project_request(self, project_request):
    project_request.id = None
    project_request.project.id = None
    thumbnail_url = project_request.thumbnail_url
    if thumbnail_url:
      image_info = image_utils.save_image_to_blobstore(project_request.thumbnail_url)
      thumbnail_url = image_utils.make_image_url(image_info)
      project_request.project.thumbnail_url = thumbnail_url
      project_request.thumbnail_url = thumbnail_url
    project_request.submission_timestamp = calendar.timegm(time.gmtime())
    models.sanitize_project(project_request.project)
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
    approved_model = models.ApprovedProjectRequestModel(
        msg=project_request, parent=project_request_model.key)
    approved_model.put()
    project_model = models.ProjectModel(msg=project_request.project, parent=project_request_model.key)
    key = project_model.put()
    project_request.id = key.urlsafe()
    project_request_model.key.delete()
    return project_request

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def reject_project_request(self, project_request):
    project_request_model = get_project_request_by_id(project_request.id)
    rejected_model = models.RejectedProjectRequestModel(
        msg=project_request, parent=project_request_model.key)
    key = rejected_model.put()
    project_request.id = key.urlsafe()
    project_request_model.key.delete()
    return project_request

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
  try:
    project_request_id = int(project_request_id)
  except ValueError:
    pass
  key = ndb.Key(models.ProjectRequestModel, project_request_id)
  return key.get()


def get_project_list(type):
  query = models.ProjectModel.query(
      models.ProjectModel.msg.type == type)
  project_models = list(query.iter())
  for project_model in project_models:
    project_model.msg.id = str(project_model.key.id())
  return models.ProjectList(projects=[
      project_model.msg for project_model in project_models])


class ProjectService(remote.Service):
  @remote.method(models.ProjectTypeQuery, models.ProjectList)
  def get_project_list(self, request):
    return get_project_list(type=request.type)

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
    project_request.id = str(key.id())
    return project_request

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def update_project_request(self, project_request):
    # TODO(chirayu): Add history entry.
    project_request_model = get_project_request_by_id(project_request.id)
    orig_thumbnail_url = project_request_model.msg.thumbnail_url
    new_thumbnail_url = project_request.thumbnail_url
    if not new_thumbnail_url:
      project_request_model.msg.project.thumbnail_url = None
      project_request_model.msg.thumbnail_url = None
    elif new_thumbnail_url != orig_thumbnail_url:
      image_info = image_utils.save_image_to_blobstore(new_thumbnail_url)
      saved_thumbnail_url = image_utils.make_image_url(image_info)
      project_request.project.thumbnail_url = saved_thumbnail_url
      project_request.thumbnail_url = saved_thumbnail_url
    project_request.submission_timestamp = calendar.timegm(time.gmtime())
    models.sanitize_project(project_request.project)
    project_request_model.msg = project_request
    project_request_model.put()
    return project_request


  @remote.method(models.ProjectTypeQuery, models.ProjectRequestList)
  def get_project_request_list(self, request):
    query = models.ProjectRequestModel.query(
        models.ProjectRequestModel.msg.project.type == request.type)
    project_models = list(query.iter())
    for model in project_models:
      model.msg.id = str(model.key.id())
    return models.ProjectRequestList(requests=[model.msg for model in project_models])

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def approve_project_request(self, project_request):
    # TODO(chirayu): Ensure that this id exists.  Add more checks.
    # TODO(chirayu): Add history entry.
    project_request_model = get_project_request_by_id(project_request.id)
    approved_model = models.ApprovedProjectRequestModel(
        msg=project_request, parent=project_request_model.key)
    approved_model.put()
    project_model = models.ProjectModel(msg=project_request.project, parent=project_request_model.key)
    key = project_model.put()
    project_request.id = str(key.id())
    project_request_model.key.delete()
    return project_request

  @remote.method(models.ProjectRequest, models.ProjectRequest)
  def reject_project_request(self, project_request):
    # TODO(chirayu): Add history entry.
    project_request_model = get_project_request_by_id(project_request.id)
    rejected_model = models.RejectedProjectRequestModel(
        msg=project_request, parent=project_request_model.key)
    key = rejected_model.put()
    project_request.id = str(key.id())
    project_request_model.key.delete()
    return project_request

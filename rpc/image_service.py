# -*- coding: UTF-8 -*-

import calendar
import io
import time
import yaml

import logging
logger = logging.getLogger(__name__)
import mimetypes
import urlparse

from protorpc import message_types
from protorpc import remote

import google.appengine.ext.ndb.msgprop
ndb = google.appengine.ext.ndb
from google.appengine.api import urlfetch
from google.appengine.api import files
from google.appengine.ext import blobstore


import models

package = "org.angularjs.playswith"


class Error(Exception):
  pass


MAX_IMAGE_SIZE_BYTES = 750*1024;


def load_thumbnail_url(url):
  response = urlfetch.fetch(url, deadline=30)
  if len(response.content) > MAX_IMAGE_SIZE_BYTES:
    raise urlfetch.ResponseTooLargeError()
  return response


def guess_mimetype_from_url(url):
  path_part = urlparse.urlparse(url).path
  mimetype, unused_encoding = mimetypes.guess_type(path_part)
  return mimetype


# Returns a blobkey corresponding to the saved image.
def store_image_in_blobstore(url):
  image_bytes = load_thumbnail_url(url).content
  mimetype = guess_mimetype_from_url(url)
  blobstore_filename = files.blobstore.create(mime_type=mimetype)
  with files.open(blobstore_filename, 'a') as f:
      f.write(image_bytes)
  files.finalize(blobstore_filename)
  blob_key = files.blobstore.get_blob_key(blobstore_filename)
  logger.info("CKCK: image blob key = %s", str(blob_key))
  # TODO(chirayu): Need to store the blob key in the db and then refer to that
  # for the thumbnail_url in the projects.  Seeded projects should bypass the
  # blobstore since the data is available statically.
  return blob_key

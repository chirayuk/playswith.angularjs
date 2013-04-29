# -*- coding: UTF-8 -*-

import logging
logger = logging.getLogger(__name__)
import mimetypes
import urlparse

from protorpc import messages, protobuf
from google.appengine.api import urlfetch
from google.appengine.api import files
from google.appengine.ext import blobstore

package = "org.angularjs.playswith"

import sign

class Error(Exception):
  pass


MAX_IMAGE_SIZE_BYTES = 750*1024;


class ImageInfo(messages.Message):
  blobkey_str = messages.StringField(1)
  mimetype = messages.StringField(2)


def encode_image_info(image_info):
  return sign.default_serializer.dumps(protobuf.encode_message(image_info))

def decode_image_info(blob):
  serialized_protobuf = sign.default_serializer.loads(blob)
  return protobuf.decode_message(ImageInfo, serialized_protobuf)

def load_image_from_url(url):
  response = urlfetch.fetch(url, deadline=30)
  if len(response.content) > MAX_IMAGE_SIZE_BYTES:
    raise urlfetch.ResponseTooLargeError()
  return response


def guess_mimetype_from_url(url):
  path_part = urlparse.urlparse(url).path
  mimetype, unused_encoding = mimetypes.guess_type(path_part)
  return mimetype

# TODO(chirayu):  Dedupe by sha1's or something.  Or will it not matter?
# Returns a blobkey corresponding to the saved image.
def save_image_to_blobstore(url):
  image_bytes = load_image_from_url(url).content
  mimetype = guess_mimetype_from_url(url)
  blobstore_filename = files.blobstore.create(mime_type=mimetype)
  with files.open(blobstore_filename, 'a') as f:
      f.write(image_bytes)
  files.finalize(blobstore_filename)
  blob_key = files.blobstore.get_blob_key(blobstore_filename)
  image_info = ImageInfo(
      blobkey_str=str(blob_key),
      mimetype=mimetype)
  return image_info


def make_image_url(image_info):
  image_url = "/serve_blob/{0}{1}".format(
      encode_image_info(image_info),
      mimetypes.guess_extension(image_info.mimetype))
  return image_url

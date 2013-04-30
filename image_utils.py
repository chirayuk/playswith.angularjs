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

import serialize
import sign
import utils

class Error(Exception):
  pass


MAX_IMAGE_SIZE_BYTES = 750*1024;

# http://www.libpng.org/pub/png/book/chapter08.html#png.ch08.div.2
PNG_FILE_PREFIX =  b"\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"
JPEG_FILE_PREFIX = b"\xFF\xD8\xFF"
JPEG_FILE_SUFFIX = b"\xFF\xD9"


class ImageInfo(messages.Message):
  blobkey = messages.StringField(1)
  mimetype = messages.StringField(2)


@utils.log_exceptions
def encode_image_info(image_info):
  text = "{0}{1}".format(
      image_info.blobkey,
      mimetypes.guess_extension(image_info.mimetype))
  return sign.default_signer.sign(text)

@utils.log_exceptions
def decode_image_info(blob):
  text = sign.default_signer.unsign(blob)
  blobkey, extension = text.rsplit(".", 1)
  mimetype = mimetypes.types_map["." + extension]
  return ImageInfo(blobkey=blobkey, mimetype=mimetype)

@utils.log_exceptions
def load_image_from_url(url):
  response = urlfetch.fetch(url, deadline=30)
  assert isinstance(response.content, bytes)
  if len(response.content) > MAX_IMAGE_SIZE_BYTES:
    raise urlfetch.ResponseTooLargeError()
  if len(response.content) < 10:
    raise Error("Content too small.  Invalid image.")
  return response


@utils.log_exceptions
def guess_mimetype_from_url(url):
  path_part = urlparse.urlparse(url).path
  mimetype, unused_encoding = mimetypes.guess_type(path_part)
  return mimetype


# Hosting 3rd party content is tricky especially when done on the same domain.
# Only hosting images and sanitizing html completely (only simple <a> tags
# allowed) helps us a lot.
# Browsers might content sniff if the Content Type differs even slightly from
# the acutal content.  We want to ensure that we only serve a matching content
# type.  For now, we try to stay safe by only supporting png and jpeg via
# explicit magic number checks.
@utils.log_exceptions
def guess_mimetype_from_contents(blob):
  if blob.startswith(PNG_FILE_PREFIX):
    return "image/png"
  elif blob.startswith(JPEG_FILE_PREFIX) and blob.endswith(JPEG_FILE_SUFFIX):
    return "image/jpeg"
  else:
    return None


# TODO(chirayu):  Dedupe by sha1's or something.  Or will it not matter?
# Returns a blobkey corresponding to the saved image.
@utils.log_exceptions
def save_image_to_blobstore(url):
  image_bytes = load_image_from_url(url).content
  mimetype = guess_mimetype_from_contents(image_bytes)
  if not mimetype:
    raise Error("Could not determine mime type.  "
                "Only png and jpeg files are allowed.")
  blobstore_filename = files.blobstore.create(mime_type=mimetype)
  with files.open(blobstore_filename, 'ab') as f:
      f.write(image_bytes)
  files.finalize(blobstore_filename)
  blob_key = files.blobstore.get_blob_key(blobstore_filename)
  image_info = ImageInfo(
      blobkey=str(blob_key),
      mimetype=mimetype)
  return image_info


@utils.log_exceptions
def make_image_url(image_info):
  image_url = "/serve_blob/{0}{1}".format(
      encode_image_info(image_info),
      mimetypes.guess_extension(image_info.mimetype))
  return image_url

# -*- coding: UTF-8 -*-

import config
import flask
import mimetypes
from google.appengine.ext import blobstore
import google.appengine.ext.ndb

import image_utils

app = wsgi_app = flask.Flask(__name__)
jinja_env = config.jinja_env


# We save on a db hit by decoding the signed url to directly extract the
# blobkey and mimetype.
# We are hosting third party images so we try to be a little secure with some
# additional headers.
@app.route('/serve_blob/<encoded_image_info>')
def serve_blob(encoded_image_info):
  # Strip extension.
  encoded_image_info = encoded_image_info.rsplit(".", 1)[0]
  # Decode to ImageInfo.
  image_info = image_utils.decode_image_info(encoded_image_info)
  filename = "image{0}".format(
      mimetypes.guess_extension(image_info.mimetype))
  content_disposition = "attachment; filename=\"{0}\"".format(filename)
  headers = {
    blobstore.BLOB_KEY_HEADER: image_info.blobkey_str,
    "Content-Type": image_info.mimetype,
    "Content-Disposition": content_disposition,
    "X-Content-Type-Options": "nosniff",
    }
  return (u"", 200, headers)


@app.route('/ckck')
def hello_world():
  return 'Hello World!'


# TODO(chirayu): Disable in production mode.
app.config.update(DEBUG=True)

if __name__ == '__main__':
  app.debug = True
  app.run()

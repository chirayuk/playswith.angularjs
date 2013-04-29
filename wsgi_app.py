# -*- coding: UTF-8 -*-

import config
import flask
from google.appengine.ext import blobstore
import google.appengine.ext.ndb


app = wsgi_app = flask.Flask(__name__)
jinja_env = config.jinja_env


@app.route('/serve_blob/<blobkey>')
def serve_blob(blobkey):
  blob_key = blobstore.BlobKey(blobkey)
  # TODO(chirayu): Don't serve off of blobkey's and don't leak them.
  headers = {
    blobstore.BLOB_KEY_HEADER: str(blob_key),
    "Content-Type": "image/png",
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

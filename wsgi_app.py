# -*- coding: UTF-8 -*-

import config
jinja_env = config.jinja_env

from flask import Flask
app = wsgi_app = Flask(__name__)


@app.route('/ckck')
def hello_world():
    return 'Hello World!'


# TODO(chirayu): Disable in production mode.
app.config.update(DEBUG=True)

if __name__ == '__main__':
  app.debug = True
  app.run()

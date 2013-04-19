# -*- coding: UTF-8 -*-

import codecs
import jinja2
import json

class JinjaExtras(dict):
  def __init__(self):
    self.globals = {}
    self.filters = {}

  def register_filter(self, fn):
    self.filters[fn.__name__] = fn
    return fn

  def register_global(self, fn):
    self.globals[fn.__name__] = fn
    return fn

  def update_jinja_env(self, jinja_env):
    jinja_env.globals.update(self.globals)
    jinja_env.filters.update(self.filters)
    return jinja_env

JINJA_EXTRAS = JinjaExtras()


@JINJA_EXTRAS.register_global
def get_file_contents(fname):
  return codecs.open(fname, "rt", encoding="utf8").read()

@JINJA_EXTRAS.register_global
def get_file_contents_as_json(fname):
  return json.dumps(get_file_contents(fname))

@JINJA_EXTRAS.register_filter
def to_json(text):
  return json.dumps(text)


def get_jinja_env(templates_root_dir):
  jinja_env = jinja2.Environment(
      loader=jinja2.FileSystemLoader(templates_root_dir),
      trim_blocks=False,
      variable_start_string="[[", # Don't conflict with AngularJS' {{
      variable_end_string="]]", # Don't conflict with AngularJS' {{
      )
  return jinja_env


# Get rid of config.py.
ROOT_DIR = __file__.rsplit("/", 1)[0]
jinja_env = get_jinja_env(templates_root_dir=ROOT_DIR)
jinja_env = JINJA_EXTRAS.update_jinja_env(jinja_env)

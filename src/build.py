#!/usr/bin/env python
# -*- coding: utf-8 -*-

import codecs, logging, glob, sys, os
from config import jinja_env

logger = logging.getLogger(__name__)


def render_template(template_fname):
  template = jinja_env.get_template(template_fname)
  return template.render()

def render_templates_to_file(template_fnames, target_fname):
  if isinstance(template_fnames, basestring):
    template_fnames = (template_fnames,)
  dirname = os.path.dirname(target_fname)
  if dirname and not os.path.isdir(dirname):
    os.makedirs(dirname)
  with codecs.open(target_fname, "wt", encoding="utf8") as target:
    for template_fname in template_fnames:
      target.write(render_template(template_fname))


def build_all():
  # Render src files.
  for (srcs, target) in (
      (["src/angular.min.js",
        "src/app.js",
       ], "static/all.js"),
      ("src/app.js", "static/app.js"),
      ("src/index.html", "index.html"),
      # playswith
      ("src/playswith/playswith.html", "static/playswith/index.html"),
      ("src/playswith/create.html", "static/playswith/create.html"),
      ("src/playswith/pending.html", "static/playswith/pending.html"),
      ("src/playswith/edit_homepage.html", "static/playswith/edit_homepage.html"),
      # builtwith
      ("src/builtwith/builtwith.html", "static/builtwith/index.html"),
      ("src/builtwith/create.html", "static/builtwith/create.html"),
      ("src/builtwith/pending.html", "static/builtwith/pending.html"),
      # CSS
      (["src/css/bootstrap.min.css",
        "src/css/docs.css",
        "src/css/font-awesome.min.css",
        "src/css/select2.css",
        "src/css/bwa.css",
        "src/app.css",
       ], "static/app.css"),
      ):
    render_templates_to_file(srcs, target)

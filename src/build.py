#!/usr/bin/env python
# -*- coding: utf-8 -*-

import codecs, logging, glob, sys
from config import jinja_env

logger = logging.getLogger(__name__)


def render_template(template_fname):
  template = jinja_env.get_template(template_fname)
  return template.render()

def render_templates_to_file(template_fnames, target_fname):
  if isinstance(template_fnames, basestring):
    template_fnames = (template_fnames,)
  with codecs.open(target_fname, "wt", encoding="utf8") as target:
    for template_fname in template_fnames:
      target.write(render_template(template_fname))


def build_all():
  render_templates_to_file("src/index.html", "index.html")
  # Render src files.
  for (srcs, target) in (
      (["src/angular.min.js",
        "src/app.js",
       ], "static/all.js"),
      ("src/app.js", "static/app.js"),
      ("src/pending.html", "static/pending.html"),
      ("src/create_project.html", "static/create_project.html"),
      (["src/css/bootstrap.min.css",
        "src/css/docs.css",
        "src/css/font-awesome.css",
       ], "static/playswith.css"),
      ):
    render_templates_to_file(srcs, target)

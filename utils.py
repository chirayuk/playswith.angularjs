# -*- coding: UTF-8 -*-

import logging
logger = logging.getLogger(__name__)
import functools
import traceback

def log_exceptions(fn):
  def wrapped_fn(*args, **kwargs):
    try:
      return fn(*args, **kwargs)
    except Exception as e:
      logging.error(traceback.format_exc())
      raise
  return functools.update_wrapper(wrapped_fn, fn)

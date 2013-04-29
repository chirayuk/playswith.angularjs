# -*- coding: utf-8 -*-

import logging
logger = logging.getLogger(__name__)

import itsdangerous

class Error(Exception):
  pass


# TODO(chirayu): This shouldn't stick around in source code!  Not yet
# production ready (like many other parts of this repo.)
SIGNING_KEY = ""


# Default signer object.
default_serializer = itsdangerous.URLSafeSerializer(SIGNING_KEY)

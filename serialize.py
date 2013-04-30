# -*- coding: utf-8 -*-

import logging
logger = logging.getLogger(__name__)
import base64
from protorpc import protobuf, protojson


def base64_encode(blob):
  return base64.b64encode(blob, "_-").rstrip(b"=")

def base64_decode(blob):
  return base64.b64decode(blob + b"==", "_-")


def base64_encode_proto(proto_message):
  return base64_encode(protobuf.encode_message(proto_message))

def base64_decode_proto(proto_class, blob):
  return protobuf.decode_message(proto_class, base64_decode(blob))


def json_encode_proto(proto_message):
  return protojson.encode_message(proto_message)

def json_decode_proto(proto_class, blob):
  return protojson.decode_message(proto_class, blob)

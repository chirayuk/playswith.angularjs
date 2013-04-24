# -*- coding: utf-8 -*-

import logging
logger = logging.getLogger(__name__)
import io
import urlescape
import urllib
import urlparse

import lxml.etree
import markupsafe


def sanitize_url(url):
  parsed = urlparse.urlparse(url)
  if parsed.scheme not in ("http", "https"):
    return None
  if not parsed.netloc:
    return None
  # The path can contain <, etc. characters.  Re-encode it.
  # Why isn't there something in the stdlib to do stuff like this?
  parsed = parsed._replace(
      path=urllib.quote(urllib.unquote(parsed.path)),
      netloc=urllib.quote(urllib.unquote(parsed.netloc)),
      query=urllib.quote(urllib.unquote(parsed.query)),
      fragment=urllib.quote(urllib.unquote(parsed.fragment)),
      )
  url = urlparse.urlunparse(parsed)
  return urlescape.parse(url).escape().punycode().utf8()


# The only allowed tag is the <a> tag.  The only valid attribute on that tag is
# the href tag.  The value of the url is also sanitized.  Everything else is
# stripped.
def _sanitize_nodes(nodes, buffer):
  for node in nodes:
    if node.tag == "body":
      _sanitize_nodes(node.getchildren(), buffer)
    elif node.tag == "p":
      if node.text:
        buffer.write(markupsafe.escape(node.text))
      _sanitize_nodes(node.getchildren(), buffer)
      buffer.write(u" ")
      if node.tail:
        buffer.write(markupsafe.escape(node.tail))
    elif node.tag == "a":
      url = sanitize_url(node.get("href"))
      if url:
        buffer.write(u"<a href=\"{0}\">".format(url))
        buffer.write(markupsafe.escape(node.text))
        _sanitize_nodes(node.getchildren(), buffer)
        buffer.write(u"</a>")
      buffer.write(markupsafe.escape(node.tail))
    else:
      buffer.write(markupsafe.escape(node.tail))


def sanitize_html(text):
  buffer = io.StringIO()
  html = lxml.etree.HTML(text)
  body = html.getchildren()[0]
  _sanitize_nodes(body.getchildren(), buffer)
  return buffer.getvalue().strip()

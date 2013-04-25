# -*- coding: utf-8 -*-

import sanitize
from nose.tools import *

sanitize_url_test_cases = (
    # No change.
    (u"http://www.google.com/", u"http://www.google.com"),
    (u"https://www.google.com/", u"https://www.google.com"),
    # Invalid.
    (None, u"http"),
    # Javascript.
    (None, u"javascript:"),
    (None, u"javascript:alert(1)"),
    # File.
    (None, u"file:///etc/passwd"),
    # Quoting.
    (u"http://www.google.com/a%20b%20c", u"http://www.google.com/a b c"),
    (u"http://www.google.com/b%22%3Cb%3Ec", u"http://www.google.com/b\"<b>c"),
    # Closing a quote and starting a script tag in the path.
    (u"http://www.google.com/%22%3Cscript%3E", u"http://www.google.com/\"<script>"),
    # Closing a quote and starting a script tag in the path.
    (u"http://%22%3cscript%3e/", u"http://\"<script>/"),
    (u"CKCK", u"http://example.com/[0xFC]"),
  )

def sanitize_url_and_assert(expected_url, given_url):
  assert_equals(expected_url, sanitize.sanitize_url(given_url))

def sanitize_url_tests():
  for expected_url, given_url in sanitize_url_test_cases:
    yield sanitize_url_and_assert, expected_url, given_url


sanitize_html_test_cases = (
    (u"hello", u"hello"),
    (u"hello", u"<p>hello</p>"),
    (u"hel l o", u"<p>hel<p>l</p>o</p>"),
    (u"hello world", u"hello<div>there</div>world"),
    # Closing unopened tags.
    (u"hello world", u"</html></span>hello<div>there</div>world"),
    # Test some urls.
    (u"hello world <a href=\"http://www.google.com/\">google</a>.",
     u"hello world <a href=\"http://www.google.com\">google</a>."),
    # Other attribs on a tags should be stripped.
    (u"hello world <a href=\"http://www.google.com/\">google</a>.",
     u"hello world <a href=\"http://www.google.com\" onclick='alert(1);'>google</a>."),
    # If there's no destination, it should go away.
    (u"hello world .",
     u"hello world <a href=\"\" onclick='alert(1);'>google</a>."),
    # All Non-http urls including javascript: should be rejected.
    (u"hello world .",
     u"hello world <a href=\"javascript:alert(1)\">google</a>."),
  )

def sanitize_html_and_assert(expected_html, given_html):
  assert_equals(expected_html, sanitize.sanitize_html(given_html))

def sanitize_html_tests():
  for expected_html, given_html in sanitize_html_test_cases:
    yield sanitize_html_and_assert, expected_html, given_html

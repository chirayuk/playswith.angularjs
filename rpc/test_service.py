# -*- coding: UTF-8 -*-

import datetime

from protorpc import messages
from protorpc import message_types
from protorpc import remote
from protorpc.wsgi import service

package = "org.angularjs.playswith"


class TimeOfDayResponse(messages.Message):
  now_string = messages.StringField(1, required=True)


class TestService(remote.Service):
  @remote.method(message_types.VoidMessage, TimeOfDayResponse)
  def get_current_time(self, request):
    return TimeOfDayResponse(now_string=unicode(datetime.datetime.now()))

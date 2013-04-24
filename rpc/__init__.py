# -*- coding: UTF-8 -*-

from protorpc.wsgi import service
from protorpc.webapp import forms

from . import test_service
from . import view_service

package = "org.angularjs.playswith"

mapping = [
    ("/rpc/test", test_service.TestService),
    ("/rpc/view", view_service.ViewService),
    ]

app = service.service_mappings(mapping, registry_path="/protorpc")

# -*- coding: UTF-8 -*-

from protorpc.wsgi import service

from . import test_service
from . import view_service

package = "org.angularjs.playswith"

app = service.service_mappings([
    ("/rpc/test", test_service.TestService),
    ("/rpc/view", view_service.ViewService),
    ])

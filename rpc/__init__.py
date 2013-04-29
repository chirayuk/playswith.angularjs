# -*- coding: UTF-8 -*-

import logging
logger = logging.getLogger(__name__)
import traceback

from protorpc.wsgi import service
from protorpc.webapp import forms

from . import test_service
from . import project_service

package = "org.angularjs.playswith"

mapping = [
    ("/rpc/test", test_service.TestService),
    ("/rpc/project", project_service.ProjectService),
    ]

app = service.service_mappings(mapping, registry_path="/protorpc")

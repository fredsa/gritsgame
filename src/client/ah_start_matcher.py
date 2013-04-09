'''Copyright 2011 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.'''


from google.appengine.api import apiproxy_stub_map
from google.appengine.api import backends
from google.appengine.api import runtime
from google.appengine.api import users

from google.appengine.ext import webapp

from google.appengine.ext.webapp import template

import cgi
import datetime
import logging
import os
import urllib

from client import db_api


#my_name = '%s.%s (%s)' % (backends.get_backend(), backends.get_instance(), backends.get_url())

logging.info('registering shutdown hook')


def my_shutdown_hook():
  logging.warning('shutdown hook called')
  apiproxy_stub_map.apiproxy.CancelApiCalls()
  # save_state()
  # May want to raise an exception

# register our shutdown hook, which is not guaranteed to be called
runtime.set_shutdown_hook(my_shutdown_hook)


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

import datetime
import logging


_NAME = '{}.{} {} ({})'.format(backends.get_backend(),
                               backends.get_instance(),
                               backends.get_url(),
                               datetime.datetime.now())


def my_shutdown_hook():
  logging.warning('{} SHUTDOWN HOOK CALLED'.format(_NAME))
  apiproxy_stub_map.apiproxy.CancelApiCalls()
  # save_state()
  # May want to raise an exception

# register our shutdown hook, which is not guaranteed to be called
logging.info('{} REGISTERING SHUTDOWN HOOK'.format(_NAME))
runtime.set_shutdown_hook(my_shutdown_hook)

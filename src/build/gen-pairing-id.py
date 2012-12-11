#!/usr/bin/env python
# Copyright 2012 Google Inc. All Rights Reserved.

import base64
import os
import json
import getpass

__author__ = 'ctiller@google.com (Craig Tiller)'

data = {
  'key': base64.urlsafe_b64encode(os.urandom(18)),
  'creator': getpass.getuser(),
}

f = open('shared/pairing-key.json', 'w')
f.write(json.dumps(data))
f.close()

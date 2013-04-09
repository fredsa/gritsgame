#!/usr/bin/env python2.7

import json
import logging
import os
import pprint as pp
import sys
import unittest
import urllib2

try:
  from webtest import TestApp
except:
  print """Please install webtest from http://webtest.pythonpaste.org/"""
  sys.exit(1)

# Attempt to locate the App Engine SDK based on the system PATH
for d in sorted(os.environ['PATH'].split(os.path.pathsep)):
  path = os.path.join(d, 'dev_appserver.py')
  if not os.path.isfile(path):
    continue
  print 'Found the App Engine SDK directory: %s' % d
  sys.path.insert(0, d)


# The App Engine SDK root is now expected to be in sys.path (possibly provided via PYTHONPATH)
try:
  import dev_appserver
except ImportError:

  error_msg = ('The path to the App Engine Python SDK must be in the '
               'PYTHONPATH environment variable to run unittests.')

  # The app engine SDK isn't in sys.path. If we're on Windows, we can try to
  # guess where it is.
  import platform
  if platform.system() == 'Windows':
    sys.path = sys.path + ['C:\\Program Files\\Google\\google_appengine']
    try:
      import dev_appserver  # pylint: disable-msg=C6204
    except ImportError:
      print error_msg
      raise
  else:
    print error_msg
    raise

# add App Engine libraries
sys.path += dev_appserver.EXTRA_PATHS


from google.appengine.ext import testbed
from google.appengine.api import backends


class HttpMatcherTest(unittest.TestCase):

  def verifyNodeJsServerRunning(self):
    url = 'http://127.0.0.1:12345/ping'
    try:
      result = urllib2.urlopen(url)
      r = json.loads(result.read())
      logging.debug('%s -> %s' % (url, r))
      self._serverid = r['serverid']
    except urllib2.URLError, e:
      self.fail('Node.js games-server must be running. Could not connect to %s\n%s' % (url, e))


  def get(self, *args, **kwargs):
    result = self.app.get(*args, **kwargs)
    logging.debug('self.app.get %s %s -> %s' % (args, kwargs, result.body))
    return result


  def post(self, *args, **kwargs):
    result = self.app.post(*args, **kwargs)
    logging.debug('self.app.post %s %s -> %s' % (args, kwargs, result.body ))
    return result


  def setUp(self):
    # see testbed docs https://developers.google.com/appengine/docs/python/tools/localunittesting
    self.testbed = testbed.Testbed()
    self.testbed.activate()
    self.testbed.init_memcache_stub()
    self.testbed.init_datastore_v3_stub()
    self.testbed.init_urlfetch_stub()

    # Pretend we're a matcher backend
    self.assertEquals(None, backends.get_backend())
    self.save_get_backend = backends.get_backend
    backends.get_backend = lambda: 'matcher'
    self.assertEquals('matcher', backends.get_backend())

    # create TestApp wrapper around client.main.app
    from client import main
    main._JSON_ENCODER.indent = None
    self.app = TestApp(main.app)

    #
    self.verifyNodeJsServerRunning()

    # no maximum length for diffs
    self.maxDiff = None



  def tearDown(self):
    # restore patched methods
    backends.get_backend = self.save_get_backend

    self.testbed.deactivate()


  def test_list_games_starts_emtpy(self):
    res = self.get('/list-games')
    self.assertEquals('{}', res.body)


  def test_start_game(self):
    res = self.get('/start-game')
    r = json.loads(res.body)
    self.assertIn('no-available-servers' , r.get('result'))


  def test_start_game2(self):
    self.assertTrue(self._serverid)
    expected_req = { 'controller_port': 12345, 'serverid': self._serverid, 'pairing_key': 'XXXXXXXXXXXXXXXXXXXXXX' }
    expected_res = { 'backend': 'matcher', 'controller_host': '127.0.0.1:12345', 'success': True }
    # TODO ensure that in this post, self.request.remote_addr = 127.0.0.1
    res = self.post('/register-controller', json.dumps(expected_req), extra_environ={'REMOTE_ADDR': '127.0.0.1'})
    r = res.json
    self.assertEquals(True, r.get('success'))
    self.assertEquals(expected_res, r)

    self.verifyNodeJsServerRunning()

    res = self.get('/start-game')
    r = res.json
    self.assertEquals(True, r.get('success'))
    name = r.get('name')
    self.assertTrue(len(name))
    time = r.get('time')
    self.assertTrue(time > 0)

    game_state = r.get(u'game_state')
    self.assertEquals(8, game_state.get(u'max_players'))
    self.assertEquals(1, game_state.get(u'min_players'))
    self.assertEquals({}, game_state.get(u'players'))

    self.assertEquals(name, r.get(u'name'))
    self.assertTrue(r.get(u'success'))
    self.assertEquals(time, r.get(u'time'))
    self.assertEquals(self._serverid, r.get(u'serverid'))
    self.assertEquals(u'127.0.0.1:12345', r.get(u'controller_host'))
    self.assertEquals(u'http://127.0.0.1:9090/%s' % name, r.get(u'gameURL'))
    self.assertEquals(9090, r.get(u'port'))


if __name__ == '__main__':
    unittest.main()

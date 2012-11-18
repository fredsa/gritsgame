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




def make_state(serverid, extras=None):
  """Create test game server state."""

  # something pseudo predictable / stable
  uptime = hash(serverid) / 1e16
  result = { 'serverid': serverid, 'uptime': uptime }
  if extras:
    result.update(extras)
  return result


def make_game(serverid, name, extras=None):
  """Create test game instance."""

  result = {
    'serverid': serverid,
    'name': name,
    'game_state': {'players': {}, 'min_players': 2, 'max_players': 4},
  }
  if extras:
    result.update(extras)
  return result



class MatchMakerTest(unittest.TestCase):


  def setUp(self):
    # see testbed docs https://developers.google.com/appengine/docs/python/tools/localunittesting
    self.testbed = testbed.Testbed()
    self.testbed.activate()
    self.testbed.init_memcache_stub()
    self.testbed.init_datastore_v3_stub()
    self.testbed.init_urlfetch_stub()

    # import matcher now that testbed has been activated
    from client import matcher

    # instatiate a new matcher
    self.mm = matcher.MatchMaker()

    # no maximum length for diffs
    self.maxDiff = None


  def tearDown(self):
    self.testbed.deactivate()


  def assertGameServers(self, expected_game_servers):
    """Assert the global game servers state."""

    if expected_game_servers != self.mm._game_servers:
      self.fail('Unexpected game servers state:\n----------\nEXPECTED:\n%s\n\nACTUAL:\n%s\n----------' % (expected_game_servers, self.mm._game_servers))
    #self.assertEquals(expected_game_servers, self.mm._game_servers)


  def assertPlayerGameState(self, expected_game, player_game):
    """Assert a specifc game state."""

    self.assertIn('game', player_game)
    self.assertIn('player_game_key', player_game)
    self.assertEquals(expected_game, player_game['game'])


  def assertGameServerWait(self, players_needed_for_next_game, pg):
    """Assert that the player is being asked to wait."""

    self.assertEquals({'result': 'wait', 'players_needed_for_next_game': players_needed_for_next_game}, pg)



  #######################################################################
  # tests to verify server and game updates
  #######################################################################



  def test_initialized_state(self):
    self.assertGameServers({})


  def test_update_server_info(self):
    self.assertGameServers({})
    state_foo = make_state('foo')
    expected = { 'foo':
                        { 'server_info': state_foo,
                          'games': {},
                        }
               }

    self.mm.update_server_info(state_foo)
    self.assertGameServers(expected)


  def test_update_server_info_twice(self):
    state_foo = make_state('foo')
    state_bar = make_state('bar')
    expected = { 'foo':
                        { 'server_info': state_foo,
                          'games': {},
                        },
                 'bar':
                        { 'server_info': state_bar,
                          'games': {},
                        },
               }

    self.assertGameServers({})
    self.mm.update_server_info(state_foo)
    self.mm.update_server_info(state_bar)
    self.assertGameServers(expected)


  def test_update_server_info_thrice(self):
    state_foo1 = make_state('foo', {'update': 17} )
    state_foo2 = make_state('foo', {'update': 42} )
    state_bar  = make_state('bar')
    expected = { 'foo':
                        { 'server_info': state_foo2,
                          'games': {},
                        },
                 'bar':
                        { 'server_info': state_bar,
                          'games': {},
                        },
               }

    self.assertGameServers({})
    self.mm.update_server_info(state_foo1)
    self.mm.update_server_info(state_bar)
    self.mm.update_server_info(state_foo2)
    self.assertGameServers(expected)


  def test_del_server_info(self):
    state_foo = make_state('foo')
    state_bar = make_state('bar')
    expected = { 'bar':
                        { 'server_info': state_bar,
                          'games': {},
                        },
               }

    self.assertGameServers({})
    self.mm.update_server_info(state_foo)
    self.mm.update_server_info(state_bar)
    self.mm.del_game_server('foo')
    self.assertGameServers(expected)


  def test_update_game(self):
    state_foo = make_state('foo')
    game_abcd = make_game('foo', 'abcd')
    expected = { 'foo':
                        { 'server_info': state_foo,
                          'games': { 'abcd' : game_abcd,
                                       }
                        }
               }

    self.assertGameServers({})
    self.mm.update_server_info(state_foo)
    self.mm.update_game(game_abcd)
    self.assertGameServers(expected)



  #######################################################################
  # tests to verify match making
  #######################################################################



  def test_do_not_find_full_game(self):
    state_foo = make_state('foo')
    game_abcd = make_game('foo', 'abcd', {'game_state': {'players': {}, 'min_players': 0, 'max_players': 0}})
    self.mm.update_server_info(state_foo)
    # we have a game, but no players are needed
    self.mm.update_game(game_abcd)
    # do not find full game
    pg = self.mm.find_player_game('fred')
    self.assertGameServerWait(-1, pg)


  def test_find_single_player_game(self):
    state_foo = make_state('foo')
    game_abcd = make_game('foo', 'abcd', {'game_state': {'players': {}, 'min_players': 1, 'max_players': 1}})
    self.mm.update_server_info(state_foo)

    # no available game yet
    pg = self.mm.find_player_game('fred')
    self.assertGameServerWait(-1, pg)

    # game_abcd becomes available
    self.mm.update_game(game_abcd)

    # we should find it
    pg = self.mm.find_player_game('fred')
    self.assertPlayerGameState(game_abcd, pg)

    # we should find it again
    pg = self.mm.lookup_player_game('fred')
    self.assertPlayerGameState(game_abcd, pg)


  def test_wait_for_enough_players(self):
    state_foo = make_state('foo')
    # only 3 game slots remaining
    game_abcd = make_game('foo', 'abcd', {'game_state': {'players': {}, 'min_players': 1, 'max_players': 1}})
    game_efgh = make_game('foo', 'efgh', {'game_state': {'players': {}, 'min_players': 2, 'max_players': 2}})
    self.mm.update_server_info(state_foo)
    self.mm.update_game(game_abcd)
    self.mm.update_game(game_efgh)

    # player1 enters game_abcd
    pg = self.mm.find_player_game('player1')
    self.assertPlayerGameState(game_abcd, pg)

    # player2 waits for a second player
    pg = self.mm.find_player_game('player2')
    self.assertGameServerWait(2, pg)

    # player3 enters game_efgh
    pg = self.mm.find_player_game('player3')
    self.assertPlayerGameState(game_efgh, pg)

    # player4 does not get in
    pg = self.mm.find_player_game('player4')
    self.assertGameServerWait(-1, pg)

    # player2 finally enter game_efgh
    pg = self.mm.lookup_player_game('player2')
    self.assertPlayerGameState(game_efgh, pg)


  def test_honor_max_players(self):
    state_foo = make_state('foo')
    # only 3 game slots remaining
    game_abcd = make_game('foo', 'abcd', {'game_state': {'players': {}, 'min_players': 2, 'max_players': 4}})
    self.mm.update_server_info(state_foo)

    # player1 is told that a new game needs to be spun up
    pg = self.mm.find_player_game('player1')
    self.assertGameServerWait(-1, pg)

    # a new game is made available
    self.mm.update_game(game_abcd)

    # player1 is told 2 players are required
    pg = self.mm.find_player_game('player1')
    self.assertGameServerWait(2, pg)

    # player2 allows the game to start
    pg = self.mm.find_player_game('player2')
    self.assertPlayerGameState(game_abcd, pg)

    # player3 drops in
    pg = self.mm.find_player_game('player3')
    self.assertPlayerGameState(game_abcd, pg)

    # player4 drops in
    pg = self.mm.find_player_game('player4')
    self.assertPlayerGameState(game_abcd, pg)

    # player5 does not get in
    pg = self.mm.find_player_game('player5')
    self.assertGameServerWait(-1, pg)


if __name__ == '__main__':
    unittest.main()

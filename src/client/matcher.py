'''Copyright 2011 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
#limitations under the License.'''

from google.appengine.api import backends
from google.appengine.api import users

import copy
import logging
import pprint as pp
import random
import sys

from client import db_api


def e(msg):
  """Convient method to raise an exception."""

  raise Exception(repr(msg))


def w(msg):
  """Log a warning message."""

  logging.warning('##### %s' % repr(msg))



class MatchMaker:
  """
   Multiple player match making service, allowing players
   to come together in an arena to show off their skills.


  _game_servers =
    { serverid1: <server_struct>,
      serverid2: <server_struct>,
    }

  <server_struct> =
    { 'server_info': <server_info>,
      'games': { name1: <game>,
                 name2: <game>,
               },
    }

  <server_info> =
    { 'serverid': ...,
      'uptime': ...,
    }

  <game> =
    { serverid': ...,
      'name': 'mPdn',
      'gameURL': 'http://127.0.0.1:8081/mPdn',
      'port': 8081,
      'controller_host': '127.0.0.1:12345',
      'game_state': {'players': {'324324382934982374823748923': '!1'}, 'min_players': 2, 'max_players': 8},
    }

  """

  _EMPTY_SERVER = { 'games' : {} }


  def __init__(self):
    self._game_servers = {}
    self._players_waiting = []
    self._players_playing = {}


  def get_game_server_struct(self, serverid):
    assert serverid
    return self._game_servers.get(serverid, None)


  def get_game_server_info(self, serverid):
    assert serverid
    server_struct = self.get_game_server_struct(serverid)
    return server_struct['server_info']

  def _set_game_server_struct(self, serverid, server_struct):
    self._game_servers[serverid] = server_struct


  def _set_game_server_info(self, serverid, server_info):
    assert serverid
    assert server_info
    server_struct = self.get_game_server_struct(serverid)
    if not server_struct:
      server_struct = copy.deepcopy(MatchMaker._EMPTY_SERVER)
      self._set_game_server_struct(serverid, server_struct)
    server_struct['server_info'] = server_info


  def get_state(self):
    return {
      'game_servers': self._game_servers,
      'players_waiting': self._players_waiting,
      'players_playing': self._players_playing,
    }


  def get_game_servers(self):
    return self._game_servers


  def del_game_server(self, serverid):
    del self._game_servers[serverid]
    remove = []
    for player, player_game in self._players_playing.iteritems():
      game = player_game['game']
      if game['serverid'] == serverid:
        remove.append(player)
    for r in remove:
      self._players_playing.pop(r)


  def update_player_names(self, serverid, game_name, new_game_state):
    server_struct = self.get_game_server_struct(serverid)
    games = server_struct['games']
    game = games[game_name]
    game_state = game['game_state']
    players = game_state['players']
    new_players = new_game_state['players']
    logging.info('Updating %s with %s' % (repr(players), repr(new_players)))
    assert isinstance(players, dict)
    assert isinstance(new_players, dict)
    players.update(new_players)


  def update_server_info(self, server_info):
    serverid = server_info['serverid']
    self._set_game_server_info(serverid, server_info)


  def update_game(self, game):
    serverid = game['serverid']
    name = game['name']
    assert serverid in self._game_servers

    server_struct = self.get_game_server_struct(serverid)
    games = server_struct['games']
    games[name] = game


  def del_game(self, serverid, game_name):
    server_struct = self.get_game_server_struct(serverid)
    games = server_struct['games']
    game = games[game_name]
    game_state = game['game_state']
    players = game_state['players']
    for p in players:
      self._players_playing.pop(p)
    del games[game_name]


  def _add_player(self, userID, game):
    assert isinstance(userID, str)
    game_state = game['game_state']
    min_players = int(game_state['min_players'])
    max_players = int(game_state['max_players'])
    players = game_state['players']
    assert max_players >= min_players
    assert len(players) < max_players
    assert userID not in game_state['players']
    players[userID] = 'TBD'
    self._players_playing[userID] = {
      'game': game,
      'player_game_key': str(random.randint(-sys.maxint, sys.maxint)),
      'userID': userID, # used by Android client
    }


  def make_matches(self):
    if not self._players_waiting:
      return
    # TODO match based on skills instead of capacity
    players_needed_for_next_game = self.make_matches_min_players()
    if self._players_waiting:
      self.make_matches_max_players()
    return players_needed_for_next_game

  def make_matches_min_players(self):
    players_needed_for_next_game = -1
    for server_struct in self._game_servers.itervalues():
      for game in server_struct['games'].itervalues():
        game_state = game['game_state']
        players_in_game = game_state['players']
        player_goal = int(game_state['min_players'])
        players_needed = player_goal - len(players_in_game)
        if not players_needed:
          continue
        if len(self._players_waiting) >= players_needed:
          # let's get this party started
          while len(players_in_game) < player_goal:
            self._add_player(self._players_waiting.pop(0), game)
        elif (players_needed_for_next_game == -1
              or players_needed < players_needed_for_next_game):
            players_needed_for_next_game = players_needed
    return players_needed_for_next_game

  def make_matches_max_players(self):
    for server_struct in self._game_servers.itervalues():
      for game in server_struct['games'].itervalues():
        game_state = game['game_state']
        players_in_game = game_state['players']
        if len(players_in_game) < int(game_state['min_players']):
          continue
        player_goal = int(game_state['max_players'])
        if len(players_in_game) == player_goal:
          continue
        while self._players_waiting and len(players_in_game) < player_goal:
          self._add_player(self._players_waiting.pop(0), game)


  def lookup_player_game(self, userID):
    assert isinstance(userID, str)
    return self._players_playing.get(userID, None)


  def find_player_game(self, userID):
    assert isinstance(userID, str)
    if userID not in self._players_waiting:
      self._players_waiting.append(userID)

    players_needed_for_next_game = self.make_matches()

    if userID in self._players_waiting:
      #logging.info('find_player_game: %s must wait a little bit longer' % userID)
      return {'result': 'wait', 'players_needed_for_next_game': players_needed_for_next_game}

    player_game = self._players_playing.get(userID, None)
    if not player_game:
      raise Exception('userID %s is not in self._players_playing' % userID)
    return player_game


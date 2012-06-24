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

from client import db_api
from client import matcher

from google.appengine.api import app_identity
from google.appengine.api import backends
from google.appengine.api import oauth
from google.appengine.api import urlfetch
from google.appengine.api import users

from google.appengine.api.urlfetch import fetch

import cgi
import datetime
import json
import logging
import os
import pprint as pp
import random
import sys
import traceback
import urllib
import webapp2


# constants
_DEBUG = True
_JSON_ENCODER = json.JSONEncoder()

if _DEBUG:
  _JSON_ENCODER.indent = 4
  _JSON_ENCODER.sort_keys = True

if backends.get_backend() == 'matcher':
  _match_maker = matcher.MatchMaker()

_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email"
_IS_DEVELOPMENT = os.environ['SERVER_SOFTWARE'].startswith('Development/')

#######################################################################
# common functions
#######################################################################

def tojson(python_object):
  """Helper function to output and optionally pretty print JSON."""
  return _JSON_ENCODER.encode(python_object)


def fromjson(msg):
  """Helper function to ingest JSON."""
  try:
    return json.loads(msg)
  except Exception, e:
    raise Exception('Unable to parse as JSON: %s' % msg)

_PAIRING_KEY = fromjson(open('shared/pairing-key.json').read())['key']

def fetchjson(url, deadline, payload=None):
  """Fetch a remote JSON payload."""

  method = "GET"
  headers = {}
  if payload:
    method = "POST"
    headers['Content-Type'] = 'application/json'
  result = fetch(url, method=method, payload=payload, headers=headers, deadline=deadline).content
  return fromjson(result)


def json_by_default_dispatcher(router, request, response):
  """WSGI router which defaults to 'application/json'."""

  response.content_type = 'application/json'
  return router.default_dispatcher(request, response)


def e(msg):
  """Convient method to raise an exception."""

  raise Exception(repr(msg))


def w(msg):
  """Log a warning message."""

  logging.warning('##### %s' % repr(msg))





#######################################################################
# frontend related stuff
#######################################################################



# frontend handler
class FrontendHandler(webapp2.RequestHandler):

  def determine_user(self):
    userID = self.request.get('userID')
    if userID:
      if _IS_DEVELOPMENT:
        return userID, self.request.get('displayName', userID)
      if userID.startswith('bot*'):
        # we'll use the userID as the displayName
        return userID, userID
    try:
      # TODO avoid http://en.wikipedia.org/wiki/Confused_deputy_problem
      user = oauth.get_current_user(_EMAIL_SCOPE)
      # TODO instead get a suitable displayName from https://www.googleapis.com/auth/userinfo.profile
      return user.user_id(), user.nickname() # '0', 'example@example.com' in dev_appserver
    except oauth.OAuthRequestError:
      raise Exception("""OAuth2 credentials -or- a valid 'bot*...' userID must be provided""")


# frontend handler
class LoginHandler(FrontendHandler):

  def post(self):
    # for the admin only auth form
    self.get()

  def get(self):
     config = db_api.getConfig(self.request.host_url)
     if not config:
       self.request_init()
       return

     redirectUri = '%s/logup.html' % self.request.host_url
     authScope = 'https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/plus.me+https://www.googleapis.com/auth/plus.people.recommended';
     returnto = self.request.get('redirect_uri')
     authUri = 'http://accounts.google.com/o/oauth2/auth'
     authUri += '?scope=' + authScope
     authUri += '&redirect_uri=' + redirectUri
     authUri += '&response_type=token'
     authUri += '&client_id=' + str(config.client_id)
     #authUri += '&state=' + returnto

     self.response.headers['Access-Control-Allow-Origin'] = '*'
     logging.debug('authUri=%s' % authUri)
     self.redirect(authUri)

  def request_init(self):
     user = users.get_current_user()
     if user:
       if users.is_current_user_admin():
         client_id = self.request.get('client_id')
         client_secret = self.request.get('client_secret')
         api_key = self.request.get('api_key')
         if client_id and client_secret and api_key:
           db_api.setConfig(self.request.host_url, client_id, client_secret, api_key)
           body = 'Thank you! You may now <a href="javascript:window.location.reload();">reload</a> this page.'
         else:
           body = """Please enter the following information from the
                     <a href="https://developers.google.com/console" target="_blank">Developer Console<a> <b>%s</b> project:<br><br>
                     <form method="post">
                       <h3>Client ID for web applications<h3>
                       client_id:<input name="client_id"><br>
                       client_secret:<input name="client_secret"><br>

                       <h3>Simple API Access<h3>
                       api_key:<input name="api_key"><br>
                       <input type="submit">
                     </form>""" % self.request.host_url
       else:
         body = 'You (%s) are not an admin. Please <a href="%s">logout</a>.' % (user.email(), users.create_logout_url(self.request.path))
     else:
       body = 'Please <a href="%s">login</a> as an admin.' % users.create_login_url(self.request.path)
     self.response.headers['Content-Type'] = 'text/html'
     self.response.write('<html><body><h1>Datastore configuration</h1>%s</body></html>' % body)



# frontend handler
class Login(FrontendHandler):

  def post(self):
    self.response.headers['Access-Control-Allow-Origin'] = '*'
    userID, displayName = self.determine_user()

    usr = db_api.getUser(userID)
    if not usr:
      usr = db_api.newUser(userID, displayName)
    r = {'userID': userID, 'displayName': displayName}

    self.response.write(tojson(r) + '\n')


# frontend handler
class GritsService(FrontendHandler):

  # TODO per client (userID) throttling to limit abuse
  def post(self, fcn):
    logging.info('%s ...' % self.request.url)
    if not fcn:
      fcn = self.request.get('fcn')
      if fnc:
        # TODO remove once there are no more uses of ?fcn=... in our code
        logging.warning('Please use /grits/%s/?foo=... instead of /grits/?fcn=%s&foo=...' % (fnc, fnc))
    self.response.headers['Access-Control-Allow-Origin'] = '*'

    userID, displayName = self.determine_user()

    usr = db_api.getUser(userID)
    if not usr:
      if userID.startswith('bot*'):
        usr = db_api.newUser(userID, displayName)
      else:
        self.response.set_status(404)
        self.response.write('Grits userID not found: ' + userID)
        return

    if fcn == 'getProfile':
      r = {'userID': userID, 'credits': str(usr.credits), 'numWins': str(usr.numWins), 'virtualItems': usr.virtualItems}
      self.response.write(tojson(r))
    elif fcn == 'getFriends':
      self.getFriends(userID)
    elif fcn == 'buyItem':
      itemID = self.request.get('itemID')
      if not itemID:
        self.response.set_status(400)
        self.response.write('Grits itemID is required')
        return
      r = db_api.userAttemptToBuy(userID, itemID)
      self.response.write(tojson(r))
    elif fcn == 'findGame':
      self.findGame(userID)
    else:
      self.response.set_status(400)
      self.response.write('Bad grits request.')

  def findGame(self, userID):
    # forward the request to the matcher backend
    url = '%s/find-game/%s' % (backends.get_url(backend='matcher', instance=None, protocol='HTTP'), userID)
    payload = '{}'
    resp = urlfetch.fetch(url=url,
                          payload=payload,
                          method=urlfetch.POST,
                          headers={'Content-Type': 'application/json'})
    self.response.set_status(resp.status_code)
    self.response.headers.update(resp.headers)
    self.response.write(resp.content)
    logging.info('%s -> %s -> %s' % (repr(payload), url, resp.content))
	
  def getFriends(self, userID):
        config = db_api.getConfig(self.request.host_url)
        assert config.api_key
	token = self.request.get('accessToken')
	reqUri = 'https://www.googleapis.com/plus/v1games/people/me/people/recommended';
	reqUri += '?key=' + config.api_key;
	reqUri += '&access_token=' + token;
	result = fetchjson(reqUri, None)
	self.response.write(tojson(result))
	#self.response.headers['Content-Type'] = 'application/json'
	#self.response.headers['Access-Control-Allow-Origin'] = '*'
	#self.redirect(reqUri)


# frontend handler
class PurchaseService(FrontendHandler):

  def get(self):
    iap.serverPurchasePostback(self)


# frontend handler
class SharedJsonAssets(FrontendHandler):

  def get(self, filename):
    f = open(filename, 'r')
    self.response.write(f.read())
    f.close()




#######################################################################
# 'matcher' backend related stuff
#######################################################################


# 'matcher' backend handler
class JsonHandler(webapp2.RequestHandler):
  """Convenience class for handling JSON requests."""

  def handle(self, params, *args):
    raise Exception('subclasses must implement this method')

  def post(self, *args):
    logging.info('%s <- %s' % (self.request.path, self.request.body))
    try:
      if not self.request.body:
        raise Exception('Empty request')
      params = fromjson(self.request.body)
      r = self.handle(params, *args)
      if not r:
        raise Exception('Unexpected empty response from subclass')
      self.response.write(tojson(r))
    except:
      # clients must already be prepared to deal with non-JSON responses,
      # so a raw, human readable, stack trace is fine here
      self.response.set_status(500)
      tb = traceback.format_exc()
      logging.warn(tb)
      self.response.write(tb)


# 'matcher' backend handler
class FindGame(JsonHandler):

  def handle(self, params, userID):
    pingAll()
    return self.get_game(userID)

  def get_game(self, userID):
    # previously matched / player re-entering?
    player_game = _match_maker.lookup_player_game(userID)
    if player_game:
      return player_game

    # look for a new available game
    result = self._get_player_game(userID)

    # found a game?
    if result and 'game' in result:
      player_game = result
      usr = db_api.getUser(userID)
      addPlayers(player_game, userID, usr.displayName)
      return result

    # more players needed to start game?
    if result.get('players_needed_for_next_game', None) > 0:
      return result

    # start a new game
    game = startGame()
    if 'game_state' not in game:
      logging.info('RETURNING RESULT FROM startGame(): %s' % game)
      return game

    logging.info('RETURNING RESULT: %s' % result)
    return result

  def _get_player_game(self, userID):
    player_game = _match_maker.find_player_game(userID)
    return player_game


# 'matcher' backend handler
class UpdateGameState(JsonHandler):

  def handle(self, params, *args):
    serverid = params['serverid']
    new_game_state = params['game_state']
    game_name = new_game_state['name']
    _match_maker.update_player_names(serverid, game_name, new_game_state)
    return {'success': True,
            'backend': backends.get_backend()}


# 'matcher' backend handler
class RegisterController(JsonHandler):

  def handle(self, params, *args):
    if _PAIRING_KEY != params['pairing_key']:
      return {'success': False,
              'exception': 'bad pairing key'}
    controller_port = params['controller_port']
    ip = self.request.remote_addr
    controller_host = '%s:%d' % (ip, controller_port)
    params['controller_host'] = controller_host
    _match_maker.update_server_info(params)
    return {'success': True,
            'backend': backends.get_backend(),
            'controller_host': controller_host}


# 'matcher' backend handler
class ListGames(webapp2.RequestHandler):

  def get(self):
    self.response.write(tojson(pingAll()))


# 'matcher' backend handler
class Debug(webapp2.RequestHandler):

  def get(self):
    state = _match_maker.get_state()
    self.response.write(tojson(state))


# 'matcher' backend handler
class StartGame(webapp2.RequestHandler):

  def get(self):
    self.response.write(tojson(startGame()))


# 'matcher' backend handler
class LogFiles(webapp2.RequestHandler):

  def get(self):
    self.response.headers['Content-Type'] = 'text/html'
    self.response.write('<html><body><h1>Log Files</h1>')
    for serverid in _match_maker.get_game_servers():
      server_info = _match_maker.get_game_server_info(serverid)
      self.response.write('<p>%(id)s: '
                          '<a href="http://%(svr)s/forever.log">error</a> '
                          '<a href="http://%(svr)s/log">console</a> '
                          '<a href="http://%(svr)s/ping">ping</a> '
                          '<a href="http://%(svr)s/enable-dedup">enable-dedup</a> '
                          '<a href="http://%(svr)s/disable-dedup">disable-dedup</a> '
                          '</p>' %
                          {'id':serverid,
                           'svr':server_info['controller_host']})
    self.response.write('</body></html>')


# 'matcher' backend handler
class GameOver(JsonHandler):

  def handle(self, params, *args):
    _match_maker.del_game(params['serverid'], params['name'])
    return {'success': True, 'backend': backends.get_backend()}


# 'matcher' backend helper function
def pingAll():
  removeserver = []
  # TODO use async urlfetch to parallelize url fetch calls
  for serverid in _match_maker.get_game_servers():
    server_info = _match_maker.get_game_server_info(serverid)
    url = 'http://%s/ping' % server_info['controller_host']
    try:
      r = fetchjson(url, 2)
      logging.debug('pingAll(): %s -> %s' % (url, r))
    except:
      logging.warn('pingAll(): EXCEPTION %s' % traceback.format_exc())
      removeserver.append(serverid)
    if r['serverid'] != serverid:
      removeserver.append(serverid)
      continue

    # check for games which have ended without our knowledge
    remotegameinfo = r['gameinfo']
    server_struct = _match_maker.get_game_server_struct(serverid)
    games = server_struct['games']
    removegame = []
    for name, game in games.iteritems():
      if name not in remotegameinfo:
        # the game is unexpectedly gone
        logging.warn('serverid %s unexpectedly lost game %s (did we miss a /game-over callback?)' % (serverid, name))
        removegame.append(name)
    for name in removegame:
      _match_maker.del_game(serverid, name)

  for serverid in removeserver:
    _match_maker.del_game_server(serverid)
  return _match_maker.get_game_servers()


# 'matcher' backend helper function
def rateUsage(r):
  return max(int(r['cpu']), int(r['mem']))


# 'matcher' backend helper function
def startGame():
  logging.debug('startGame()')
  best = None
  bestServer = None
  for serverid, server_struct in pingAll().iteritems():
    if not best or rateUsage(best) > rateUsage(r):
      server_info = server_struct['server_info']
      best = server_info
      bestServer = best['controller_host']
  if bestServer:
    url = 'http://%s/start-game?p=%s' % (bestServer, _PAIRING_KEY)
    game = fetchjson(url, 20)
    logging.debug('startGame(): %s -> %s' % (url, tojson(game)))
    if game.get('success', False):
      ip = bestServer.split(':')[0]
      game['gameURL'] = 'http://%s:%s/%s' % (ip, game['port'], game['name'])
      game['controller_host'] = bestServer
      game['serverid'] = best['serverid']
      _match_maker.update_game(game)
    return game
  else:
    return {'result': 'no-available-servers'}


def addPlayers(player_game, userID, displayName):
  logging.info('addPlayers(player_game=%s, userID=%s, displayName=%s)' % (player_game, userID, displayName))
  game = player_game['game']
  url = 'http://%s/add-players?p=%s' % (game['controller_host'], _PAIRING_KEY)
  player_game_key = player_game['player_game_key']
  msg = {
    'userID': userID,
    'displayName': displayName,
    'game_name' : game['name'],
    'player_game_key': player_game_key,
  }
  try:
    result = fetchjson(url, 20, payload=tojson(msg))
    logging.info('addPlayers(): %s -> %s -> %s' % (tojson(msg), url, tojson(result)))
    return {
      'game': game,
      'player_game_key': player_game_key,
      'success': True,
    }
  except:
    exc = traceback.format_exc()
    logging.info('addPlayers(): %s -> %s -> %s' % (tojson(msg), url, exc))
    return {
      'success' : False,
      'exception': exc,
    }




#######################################################################




# handler common to frontends and backends
handlers = [
]

if not backends.get_backend():
  # frontend specific handlers
  handlers.extend([
    ('/login', Login),
    ('/loginoauth', LoginHandler),
    ('/grits/(.*)', GritsService),
    ('/(shared/.*\.json)', SharedJsonAssets),
  ])
elif backends.get_backend() == 'matcher':
  # 'matcher' backend specific handlers
  handlers.extend([
    ('/find-game/(.*)', FindGame),
    ('/update-game-state', UpdateGameState),
    ('/register-controller', RegisterController),
    ('/list-games', ListGames),
    ('/debug', Debug),
    ('/start-game', StartGame),
    ('/game-over', GameOver),
    ('/log-files', LogFiles),
  ])

app = webapp2.WSGIApplication(handlers, debug=True)
app.router.set_dispatcher(json_by_default_dispatcher)

/*Copyright 2012 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
#limitations under the License.*/

var express = require('express');
var app_game = express.createServer();
var app_controller = express.createServer()
app_controller.configure(function(){
  app_controller.use(express.bodyParser());
});
var io = require('socket.io').listen(app_game);
var fs = require('fs');
var loop = require('./loop');
var packer = require('./packer');
var proto = require('./proto');
var crypto = require('crypto');
var appeng = require('./appeng');
var sysinfo = require('./sysinfo');
var stats = require('./stats');
var MIN_PLAYERS_PER_GAME = 1;
var MAX_PLAYERS_PER_GAME = 8;

var DEDUP = true;

// Shared libs
var game_module = require("./game.js");

var SERVERID = crypto.randomBytes(18).toString('base64');
console.log("SERVERID: " + SERVERID);

MAX_LOG_LINES = 100000;
TRIM_LOG_LINES = 50;

// {
//    '283473289478329': {
//      'userID': 823478923748932,
//      'displayName': 'fredsa',
//      'game_name': 'syXv',
//      'player_game_key': '283473289478329',
//    },
//    ...
// }
player_games = {};

(function() {
  var recent_logs = [];
  var old_log = console.log;
  var log_file = fs.createWriteStream("log.txt");
  var is_dev = (process.env.NODE_ENV != 'production');
  console.log = function () {
    var line = Array.prototype.slice.call(arguments).join(' ');
    log_file.write(line + '\n');
    recent_logs.push(line);
    if (recent_logs.length > MAX_LOG_LINES) {
      recent_logs.splice(0, TRIM_LOG_LINES);
    }
    if (is_dev) {
      old_log.apply(this, arguments);
    }
  }
  app_controller.get('/log', function(req, res) {
    console.log(req.path, '<-', req.query)
    res.header("Content-Type", "text/plain");
    res.send(recent_logs.join('\n'));
  });
})();

var protoizejs = 'protoize = ' + packer.gen(proto.c2s, proto.s2c);
app_game.get('/protoize.js', function(req, res) {
  console.log(req.path, '<-', req.query)
  res.header("Content-Type", "text/javascript");
  res.send(protoizejs);
});

app_controller.get('/forever.log', function(req, res) {
  fs.readFile('.forever/forever.log', function(err, data) {
    res.header("Content-Type", "text/plain")
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  })
});

app_controller.get('/disable-dedup', function(req, res) {
  DEDUP = false;
  res.send("ok");
});

app_controller.get('/enable-dedup', function(req, res) {
  DEDUP = true;
  res.send("ok");
});

function extractMsgId(msg) {
  var p = msg.indexOf(':');
  if (p>0) {
    msg = msg.slice(0,p);
  }
  return parseInt(msg);
}

function isServerEntityName(name) {
  return name && (name[0] == '!' || name[0] == '_');
}

var games = {}

function numGames() {
  var count = 0;
  for (var i in games) {
    count++;
  }
  return count;
}

function go_away_i_am_not_home(socket) {
  console.log('disconnected -- go_away_i_am_not_home');
  socket.disconnect();
}

// helper function to add send/receive methods to our socket
var protoize = eval(packer.gen(proto.s2c, proto.c2s));

function installGame(game_id, hdlrobj) {
  io.of('/'+game_id).on('connection', function(socket) {
    hdlrobj.f(socket);
  });
}

function runGame(game_id, idle_time) {
  var instinfo = stats.newGame();
  instinfo.inc('games_spawned');
  games[game_id] = instinfo;

  // counter to uniquely identify sockets
  var nextSockId = 1;
  // all currently connected players
  var everyone = {};

  function numPlayers() {
    var count = 0;
    for (var sid in everyone) {
      count++;
    }
    return count;
  }

  var ticknum = 0;
  var outgoing_tail = {};

  function makeSafeTail() {
    if (outgoing_tail.msg) {
      var link = {};
      outgoing_tail.next = link;
      outgoing_tail = link;
    }
  }

  function queueOutgoing(msg, flags, notTo, lastQueued, from) {
    var link = {
      msg: msg,
      notTo: notTo,
      next: null,
      from: from,
      flags: flags,
    };
    if (lastQueued && (flags & proto.STATE) && DEDUP) {
      var id = extractMsgId(msg);
      var m = lastQueued[id];
      if (m) {
        m.msg = null;
      }
      lastQueued[id] = link;
    }
    outgoing_tail.next = link;
    outgoing_tail = link;
    return link;
  }

  var broadcaster = protoize({ addq: queueOutgoing });

  // create a game instance
  var game = game_module.createGameInstance({
    stats: instinfo,
    broadcaster: broadcaster,
  });

  function queueUpdates() {
    for (var sid in game.gGameEngine.namedEntities) {
      // filter out statically spawned objects
      if (!isServerEntityName(sid))
        continue;
      // tell the new client about everyone
      var ent = game.gGameEngine.namedEntities[sid];
      if (ent.sendUpdates) {
        ent.sendUpdates();
      }
    }
  }

  // TODO return richer and more useful game state
  function getGameState() {
    var players = {};
    for (var sid in game.gGameEngine.namedEntities) {
      if (!isServerEntityName(sid))
        continue;
      var ent = game.gGameEngine.namedEntities[sid];
      // filter out non-players
      if (ent.type != 'Player')
        continue;
      players[ent.userID] = sid;
    }
    return {
      name: game_id,
      min_players: MIN_PLAYERS_PER_GAME,
      max_players: MAX_PLAYERS_PER_GAME,
      players: players,
    };
  }

  function validateUser(helloMsg, _callback) {
    function done(result) {
      // delay sending ok/failure to thwart probe attacks
      setTimeout(function() { _callback(result); }, 500);
    }

    console.log('key', helloMsg.player_game_key);

    done(helloMsg.player_game_key in player_games);
  }

  function onConnection(socket) {
    var id;
    var myloop = null;
    var outp = outgoing_tail;
    var lastSent = {};
    console.log("PLAYER CONNECTED");
    function qsends() {
      makeSafeTail();
      for (; outp != outgoing_tail; outp = outp.next) {
        if (outp.msg && outp.notTo != myloop) {
          if ((outp.flags & proto.STATE) && DEDUP) {
            var key = extractMsgId(outp.msg) + "-" + outp.from;
            var m = lastSent[key];
            if (m == outp.msg) continue;
            lastSent[key] = outp.msg;
          }
          socket.addq(outp.msg);
        }
      }
    }
    function flush() {
      qsends();
      if (socket._buffer) {
        instinfo.inc('updates_sent');
        instinfo.add('update_bytes', socket._buffer.length);
      }
      socket.sendq();
    }
    var received_hello_state = 'initial';
    var handlers = {
      hello: function(msg) {
        console.log('got hello', msg);

        // dirty cheater
        if (received_hello_state != 'initial') {
          console.log('hello received but state '+received_hello_state);
          socket.disconnect();
          return;
        }

        instinfo.inc('messages_received');
        received_hello_state = 'validating';

        validateUser(msg, function(ok) {
          console.log('validated user: '+ok);

          if (!ok) {
            received_hello_state = 'failed';
            socket.disconnect();
            return;
          }
          player_game = player_games[msg.player_game_key];
          if (!player_game.id) {
            player_game.id = nextSockId++;
          }
          id = player_game.id;

          // tell the new client about everyone
          for (var sid in game.gGameEngine.namedEntities) {
            console.log(sid);
            // filter out statically spawned objects
            if (!isServerEntityName(sid))
              continue;
            var ent = game.gGameEngine.namedEntities[sid];
            socket.q_spawn({id:sid, type:ent.type, x:ent.pos.x, y:ent.pos.y, settings:ent.spawnInfo});
          }
          queueUpdates();

          // this stuff needs to move to some more game-codey location

          //pick our team
          var teamID = id%2;

          // spawn the player
          var spawnPoint = "Team"+teamID+"Spawn0";
          myloop.entity = game.gGameEngine.spawnPlayer(id, teamID, spawnPoint, "Player", player_game.userID, player_game.displayName);
          myloop.entity.serverLoop = myloop;
          myloop.tick = flush;
          var mystrid = "!"+id;
          everyone[id] = myloop;
          qsends();
          socket.q_welcome({youare:"!"+id,color:teamID});
          game.gGameEngine.notifyPlayers(player_game.displayName + " joined.");
          socket.sendq();

          var controller_endpoint = '/'+game_id+'!'+id;
          console.log('STARTING TO LISTEN ON WASD CHANNEL', controller_endpoint);
          io.of(controller_endpoint).on('connection', function(wasdSocket) {
            ref = {};
            console.log('CONTROLLER CONNECTED TO WASD CHANNEL', controller_endpoint);
            wasdSocket.on('disconnect', function(msg) {
             console.log('RECEIVED DISCONNECT FOR WASD CHANNEL', controller_endpoint);
            });
            wasdSocket.on('message', function(msg) {
              // console.log('GOT WASD CONTROLLER MESSAGE', msg, 'ON WASD CHANNEL', controller_endpoint);
              wasdSocket.send('ack ' + msg);
              if (msg.slice(0,4) == 'init') {
                ref = JSON.parse(msg.slice(4));
                return;
              }
              if (!ref['player_name']) {
                console.log('disconnecting', controller_endpoint, 'wasd controller; received msg', msg, 'while ref has no player_name:', ref);
                wasdSocket.disconnect();
                return;
              }
              W = (msg[0] == 'Y');
              A = (msg[1] == 'Y');
              S = (msg[2] == 'Y');
              D = (msg[3] == 'Y');
              socket.q_wasd({from: ref['player_name'].slice(1), W: W, A: A, S: S, D: D});
            });
          });

          // update counters, let appengine know
          instinfo.inc('players_connected');
          appeng.updateGameState(CONTROLLER_PORT, getGameState());

          received_hello_state = 'ready';
        });
      },
      ping: function(msg) {
        if (received_hello_state != 'ready') {
          console.log('received ping but received_hello_state = ' + received_hello_state);
          socket.disconnect();
          return;
        }

        instinfo.inc('pings_responded');
        instinfo.inc('messages_received');
        socket.q_pong(msg);
        flush();
      },
      respawn: function(msg) {
        if (received_hello_state != 'ready') {
          console.log('received respawn but received_hello_state = ' + received_hello_state);
          socket.disconnect();
          return;
        }

        instinfo.inc('messages_received');
        if (isServerEntityName("!" + msg.from)) {
          game.gGameEngine.respawnEntity(msg);
        }
      },
      DEFAULT: function(msg, name) {
        if (received_hello_state != 'ready') {
          console.log('received name=' + name + ' with  msg=' + msg +' but received_hello_state = ' + received_hello_state);
          socket.disconnect();
          return;
        }

        instinfo.inc('messages_received');
        var ent = myloop.entity;
        if (ent.serverLoop != myloop) {
          // entity is controlled by a different client
          return;
        }
        if (ent['on_'+name]) {
          ent['on_'+name](msg);
        }
      }
    };
    socket = protoize(socket, handlers);
    myloop = {};
    myloop.socket = socket;

    socket.on('disconnect', function() {
      instinfo.inc('players_disconnected');
      console.log("PLAYER DISCONNECTED");
      game.gGameEngine.unspawnPlayer(id);
      broadcaster.q_unspawn({id:"!"+id});
      delete everyone[id];
      myloop = null;
      appeng.updateGameState(CONTROLLER_PORT, getGameState());
    });
  }

  var handlecon = { f: onConnection };
  installGame(game_id, handlecon);

  game.gGameEngine.onSpawned = function(ent) {
    instinfo.inc('entities_spawned');
    if (isServerEntityName(ent.name)) {
      console.log("spawned: " + ent.name);
      function addfrom(s) {
        var oldq = s.q;
        s.q = function(msg, args) {
          args.from = ent.name;
          oldq(msg, args);
        }
        return s;
      }
      var lastQueued = {};
      ent.toOthers = addfrom(protoize({
        addq: function(msg, flags, orig) {
          queueOutgoing(msg, flags, ent.serverLoop, lastQueued, orig.from);
        }
      }));
      ent.toAll = addfrom(protoize({
        addq: function(msg, flags, orig) {
          queueOutgoing(msg, flags, null, lastQueued, orig.from);
        }
      }));
      broadcaster.q_spawn({id:ent.name, type:ent.type, x:ent.pos.x, y:ent.pos.y, settings:ent.spawnInfo });
    }
  }
  game.gGameEngine.setup(false);
  game.enableLogging();

  instinfo.tick = function() {
    instinfo.inc('ticks');
    game.gGameEngine.run();
    queueUpdates();
    for (var con in everyone) {
      instinfo.inc('player_ticks');
      everyone[con].tick();
    }
  }

  if (idle_time > 0) {
    var watchdog = null;
    function endGame() {
      appeng.reportGameOver(game_id, instinfo);
      loop.kill(watchdog);
      delete games[game_id];
      handlecon.f = go_away_i_am_not_home;
      instinfo.tick = null;
      instinfo = null;
      watchdog = null;
      mainloop = null;
      handlecon = null;
      game = null;
      everyone = null;
      broadcaster = null;
      console.log(game_id + ": dead");
    }

    var lastNextSockId = nextSockId-1;
    watchdog = loop.run(5*1000, function() {
      if (numPlayers() == 0) {
        if (lastNextSockId == nextSockId) {
          return;
        }
        lastNextSockId = nextSockId;
        console.log(game_id + ": no players: scheduling potential death [" + nextSockId + "]");
        var nextSockIdAtScheduledDeath = nextSockId;
        setTimeout(function() {
          console.log(game_id + ": checking death condition [" + nextSockIdAtScheduledDeath + "," +nextSockId + "]");
          if (nextSockIdAtScheduledDeath == nextSockId) {
            endGame();
          }
        }, idle_time);
      }
    });
  }

  return getGameState();
}

app_controller.get('/start-game', function(req, res) {
  console.log(req.path, '<-', req.query)
  if (!req.query.p || req.query.p != appeng.pairing_key) {
    res.send(JSON.stringify({
      success: false,
      exception: 'bad pairing key',
    }));
    return;
  }
  console.log('***** starting game instance');
  var start = Date.now();
  var IDSIZE = 3;
  function try_start(ex, id) {
    if (ex) throw ex;
    var name = id.toString('base64');
    name = name.replace(/\+/g, '-').replace(/\//g, '_')
    if (name in games) {
      crypto.randomBytes(IDSIZE, try_start);
    } else {
      var game_state = runGame(name, 10*60*1000);
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify({
        success: true,
        port: GAME_PORT,
        name: name,
        time: Date.now() - start,
        game_state: game_state,
      }, null, appeng.INDENT_JSON));
    }
  }
  crypto.randomBytes(IDSIZE, try_start);
});

app_controller.post('/add-players', function(req, res) {
  console.log(req.path, '<-', req.query)
  if (!req.query.p || req.query.p != appeng.pairing_key) {
    res.send(JSON.stringify({
      success: false,
      exception: 'bad pairing key',
    }));
    return;
  }
  // express.bodyParser provides automatic JSON parsing into req.body
  // if the request Content-Type is sent as 'application/json'
  if (!req.is('application/json')) {
    throw 'Incorrect Content-Type: ' + req.headers['content-type'];
  }
  msg = req.body;
  console.log('adding player(s) to game:', msg);
  player_games[msg.player_game_key] = msg;
  res.header('Content-Type', 'application/json');
  res.send(JSON.stringify({
    success: true,
  }, null, appeng.IDENT_JSON));
});

var last_update_bytes = 0;

setInterval(function() {
  var update_bytes = stats.counts.update_bytes || 0;
  var second_bytes = update_bytes - last_update_bytes;
  last_update_bytes = update_bytes;
  stats.counts.bandwidth = second_bytes;
}, 1000);

app_controller.get('/ping', function(req, res) {
  console.log(req.path, '<-', req.query)
  res.header('Content-Type', 'application/json');
  res.send(JSON.stringify({
    'cpu': sysinfo.cpu,
    'mem': sysinfo.mem,
    'games': numGames(),
    'v8mem': process.memoryUsage(),
    'uptime': process.uptime(),
    'gameinfo': games,
    'serverid': SERVERID,
    'stats': stats.counts,
  }, null, appeng.INDENT_JSON));
});

loop.run(50, function() {
  for (var inst in games) {
    games[inst].tick();
  }
});

io.configure('production', function(){
  io.enable('browser client etag');
  io.set('log level', 1);

  // The origins that are allowed to connect to the Socket.IO server
  //io.set('origins ', ["http://localhost:8080"]); //CLM forced?

  io.set('transports', [
         'websocket',
         // 'flashsocket',
         // 'htmlfile',
         // 'xhr-polling',
         // 'jsonp-polling',
         ]);
});

io.configure('development', function(){
  io.set('log level', 1);
  io.set('transports', ['websocket']);
});

var CONTROLLER_PORT = 12345;
var GAME_PORT;
var MATCHER_HOST;
var MATCHER_PORT;

if (process.env.NODE_ENV == 'production') {
  GAME_PORT = 80;
  MATCHER_HOST = "matcher.gritsgame.appspot.com";
  MATCHER_PORT = 80;
} else {
  GAME_PORT = 8081;
  MATCHER_HOST = "localhost";
  MATCHER_PORT = 9100;
}

app_controller.listen(CONTROLLER_PORT);
app_game.listen(GAME_PORT);
appeng.connect(MATCHER_HOST, MATCHER_PORT, CONTROLLER_PORT, SERVERID);


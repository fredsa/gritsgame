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


/**
 * @fileoverview Description of this file.
 * @author ctiller@google.com (Craig Tiller)
 */

var http = require('http')
var assert = require('assert')
var fs = require('fs')

var host = null;
var port = null;
var SERVERID = null;
var DEBUG = true;
var INDENT_JSON = DEBUG ? 4: null;

exports.DEBUG = DEBUG
exports.INDENT_JSON = INDENT_JSON

var pairing_key = JSON.parse(fs.readFileSync(__dirname + '/../shared/pairing-key.json')).key
exports.pairing_key = pairing_key

// exponential backoff knobs
var check_connection_delay_s = .1;
var check_connection_delay_s_max = 300;
var check_connection_delay_s_ok = 30;

function get(path, cb) {
  var caller = get.caller.name;
  var options = {
    host: host,
    port: port,
    path: path
  };
  var result = "";
  var donecb = false;
  function callback(arg) {
    if (!donecb) cb(arg);
    donecb = true;
  }
  url = 'http://' + options.host + ':' + options.port + (options.path[0] == '/' ? '' : '/') + options.path;
  http.get(options, function(res) {
    res.on('data', function(chunk) {
      result += chunk;
    });
    res.on('end', function() {
      console.log(caller + ': GET', url, '->', res.statusCode, result);
      callback(result);
    });
    res.on('close', function() {
      callback(null);
    });
  }).on('error', function(e) {
    console.log(caller + ': GET', url, '-> FAILED due to ' + e);
    callback(null);
  })
}

function post(path, contents, cb) {
  var caller = post.caller = call ? post.caller.caller.name : post.caller.name;
  var options = {
    host: host,
    port: port,
    path: path,
    method: 'POST',
    headers: {
      'Content-Length': contents.length
    }
  };
  var result = "";
  var donecb = false;
  function callback(arg) {
    if (!donecb) cb(arg);
    donecb = true;
  }
  url = 'http://' + options.host + ':' + options.port + (options.path[0] == '/' ? '' : '/') + options.path;
  var req = http.request(options, function(res) {
    res.on('data', function(chunk) {
      result += chunk;
    });
    res.on('end', function() {
      console.log(caller + ': POST', contents, '->', url, '->', res.statusCode, result);
      callback(result);
    });
    res.on('close', function() {
      callback(null);
    });
  });
  req.on('error', function(e) {
    console.log(caller + ': POST', url, '-> FAILED due to ' + e);
    callback(null);
  });
  req.write(contents);
  req.end();
}

function call(path, args, callback) {
  post(path, JSON.stringify(args, undefined, INDENT_JSON), function(r) {
    var result = null;
    try {
      if (r) {
        result = JSON.parse(r);
      } else {
        result = {
          success: false,
          exception: 'POST FAILED'
        };
      }
    } catch (e) {
      result = {
        success: false,
        exception: e
      };
    }
    assert.ok(result);
    callback(result);
  });
}

function checkConnectionSoon(controller_port, delay_s) {
  check_connection_delay_s = delay_s;
  console.log('Will call', checkConnection.name, 'again in', delay_s, 'seconds');
  setTimeout(function() { checkConnection(controller_port); }, delay_s * 1000);
}

function checkConnection(controller_port) {
  var info = {
    controller_port: controller_port,
    serverid: SERVERID,
    pairing_key: pairing_key,
  };
  uri = '/register-controller';
  call(uri, info, function(r) {
    if (!r || !r.success || r.backend != 'matcher') {
      // use exponential backoff + fuzz factor
      var delay_s = Math.min(check_connection_delay_s_max, check_connection_delay_s * 2 + Math.ceil(Math.random() * 5));
      checkConnectionSoon(controller_port, delay_s);
      return;
    }
    checkConnectionSoon(controller_port, check_connection_delay_s_ok);
  });
}

function updateGameState(controller_port, game_state) {
  var info = {
    controller_port: controller_port,
    serverid: SERVERID,
    game_state: game_state,
  };
  uri = '/update-game-state';
  call(uri, info, function(r) {
    if (!r || !r.success || r.backend != 'matcher') {
      console.log('UNEXPECTED RESPONSE', r);
    }
  });
}
exports.updateGameState = updateGameState;

function reportGameOver(instance_id, stats) {
  var info = {
    name: instance_id,
    serverid: SERVERID,
    counts: stats.counts,
    logs: stats.logs,
  };
  uri = '/game-over';
  call(uri, info, function(r) {
    if (!r || !r.success || r.backend != 'matcher') {
      console.log('UNEXPECTED RESPONSE', r);
    }
  });
}
exports.reportGameOver = reportGameOver

function connect(h, p, controller_port, serverid) {
  assert.ok(!host);
  assert.ok(!port);
  assert.ok(h);
  assert.ok(p);
  host = h;
  port = p;
  SERVERID = serverid
  checkConnection(controller_port);
}
exports.connect = connect;


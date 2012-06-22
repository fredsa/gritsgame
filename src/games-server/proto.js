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

exports.STATE = 1

exports.c2s = {
  hello: {
    player_game_key: 'STRING',
  },
  ping: {
    now: 'INT',
  },
  respawn: {
    from: 'STRING',
    wep0: 'STRING',
    wep1: 'STRING',
    wep2: 'STRING',
  },
};

exports.s2c = {
  welcome: {
    youare: 'STRING',
    color: 'INT',
  },
  pong: {
    now: 'INT',
  },
  wasd: {
    W: 'BOOL',
    A: 'BOOL',
    S: 'BOOL',
    D: 'BOOL',
  },
  spawn: {
    id: 'STRING',
    type: 'STRING',
    x: 'INT',
    y: 'INT',
    settings: 'STRING',
  },
  unspawn: {
    id: 'STRING',
  },
  setPosition: {
    from: 'STRING',
    x: 'INT',
    y: 'INT',
  },
  setWeapons : {
    from: 'STRING',
    wep0: 'STRING',
    wep1: 'STRING',
    wep2: 'STRING',
  },
  collision: {
    ent0: 'STRING',
    ent1: 'STRING',
    impulse: 'FLOAT:2',
  },
  statusMsg: {
    msg: 'STRING',
  },
};

// things we reflect
var c2c = {
  input: {
    FLAGS: exports.STATE,
    x: 'INT',
    y: 'INT',
    faceAngle0to7: 'INT',
    legRotation: 'INT',
    walking: 'BOOL',
    fire0: 'BOOL',
    fire1: 'BOOL',
    fire2: 'BOOL',
  },
  phys: {
    FLAGS: exports.STATE,
    x: 'FLOAT:2',
    y: 'FLOAT:2',
    vx: 'FLOAT:2',
    vy: 'FLOAT:2',
  },
  stats: {
    FLAGS: exports.STATE,
    health: 'INT',
    energy: 'INT',
    walkSpeed: 'INT',
    powerUpTime: 'INT',
    numKills: 'INT',
  },
};

function clone(obj) {
  if (!obj || typeof obj != 'object')
    return obj;

  out = {};
  for (var f in obj) {
    out[f] = clone(obj[f]);
  }
  return out;
}

for (var m in c2c) {
  exports.c2s[m] = clone(c2c[m]);
  s = clone(c2c[m]);
  s['from'] = 'STRING';
  exports.s2c[m] = s;
}


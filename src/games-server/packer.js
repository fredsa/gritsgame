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


assert = require('assert');
fs = require('fs');
proto = require('./proto');

var error_checking_on_pack = true;

var packutil = fs.readFileSync(__dirname + '/packutil.js');

function typeinfo(type) {
  var info = {
    optional: false,
  };

  while (true) {
    if (type[0] == '?') {
      info.optional = true;
      type = type.substring(1);
      continue;
    }
    break;
  };

  var args = type.split(':');
  info.name = args[0];
  info.args = args.slice(1);
  return info;
}

function genPackMsg(spec, msgname, msgid) {
  var pack = 'function (data) {\n';
  pack += '\treturn ["' + msgid.toString() + '"';
  for (var fld in spec) {
    if (fld == 'FLAGS') continue;
    var type = typeinfo(spec[fld]);

    pack += '\t,":",\n';
    if (type.optional) {
      pack += '\tdata.';
      pack += fld;
      pack += '? (\n';
    }

    if (error_checking_on_pack) {
      pack += '\tpackerrwrap(\''+type.name+'\', \''+fld+'\', data, ';
    }

    pack += 'pack_';
    pack += type.name;
    pack += error_checking_on_pack? ',' : '(';
    var allargs = ['data.' + fld].concat(type.args);
    pack += allargs.join();
    pack += ')';

    if (type.optional) {
      pack += '\t):""';
    }
  }
  pack += '\t].join("");\n';
  pack += '}';

  var flags = spec.FLAGS || 0;

  return 'encdata["' + msgname + '"] = [' + pack + ',' + flags + '];\n';
};

function genUnpackMsg(spec, msgname, msgid) {
  var unpack = 'function (flds) {\n';
  unpack += '\tvar out = {\n\t\t';
  var idx = 0;
  var first = true;
  for (var fld in spec) {
    if (fld == 'FLAGS') continue;
    var type = typeinfo(spec[fld]);
    idx ++;
    if (type.optional) {
      continue;
    }

    if (!first) {
      unpack += ',\n\t\t';
    }
    unpack += fld;
    unpack += ': ';
    unpack += 'unpack_';
    unpack += type.name;
    unpack += '(flds[';
    unpack += idx;
    unpack += '])';
    first = false;
  }
  unpack += '\n\t};\n';
  idx = 0;
  for (var fld in spec) {
    if (fld == 'FLAGS') continue;
    var type = typeinfo(spec[fld]);
    idx ++;
    if (!type.optional) {
      continue;
    }
    unpack += '\tif (flds[';
    unpack += idx;
    unpack += ']!="") out.';
    unpack += fld;
    unpack += ' = unpack_';
    unpack += type.name;
    unpack += '(flds[';
    unpack += idx;
    unpack += ']);\n';
  }
  unpack += '\treturn out;\n';
  unpack += '}';

  return 'var message_unpacker_' + msgname + ' = ' + unpack + ';\n';
}

exports.gen = function(send_spec, recv_spec) {
  var id = 0;
  var out = '';
  out += 'var encdata = {};\n';
  for (var msg in recv_spec) {
    out += genUnpackMsg(recv_spec[msg], msg, id);
    id ++;
  }
  id = 0;
  for (var msg in send_spec) {
    out += genPackMsg(send_spec[msg], msg, id);
    id ++;
  }

  out += 'return function(socket, handlers) {\n';
  out += 'if (handlers) {\n';
  out += '\tvar h = [];\n';
  out += '\tvar dh = function () {};\n';
  for (var msg in recv_spec) {
    out += '\tvar handler_' + msg + ' = handlers["' + msg + '"] || handlers["DEFAULT"] || dh;\n';
    out += '\th.push(function(flds) {\n';
    out += '\t\tvar m;\n';
    out += '\t\ttry {\n';
    out += '\t\t\tm = message_unpacker_' + msg + '(flds);\n';
    out += '\t\t} catch (e) {\n';
    out += '\t\t\tconsole.log("unpack error for ' + msg + '");\n';
    out += '\t\t\tthrow e;\n';
    out += '\t\t}\n';
    out += '\t\ttry {\n';
    out += '\t\t\thandler_' + msg + '(m, \"' + msg + '\");\n';
    out += '\t\t} catch (e) {\n';
    out += '\t\t\tconsole.log("handling error for ' + msg + '", m);\n';
    out += '\t\t\tthrow e;\n';
    out += '\t\t}\n';
    out += '\t});\n';
  }
  out += '\tsocket.on("message", function (bytes) {\n';
  //out += '\tconsole.log("message::" + bytes);\n';
  out += '\t\tvar msgs = bytes.split("/");\n';
  out += '\t\tfor (var m=0; m<msgs.length; m++) {\n';
  out += '\t\t\tvar flds = msgs[m].split(":");\n';
  out += '\t\t\ttry {\n';
  out += '\t\t\t\th[parseInt(flds[0])](flds);\n';
  out += '\t\t\t} catch (e) {\n';
  out += '\t\t\t\tconsole.log("error handling message", flds);\n';
  out += '\t\t\t\tthrow e;\n';
  out += '\t\t\t}\n';
  out += '\t\t}\n';
  out += '\t});\n';
  out += '}\n';
  for (var msg in send_spec) {
    out += 'socket.q_' + msg + ' = function(args) {\n';
    out += '\tsocket.q("'+msg+'", args);\n';
    out += '};\n';
    out += 'if (!socket.addq) socket.send_' + msg + ' = function(args) {\n';
    out += '\tsocket.q_' + msg + '(args);\n';
    out += '\tsocket.sendq();\n';
    out += '};\n';
  }
  out += 'socket.q = function(name, args) {\n';
  out += '\tvar data = encdata[name];\n';
  out += '\tsocket.addq(data[0](args), data[1], args);\n';
  out += '}\n';
  out += 'if (!socket.addq) {\n';
  out += '\tsocket.sendq = function() {\n';
  out += '\t\tif (socket._buffer) {\n';
  out += '\t\t\tsocket.send(socket._buffer);\n';
  out += '\t\t\tsocket._buffer = "";\n';
  out += '\t\t}\n';
  out += '\t}\n';
  out += '\tsocket._buffer = "";\n';
  out += '\tsocket._lq = {};\n';
  out += '\tsocket.addq = function(s, f) {\n';
  out += '\t\tif (f & '+proto.STATE+') {\n';
  out += '\t\t\tvar id = extractMsgId(s);\n';
  out += '\t\t\tif (socket._lq[id] == s) {\n';
  out += '\t\t\t\treturn;\n';
  out += '\t\t\t};\n';
  out += '\t\t\tsocket._lq[id] = s;\n';
  out += '\t\t}\n';
  out += '\t\tvar x = socket._buffer;\n';
  out += '\t\tif (x) x += "/";\n';
  out += '\t\tx += s;\n';
  out += '\t\tsocket._buffer = x;\n';
  out += '\t};\n';
  out += '};\n';
  out += '\treturn socket;\n';
  out += '};\n';

  return '(function() {\n' + packutil + out + '})()\n';
}

/*
var testspec = {
  'test': {
    'c': '?INT',
    'a': 'INT',
    'b': '?INT',
  }
};
exports.gen(testspec, testspec, function(src) {
  Logger.log(src);
  var protoize = eval(src);

  var ms = [
    {'a': 3},
    {'a': 3, 'b': 4},
    {'b': 3, 'a': 4},
  ];
  for (var i=0; i<ms.length; i++) {
    var m = ms[i];
    var mp = undefined;
    var mu = undefined;
    var handlers = {
      test: function(x) { mu = x; }
    }
    var ts = {
      send: function(x) { mp = x; ts._hdl(x); },
      on: function(evt, hdlr) { if (evt=='message') ts._hdl = hdlr; }
    }
    protoize(ts, handlers);
    ts.send_test(m);
    //var mu = p.unpack(mp);
    Logger.log(m, mp, mu);
  }
});
*/


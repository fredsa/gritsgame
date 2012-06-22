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
 * outer protocols use ":" and "/" as separators: don't use them in your packed
 * data here.
 */

function pack_STRING(s) {
  return s.replace(/#/g, "#1").replace(/:/g, "#2").replace(/\//g, "#3");
}

function unpack_STRING(s) {
  return s.replace(/#3/g, "/").replace(/#2/g, ":").replace(/#1/g, "#");
}

function pack_INT(i) {
  return i.toString();
}

var unpack_INT = parseInt;

function pack_BOOL(b) {
  return b? "Y" : "N";
}

function unpack_BOOL(b) {
  return b == "Y";
}

function pack_FLOAT(f, prec) {
  if (!prec) { return f.toString(); }
  else { return f.toFixed(prec); }
}

var unpack_FLOAT = parseFloat;

function packerror(type, name, data, err) {
  console.log('pack error for '+type+' "'+name+'"', err);
  console.log('data was ', data);
  throw err;
}

function packerrwrap(type, name, data, f, val, a, b, c, d) {
  try {
    return f(val, a, b, c, d);
  } catch (e) {
    packerror(type, name, data, e);
  }
}

function extractMsgId(msg) {
  var p = msg.indexOf(':');
  if (p>0) {
    msg = msg.slice(0,p);
  }
  return parseInt(msg);
}


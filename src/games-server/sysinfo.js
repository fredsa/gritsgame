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


if (process.platform == "linux") {
  var prev_tot = -1;
  var prev_idle = 0;
  function getLoad(cb) {
    fs.readFile("/proc/stat", function(err, data) {
      var raw = data.toString().split(' ');
      assert.ok(raw[0] == 'cpu');
      var tot = parseInt(raw[2]) + parseInt(raw[3]) + parseInt(raw[4]);
      var idle = parseInt(raw[5]);
      if (prev_tot != -1) {
        var load = (tot - prev_tot) / (tot + idle - prev_tot - prev_idle) * 100;
        cb(Math.round(load));
      } else {
        setTimeout(function() { getLoad(cb) }, 1000);
      }
      prev_tot = tot;
      prev_idle = idle;
    });
  }

  function getMemory(cb) {
    fs.readFile("/proc/meminfo", function(err, data) {
      var raw = data.toString().replace(/ /g, '\n').split('\n').filter(function(x) { return x!='' && x!='kB'; });
      var values = {};
      for (var i=0; i<raw.length; i+=2) {
        var key = raw[i];
        var value = parseInt(raw[i+1]);
        assert.ok(key[key.length-1] == ':');
        key = key.substring(0, key.length-1);
        values[key] = value;
      }
      var avail = (values.MemTotal - values.MemFree - values.Cached);
      cb(Math.round(avail / values.MemTotal * 100));
    });
  }

  function tick() {
    getLoad(function(load) {
      getMemory(function(mem) {
        exports.cpu = load;
        exports.mem = mem;
        setTimeout(tick, 1000);
      })
    });
  }
  tick();
}

exports.cpu = 0;
exports.mem = 0;


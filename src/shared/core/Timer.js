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

TimerClass = Class.extend({
  target: 0,
  base: 0,
  last: 0,

  init: function (seconds) {
    this.base = GlobalTimer.time;
    this.last = GlobalTimer.time;

    this.target = seconds || 0;
  },


  set: function (seconds) {
    this.target = seconds || 0;
    this.base = GlobalTimer.time;
  },


  reset: function () {
    this.base = GlobalTimer.time;
  },


  tick: function () {
    var delta = GlobalTimer.time - this.last;
    this.last = GlobalTimer.time;
    return delta;
  },


  delta: function () {
    return GlobalTimer.time - this.base - this.target;
  }
});

GlobalTimer = {}
GlobalTimer._last = 0;
GlobalTimer.time = Date.now();
GlobalTimer.timeScale = 1;
GlobalTimer.maxStep = 0.05;

GlobalTimer.step = function () {
  var current = Date.now();
  var delta = (current - GlobalTimer._last) / 1000;
  GlobalTimer.time += Math.min(delta, GlobalTimer.maxStep) * GlobalTimer.timeScale;
  GlobalTimer._last = current;
};

//exports.Class = TimerClass;
//exports.GlobalTimer = GlobalTimer;

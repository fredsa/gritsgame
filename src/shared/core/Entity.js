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

EntityClass = Class.extend({
  id: 0,

  hsize: {
    x: 0,
    y: 0
  },

  pos: {
    x: 0,
    y: 0
  },
  last: {
    x: 0,
    y: 0
  },
  zIndex: 0, // Entities will draw smaller zIndex values first, larger values on top.
  currSpriteName: null,

  type: 0,
  // TYPE.NONE
  checkAgainst: 0,
  // TYPE.NONE
  collides: 0,
  // COLLIDES.NEVER
  _killed: false,
  lastCloseTeleportPos: null,
  forcePos: null,
  markForDeath:false,
  //-----------------------------------------
  init: function (x, y, settings) {
    this.id = ++EntityClass._lastId;
    this.pos.x = x;
    this.pos.y = y;

    merge(this, settings);
	this.spawnInfo = JSON.stringify(settings);
  },

  //-----------------------------------------
  sendPhysicsUpdates: function (clientControlledPhysics) {
    var sender = null;
    if (clientControlledPhysics) {
      sender = this.toOthers;
    } else if (IS_SERVER) {
      sender = this.toAll;
    }
    if (sender && this.physBody) {
      var loc = this.physBody.GetPosition();
      var vel = this.physBody.GetLinearVelocity();
      sender.q_phys({
        x:loc.x,
        y:loc.y,
        vx:vel.x,
        vy:vel.y
      });
    }
  },

  //-----------------------------------------
  on_phys: function (msg) {
    if (!IS_SERVER) {
      this.targetPhys = msg;
      this.tpOrig = {x:msg.x, y:msg.y, vx:msg.vx, vy:msg.vy, t:new Date().getTime()};
      this.snapped = false;
    } else {
      this.physBody.SetPosition(new Vec2(msg.x, msg.y));
      this.physBody.SetLinearVelocity(new Vec2(msg.vx, msg.vy));
    }
  },
  
  //-----------------------------------------
  getPhysicsSyncAdjustment: function () {
    var out = {x:0, y:0};
    var tp = this.targetPhys;
    if (tp && !IS_SERVER) {
      var op = this.tpOrig;
      var dt = (new Date().getTime() - op.t)/1000;
      if (dt < 0.2) {
        var ploc = this.physBody.GetPosition();
        var cx = ploc.x;
        var cy = ploc.y;
        var ox = op.x;
        var oy = op.y;
        var ovx = op.vx;
        var ovy = op.vy;
        var predx = ox + ovx * dt;
        var predy = oy + ovy * dt;
        var allowSlipTime = 0.1;
        var dpred = Math.sqrt((predx-cx)*(predx-cx)+(predy-cy)*(predy-cy));
        var dallow = Math.sqrt(ovx*ovx+ovy*ovy)*(allowSlipTime+dt)+10;
        if (!this.snapped && dpred > dallow) {
          var putx = predx + (cx - predx) * dallow/dpred;
          var puty = predy + (cy - predy) * dallow/dpred;
          this.physBody.SetPosition(new Vec2(putx, puty));
          Logger.log("snap " + ox + " " + oy + " " + putx + " " + puty);
        } else {
          out.x = (predx - cx) * dpred / dallow * 0.1;
          out.y = (predy - cy) * dpred / dallow * 0.1;
        }
      }
      this.snapped = true;
    }
    return out;
  },

  //-----------------------------------------
  autoAdjustVelocity: function() {
    var a = this.getPhysicsSyncAdjustment();
    if (a.x || a.y) {
      var vel = this.physBody.GetLinearVelocity();
      vel.x += a.x;
      vel.y += a.y;
      this.physBody.SetLinearVelocity(vel);
    }
  },

  //-----------------------------------------
  update: function () {
    if(this.markForDeath == true) {
      this.kill();
      return;
    }

    if (this.forcePos) {
      this.physBody.SetPosition(new Vec2(this.forcePos.x, this.forcePos.y));
      this.pos.x = this.forcePos.x;
      this.pos.y = this.forcePos.y;
      this.forcePos = null;
    }

    this.last.x = this.pos.x;
    this.last.y = this.pos.y;

    //once we get 100 units from the teleporter, we can re-enter
    if (this.lastCloseTeleportPos != null && distSq(this.pos,this.lastCloseTeleportPos) > (100*100)) {
      // Can teleport again.
      this.lastCloseTeleportPos = null;
    }

    if (this.tweens.length > 0) {
      var currentTweens = [];
      for (var i = 0; i < this.tweens.length; i++) {
        this.tweens[i].update();
        if (!this.tweens[i].complete) currentTweens.push(this.tweens[i]);
      }
      this.tweens = currentTweens;
    }
  },


  //-----------------------------------------
  draw: function () {
    if (this.currSpriteName) {
      drawSprite(this.currSpriteName, this.pos.x.round() - this.hsize.x, this.pos.y.round() - this.hsize.y);
    }
  },

  //-----------------------------------------
  kill: function () {

  },

  centerAt: function (newPos) {
    // We can't move the player during physics, so just in case let's defer to the next update
    this.forcePos = {
      x: (newPos.x - this.hsize.x),
      y: (newPos.y - this.hsize.y)
    };
  },

  //-----------------------------------------
  distanceTo: function (other) {
    center = this.getCenter();
    otherCenter = other.getCenter();
    delta = {
      'x': (otherCenter.x - center.x),
      'y': (otherCenter.y - center.y)
    };
    return Math.sqrt(delta.x * delta.x + delta.y * delta.y);
  },



  //-----------------------------------------
  tweens: [],

  tween: function (props, duration, settings) {
    var tween = new Tween(this, props, duration, settings);
    this.tweens.push(tween);
    return tween;
  },

  pauseTweens: function () {
    for (var i = 0; i < this.tweens.length; i++) {

      this.tweens[i].pause();
    }
  },

  resumeTweens: function () {
    for (var i = 0; i < this.tweens.length; i++) {
      this.tweens[i].resume();
    }
  },

  stopTweens: function (doComplete) {
    for (var i = 0; i < this.tweens.length; i++) {
      this.tweens[i].stop(doComplete);
    }
  },
});


// Last used entity id; incremented with each spawned entity
EntityClass._lastId = 0;



/*
 *  TWEENING
 */

Tween = function (obj, properties, duration, settings) {
  var _object = obj;
  var valuesStart = {};
  var valuesEnd = {};
  var valuesDelta = {};
  var _elapsed = 0;
  var timer = false;
  var started = false;
  var _props = properties;
  var _chained = false;
  this.duration = duration;
  this.complete = false;
  this.paused = false;
  this.easing = Tween.Easing.Linear.EaseNone;
  this.onComplete = false;
  this.delay = 0;
  this.loop = 0;
  this.loopCount = -1;
  merge(this, settings);
  this.loopNum = this.loopCount;

  this.chain = function (chainObj) {
    _chained = chainObj;
  };

  this.initEnd = function (prop, from, to) {
    if (typeof (from[prop]) !== "object") {
      to[prop] = from[prop];
    } else {
      for (subprop in from[prop]) {
        if (!to[prop]) to[prop] = {};
        this.initEnd(subprop, from[prop], to[prop]);
      }
    }
  };

  this.initStart = function (prop, end, from, to) {
    if (typeof (from[prop]) !== "object") {
      if (typeof (end[prop]) !== "undefined") to[prop] = from[prop];
    } else {
      for (subprop in from[prop]) {
        if (!to[prop]) to[prop] = {};
        if (typeof (end[prop]) !== "undefined") this.initStart(subprop, end[prop], from[prop], to[prop]);
      }
    }
  };

  this.start = function () {
    this.complete = false;
    this.paused = false;
    this.loopNum = this.loopCount;
    _elapsed = 0;
    if (_object.tweens.indexOf(this) == -1) _object.tweens.push(this);
    started = true;
    timer = new Timer();
    timer.reset();
    for (var property in _props) {
      this.initEnd(property, _props, valuesEnd);
    }
    for (var property in valuesEnd) {
      this.initStart(property, valuesEnd, _object, valuesStart);
      this.initDelta(property, valuesDelta, _object, valuesEnd);
    }
  };

  this.initDelta = function (prop, delta, start, end) {
    if (typeof (end[prop]) !== "object") {
      delta[prop] = end[prop] - start[prop];
    } else {
      for (subprop in end[prop]) {
        if (!delta[prop]) delta[prop] = {};
        this.initDelta(subprop, delta[prop], start[prop], end[prop]);
      }
    }
  };

  this.propUpdate = function (prop, obj, start, delta, value) {
    if (typeof (start[prop]) !== "object") {
      if (typeof start[prop] != "undefined") {
        obj[prop] = start[prop] + delta[prop] * value;
      } else {
        obj[prop] = obj[prop];
      }
    } else {
      for (subprop in start[prop]) {
        this.propUpdate(subprop, obj[prop], start[prop], delta[prop], value);
      }
    }
  };

  this.propSet = function (prop, from, to) {
    if (typeof (from[prop]) !== "object") {
      to[prop] = from[prop];
    } else {
      for (subprop in from[prop]) {
        if (!to[prop]) to[prop] = {};
        this.propSet(subprop, from[prop], to[prop]);
      }
    }
  };

  this.update = function () {
    if (!started) return false;
    if (this.delay) {
      if (timer.delta() < this.delay) return;
      this.delay = 0;
      timer.reset();
    }
    if (this.paused || this.complete) return false;

    var elapsed = (timer.delta() + _elapsed) / this.duration;

    elapsed = elapsed > 1 ? 1 : elapsed;
    var value = this.easing(elapsed);

    for (property in valuesDelta) {
      this.propUpdate(property, _object, valuesStart, valuesDelta, value);
    }

    if (elapsed >= 1) {
      if (this.loopNum == 0 || !this.loop) {
        this.complete = true;
        if (this.onComplete) this.onComplete();
        if (_chained) _chained.start();
        return false;
      } else if (this.loop == Tween.Loop.Revert) {
        for (property in valuesStart) {
          this.propSet(property, valuesStart, _object);
        }
        _elapsed = 0;
        timer.reset();
        if (this.loopNum != -1) this.loopNum--;
      } else if (this.loop == Tween.Loop.Reverse) {
        var _start = {},
          _end = {},
          _delta = {};
        merge(_start, valuesEnd);
        merge(_end, valuesStart);
        merge(valuesStart, _start);
        merge(valuesEnd, _end);
        for (property in valuesEnd) {
          this.initDelta(property, valuesDelta, _object, valuesEnd);
        }
        _elapsed = 0;
        timer.reset();
        if (this.loopNum != -1) this.loopNum--;
      }
    }
  };

  this.pause = function () {
    this.paused = true;
    _elapsed += timer.delta();
  };

  this.resume = function () {
    this.paused = false;
    timer.reset();
  };

  this.stop = function (doComplete) {
    if (doComplete) {
      this.paused = false;
      this.complete = false;
      this.loop = false;
      _elapsed += duration;
      this.update();
    }
    this.complete = true;
  }
};


Tween.Loop = {
  Revert: 1,
  Reverse: 2
};

Tween.Easing = {
  Linear: {},
  Quadratic: {},
  Cubic: {},
  Quartic: {},
  Quintic: {},
  Sinusoidal: {},
  Exponential: {},
  Circular: {},
  Elastic: {},
  Back: {},
  Bounce: {}
};

Tween.Easing.Linear.EaseNone = function (k) {
  return k;
};

Tween.Easing.Quadratic.EaseIn = function (k) {
  return k * k;
};

Tween.Easing.Quadratic.EaseOut = function (k) {
  return -k * (k - 2);
};

Tween.Easing.Quadratic.EaseInOut = function (k) {
  if ((k *= 2) < 1) return 0.5 * k * k;
  return -0.5 * (--k * (k - 2) - 1);
};

Tween.Easing.Cubic.EaseIn = function (k) {
  return k * k * k;
};

Tween.Easing.Cubic.EaseOut = function (k) {
  return --k * k * k + 1;
};

Tween.Easing.Cubic.EaseInOut = function (k) {
  if ((k *= 2) < 1) return 0.5 * k * k * k;
  return 0.5 * ((k -= 2) * k * k + 2);
};

Tween.Easing.Quartic.EaseIn = function (k) {
  return k * k * k * k;
};

Tween.Easing.Quartic.EaseOut = function (k) {
  return -(--k * k * k * k - 1);
}

Tween.Easing.Quartic.EaseInOut = function (k) {
  if ((k *= 2) < 1) return 0.5 * k * k * k * k;
  return -0.5 * ((k -= 2) * k * k * k - 2);
};

Tween.Easing.Quintic.EaseIn = function (k) {
  return k * k * k * k * k;
};

Tween.Easing.Quintic.EaseOut = function (k) {
  return (k = k - 1) * k * k * k * k + 1;
};

Tween.Easing.Quintic.EaseInOut = function (k) {
  if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
  return 0.5 * ((k -= 2) * k * k * k * k + 2);
};

Tween.Easing.Sinusoidal.EaseIn = function (k) {
  return -Math.cos(k * Math.PI / 2) + 1;
};

Tween.Easing.Sinusoidal.EaseOut = function (k) {
  return Math.sin(k * Math.PI / 2);
};

Tween.Easing.Sinusoidal.EaseInOut = function (k) {
  return -0.5 * (Math.cos(Math.PI * k) - 1);
};

Tween.Easing.Exponential.EaseIn = function (k) {
  return k == 0 ? 0 : Math.pow(2, 10 * (k - 1));
};

Tween.Easing.Exponential.EaseOut = function (k) {
  return k == 1 ? 1 : -Math.pow(2, -10 * k) + 1;
};

Tween.Easing.Exponential.EaseInOut = function (k) {
  if (k == 0) return 0;
  if (k == 1) return 1;
  if ((k *= 2) < 1) return 0.5 * Math.pow(2, 10 * (k - 1));
  return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
};

Tween.Easing.Circular.EaseIn = function (k) {
  return -(Math.sqrt(1 - k * k) - 1);
};

Tween.Easing.Circular.EaseOut = function (k) {
  return Math.sqrt(1 - --k * k);
};

Tween.Easing.Circular.EaseInOut = function (k) {
  if ((k /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
  return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
};

Tween.Easing.Elastic.EaseIn = function (k) {
  var s, a = 0.1,
    p = 0.4;
  if (k == 0) return 0;
  if (k == 1) return 1;
  if (!p) p = 0.3;
  if (!a || a < 1) {
    a = 1;
    s = p / 4;
  } else s = p / (2 * Math.PI) * Math.asin(1 / a);
  return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
};

Tween.Easing.Elastic.EaseOut = function (k) {
  var s, a = 0.1,
    p = 0.4;
  if (k == 0) return 0;
  if (k == 1) return 1;
  if (!p) p = 0.3;
  if (!a || a < 1) {
    a = 1;
    s = p / 4;
  } else s = p / (2 * Math.PI) * Math.asin(1 / a);
  return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
};

Tween.Easing.Elastic.EaseInOut = function (k) {
  var s, a = 0.1,
    p = 0.4;
  if (k == 0) return 0;
  if (k == 1) return 1;
  if (!p) p = 0.3;
  if (!a || a < 1) {
    a = 1;
    s = p / 4;
  } else s = p / (2 * Math.PI) * Math.asin(1 / a);
  if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
  return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
};

Tween.Easing.Back.EaseIn = function (k) {
  var s = 1.70158;
  return k * k * ((s + 1) * k - s);
};

Tween.Easing.Back.EaseOut = function (k) {
  var s = 1.70158;
  return (k = k - 1) * k * ((s + 1) * k + s) + 1;
};

Tween.Easing.Back.EaseInOut = function (k) {
  var s = 1.70158 * 1.525;
  if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
  return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
};

Tween.Easing.Bounce.EaseIn = function (k) {
  return 1 - Tween.Easing.Bounce.EaseOut(1 - k);
};

Tween.Easing.Bounce.EaseOut = function (k) {
  if ((k /= 1) < (1 / 2.75)) {
    return 7.5625 * k * k;
  } else if (k < (2 / 2.75)) {
    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
  } else if (k < (2.5 / 2.75)) {
    return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
  } else {
    return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
  }
};

Tween.Easing.Bounce.EaseInOut = function (k) {
  if (k < 0.5) return Tween.Easing.Bounce.EaseIn(k * 2) * 0.5;
  return Tween.Easing.Bounce.EaseOut(k * 2 - 1) * 0.5 + 0.5;
};

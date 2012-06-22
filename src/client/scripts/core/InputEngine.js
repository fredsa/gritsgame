/*Copyright 2011 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
#limitations under the License.*/

InputEngineClass = Class.extend({
  bindings: {},
  actions: {},
  presses: {},
  locks: {},
  delayedKeyup: [],

  isUsingMouse: false,
  isUsingKeyboard: false,
  mouse: {
    x: 0,
    y: 0
  },
  screenMouse: {
    x: 0,
    y: 0
  },

  init: function () {},

  //-----------------------------
  setup: function () {
  },

  //-----------------------------------------
  initMouse: function () {
    if (this.isUsingMouse) {
      return;
    }
    this.isUsingMouse = true;
  },

  //-----------------------------------------
  initKeyboard: function () {
    if (this.isUsingKeyboard) {
      return;
    }
    this.isUsingKeyboard = true;
  },
  //-----------------------------------------
  /*
    onMouseWheelEvent: function( event ) {
    var code = event.wheel > 0 ? KEY.MWHEEL_UP : KEY.MWHEEL_DOWN;
    var action = this.bindings[code];
    if( action ) {
    this.actions[action] = true;
    this.presses[action] = true;
    event.stopPropagation();
    this.delayedKeyup.push(action);
    }
    },
    */
  //-----------------------------------------
  onMouseMoveEvent: function (pointX, pointY) {
    var tx = pointX;
    var ty = pointY;

    this.mouse.x = tx;
    this.mouse.y = ty;

    var hscroll = (document.all ? document.scrollLeft : window.pageXOffset);
    var vscroll = (document.all ? document.scrollTop : window.pageYOffset);

    this.screenMouse.x = this.mouse.x - hscroll;
    this.screenMouse.y = this.mouse.y - vscroll;

  },
  //-----------------------------------------
  onMouseDownEvent: function (button, pointX, pointY, event) {
//    if (gGuiEngine.onMouseDownEvent(button, pointX, pointY, event))
  //    return;

    var canvasPos = gRenderEngine.getCanvasPosition({x:pointX,y:pointY});
    var worldPos = gRenderEngine.getWorldPosition({x:pointX,y:pointY});

    var pos = {
      left: 0,
      top: 0
    };

    var tx = pointX;
    var ty = pointY;

    this.mouse.x = (tx - pos.left);
    this.mouse.y = (ty - pos.top);

    this.onKeyDownEvent(button == 0 ? KEY.MOUSE1 : KEY.MOUSE2, event);
  },
  //-----------------------------------------
  onMouseUpEvent: function (button, pointX, pointY, event) {
 //   if (gGuiEngine.onMouseUpEvent(button, pointX, pointY, event))
   //   return;

    var canvasPos =gRenderEngine.getCanvasPosition({x:pointX,y:pointY});
    var worldPos = gRenderEngine.getWorldPosition({x:pointX,y:pointY});

    var pos = {
      left: 0,
      top: 0
    };

    var tx = pointX;
    var ty = pointY;

    this.mouse.x = (tx - pos.left);
    this.mouse.y = (ty - pos.top);

    this.onKeyUpEvent(button == 0 ? KEY.MOUSE1 : KEY.MOUSE2, event);
  },
  //-----------------------------------------

  onKeyDownEvent: function (keyCode, event) {

    var code = keyCode;


    var action = this.bindings[code];
    if (action) {
      this.actions[action] = true;
      if (event && event.cancelable)
        event.preventDefault();
      if (!this.locks[action]) {
        this.presses[action] = true;
        this.locks[action] = true;
      }
    }
  },

  //-----------------------------------------
  onKeyUpEvent: function (keyCode) {

    var code = keyCode;

    var action = this.bindings[code];
    if (action) {
      if (event && event.cancelable)
        event.preventDefault();
      this.delayedKeyup.push(action);
    }
  },

  //-----------------------------------------
  bind: function (key, action) {
    if (key < 0) {
      this.initMouse();
    } else if (key > 0) {
      this.initKeyboard();
    }
    this.bindings[key] = action;
  },
  //-----------------------------------------
  unbind: function (key) {
    this.bindings[key] = null;
  },
  //-----------------------------------------
  unbindAll: function () {
    this.bindings = [];
  },
  //-----------------------------------------
  state: function (action) {
    return this.actions[action];
  },
  clearState: function (action) {
    this.actions[action] = false;
  },
  //-----------------------------------------
  pressed: function (action) {
    return this.presses[action];
  },
  //-----------------------------------------
  clearPressed: function () {
    for (var i = 0; i < this.delayedKeyup.length; i++) {
      var action = this.delayedKeyup[i];
      this.actions[action] = false;
      this.locks[action] = false;
    }
    this.delayedKeyup = [];
    this.presses = {};
  },
  //-----------------------------------------
  clearAllState: function () {
    this.actions = {};
    this.locks = {};
    this.delayedKeyup = [];
    this.presses = {};
  },
  //-----------------------------------------
});

KEY = {
  'MOUSE1': -1,
  'MOUSE2': -3,
  'MWHEEL_UP': -4,
  'MWHEEL_DOWN': -5,

  'BACKSPACE': 8,
  'TAB': 9,
  'ENTER': 13,
  'PAUSE': 19,
  'CAPS': 20,
  'ESC': 27,
  'SPACE': 32,
  'PAGE_UP': 33,
  'PAGE_DOWN': 34,
  'END': 35,
  'HOME': 36,
  'LEFT_ARROW': 37,
  'UP_ARROW': 38,
  'RIGHT_ARROW': 39,
  'DOWN_ARROW': 40,
  'INSERT': 45,
  'DELETE': 46,
  '0': 48,
  '1': 49,
  '2': 50,
  '3': 51,
  '4': 52,
  '5': 53,
  '6': 54,
  '7': 55,
  '8': 56,
  '9': 57,
  'A': 65,
  'B': 66,
  'C': 67,
  'D': 68,
  'E': 69,
  'F': 70,
  'G': 71,
  'H': 72,
  'I': 73,
  'J': 74,
  'K': 75,
  'L': 76,
  'M': 77,
  'N': 78,
  'O': 79,
  'P': 80,
  'Q': 81,
  'R': 82,
  'S': 83,
  'T': 84,
  'U': 85,
  'V': 86,
  'W': 87,
  'X': 88,
  'Y': 89,
  'Z': 90,
  'NUMPAD_0': 96,
  'NUMPAD_1': 97,
  'NUMPAD_2': 98,
  'NUMPAD_3': 99,
  'NUMPAD_4': 100,
  'NUMPAD_5': 101,
  'NUMPAD_6': 102,
  'NUMPAD_7': 103,
  'NUMPAD_8': 104,
  'NUMPAD_9': 105,
  'MULTIPLY': 106,
  'ADD': 107,
  'SUBSTRACT': 109,
  'DECIMAL': 110,
  'DIVIDE': 111,
  'F1': 112,
  'F2': 113,
  'F3': 114,
  'F4': 115,
  'F5': 116,
  'F6': 117,
  'F7': 118,
  'F8': 119,
  'F9': 120,
  'F10': 121,
  'F11': 122,
  'F12': 123,
  'SHIFT': 16,
  'CTRL': 17,
  'ALT': 18,
  'PLUS': 187,
  'COMMA': 188,
  'MINUS': 189,
  'PERIOD': 190
};

var gInputEngine = new InputEngineClass();
gInputEngine.KEY = KEY;

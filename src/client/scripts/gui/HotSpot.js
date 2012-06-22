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

HotSpotClass = Class.extend({
  rect: {x:242,y:208,w:18,h:19},
  fire: null,

  init: function (rect, fire) {
    this.rect = rect;
    this.fire = fire;
  },

  contains: function(pos) {
    return this.rect.x <= pos.x && this.rect.y <= pos.y && this.rect.x+this.rect.w > pos.x && this.rect.y+this.rect.h > pos.y;
  }

});

HotSpot = {}
HotSpot.singleton = new HotSpotClass();
HotSpot.Class = HotSpotClass;

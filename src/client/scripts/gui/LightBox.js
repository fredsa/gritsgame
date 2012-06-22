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

LightBoxClass = Class.extend({
  rect: {x:242,y:208,w:18,h:19},
  spriteSheet: null,
  hotSpots: [],

  init: function (rect, hotspots) {
    this.rect = rect;
    this.hotspots = hotspots;
    this.spriteSheet = new SpriteSheetClass();
    this.spriteSheet.load("img/player_sprites.png");

    this.spriteSheet.defSprite("mine0", rect.x, rect.y, rect.w, rect.h);
  },

  //-----------------------------
  update: function () {
  },

  //-----------------------------
  draw: function () {
    var spt = this.spriteSheet.getStats("mine0");
    var gMap = gGameEngine.gMap;
    //rotate based upon velocity
    var rect = this.rect;
    if (this.physBody) pPos = this.physBody.GetPosition();

    gRenderEngine.context.drawImage(this.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, rect.x - gMap.viewRect.x, rect.y - gMap.viewRect.y, spt.w, spt.h);
  },

  onClick: function(pos) {
    for(var i = 0; i < this.hotspots.length; i++) {
      var hs = this.hotspots[i];
      if(hs.contains(pos)) {
        hs.fire();
      }
    }
  }

});

LightBox = {}
LightBox.Class = LightBoxClass;

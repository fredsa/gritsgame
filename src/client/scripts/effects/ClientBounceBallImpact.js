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

ClientBounceBallImpactClass = EntityClass.extend({
  spriteSheet: null,
   lifetime: 10,
  currPos: {
    "x": 0,
    "y": 0
  },
  onInit: function (pos) {
     this.currPos.x = pos.x;
    this.currPos.y = pos.y;
    this.lifetime = 10;

    this.spriteSheet = new SpriteSheetClass();
    this.spriteSheet.load("img/player_sprites.png");
    this.spriteSheet.defSprite("muzzle0", 0, 312, 13, 330 - 312);

    this.spriteSheet.defSprite("bullet0", 208, 208, 5, 22);

    this.spriteSheet.defSprite("shells0", 13, 312, 5, 8);
    this.spriteSheet.defSprite("shells1", 21, 312, 5, 8);
    this.spriteSheet.defSprite("shells2", 26, 312, 5, 8);
	
	gGameEngine.playWorldSound("./sound/bounce0.ogg",pos.x,pos.y);
  },
//-----------------------------------------
  update: function () {

    this.lifetime--;
    if (this.lifetime <= 0) {
      gGameEngine.removeEntity(this);
      return;
    }

    this.parent();
  },
  //-----------------------------------------
  draw: function (fractionOfNextUpdate) {
    var spt = this.spriteSheet.getStats("muzzle0");
    var gMap = gGameEngine.gMap;
	var ctx =gRenderEngine.context;
    ctx.drawImage(this.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, this.currPos.x - gMap.viewRect.x, this.currPos.y - gMap.viewRect.y, spt.w, spt.h);
  }
});

Factory.nameClassMap['BounceBallImpact'] = ClientBounceBallImpactClass;

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

ClientSpawnEffectClass = EntityClass.extend({
  lifetime: 32,
  zIndex: 2,
  currPos: {
    "x": 0,
    "y": 0
  },
   spriteSheet: null,
  animList:new Array(),
  currAnimIdx: 0,  
  //----------------------------------
  onInit: function (owningPlayer, pos) {
	
    this.currPos.x = pos.x;
    this.currPos.y = pos.y;
    this.lifetime = 12;
	this.zIndex =30;
	
    this.spriteSheet = gSpriteSheets['grits_effects'];

	for(var i =1; i < 10; i++)
		this.animList.push("spawner_white_activate_000" + i + ".png");
	for(var i =10; i < 16; i++)
		this.animList.push("spawner_white_activate_00" + i + ".png");

		
	gGameEngine.playWorldSound("./sound/spawn0.ogg",pos.x, pos.y);
  },
	//----------------------------------
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
    //are we active?
   this.currAnimIdx =  (this.currAnimIdx + 1) % this.animList.length;
    var spt = this.spriteSheet.getStats(this.animList[this.currAnimIdx]);
    var gMap = gGameEngine.gMap;
	var pPos = this.currPos;
    gRenderEngine.context.drawImage(this.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, pPos.x - gMap.viewRect.x - 64, pPos.y - gMap.viewRect.y -64, spt.w, spt.h);
  }
});

Factory.nameClassMap['SpawnEffect'] = ClientSpawnEffectClass;

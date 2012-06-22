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

QuadPowerEffectClass = EntityClass.extend({
  zIndex: 2,
  currPos: {
    "x": 0,
    "y": 0
  },
  _spriteAnim: new SpriteSheetAnimClass(),
  owningPlayer:null,
  //----------------------------------
  onInit: function (owningPlayer, pos) {
    this.currPos.x = pos.x;
    this.currPos.y = pos.y;
	this.zIndex=20;
	this.owningPlayer = owningPlayer;
    this._spriteAnim.loadSheet('grits_effects',"img/grits_effects.png");
	
	for(var i =1; i < 10; i++)
		this._spriteAnim.pushFrame("quad_effect_000" + i + ".png");
	for(var i =10; i < 16; i++)
		this._spriteAnim.pushFrame("quad_effect_00" + i + ".png");

	gGameEngine.playWorldSound("./sound/quad_pickup.ogg",pos.x, pos.y);
				
  },
	//----------------------------------
  update: function () {

    if (this.owningPlayer.powerUpTime <= 0) {
      gGameEngine.removeEntity(this);
      return;
    }

	this.pos.x = this.owningPlayer.pos.x;
	this.pos.y  = this.owningPlayer.pos.y;
	
    this.parent();
  },



  //-----------------------------------------
  draw: function (fractionOfNextUpdate) {

	var pPos = this.owningPlayer.pos;
	this._spriteAnim.draw(pPos.x,pPos.y);
  }
});

Factory.nameClassMap['QuadEffect'] = QuadPowerEffectClass;

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

ClientHealthCanisterClass = HealthCanisterClass.extend({
  _spriteAnim: null,
  init: function (x, y, settings) {
	this.parent(x, y, settings);
	var startPos = {x:x,y:y};
	this._spriteAnim = new SpriteSheetAnimClass();
   	this._spriteAnim.loadSheet('grits_effects',"img/grits_effects.png");

    for(var i =0; i < 10; i++)
		this._spriteAnim.pushFrame("health_canister_red_000" + i + ".png");
	for(var i =10; i < 16; i++)
		this._spriteAnim.pushFrame("health_canister_red_00" + i + ".png");
		
  },

  //-----------------------------------------
  draw: function (fractionOfNextUpdate) {
    var gMap = gGameEngine.gMap;
    //rotate based upon velocity
    var pPos = this.pos;
    if (this.physBody) pPos = this.physBody.GetPosition();
	this._spriteAnim.draw(pPos.x,pPos.y);
  },
  //-----------------------------------------
  onTouch: function (otherBody, point, impulse) {
  
   if (!this.physBody) return false;

    if (otherBody == null || !otherBody.GetUserData()) return false; //invalid object??
    var physOwner = otherBody.GetUserData().ent;
    if (physOwner != null) {
		
		gGameEngine.playWorldSound("./sound/item_pickup0.ogg",this.pos.x,this.pos.y);	  
	  this.markForDeath = true;  
    }
	
	return true;
    
  },
});

Factory.nameClassMap['HealthCanister'] = ClientHealthCanisterClass;

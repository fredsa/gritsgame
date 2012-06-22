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

ClientLandmineDiskClass = LandmineDiskClass.extend({
 _spriteAnim: new SpriteSheetAnimClass(),
  init: function (x, y, settings) {
	this.parent(x, y, settings);
	var owningPlayer = gGameEngine.namedEntities[settings.owner];
	var startPos = settings.pos;
	var dir = settings.dir;
    this._spriteAnim.loadSheet('grits_effects',"img/grits_effects.png");
	
	for(var i =1; i < 10; i++)
		this._spriteAnim.pushFrame("landmine_idle_000" + i + ".png");
	for(var i =10; i < 30; i++)
		this._spriteAnim.pushFrame("landmine_idle_00" + i + ".png");
  },
  //-----------------------------------------
	update: function () {

    if (this.lifetime - 0.05 <= 0) {
      //spawn impact visual
      var pPos = this.physBody.GetPosition();
	   var efct = gGameEngine.spawnEntity("InstancedEffect", pPos.x, pPos.y, null);
		efct.onInit({x:pPos.x,y:pPos.y},
				{	playOnce:true, 
					similarName:"landmine_explosion_small_", 
					uriToSound:"./sound/explode0.ogg"
				});
				
				
     // var ent = gGameEngine.spawnEntity("LandmineExplode", pPos.x, pPos.y, null);
     // ent.onInit(pPos);
    }


    this.parent();
  },
  //-----------------------------------------
  draw: function (fractionOfNextPhysicsUpdate) {
    
    //rotate based upon velocity
    var pPos = this.pos;
    if (this.physBody) pPos = this.physBody.GetPosition();

	this._spriteAnim.draw(pPos.x,pPos.y);
	
  }
});

Factory.nameClassMap['LandmineDisk'] = ClientLandmineDiskClass;

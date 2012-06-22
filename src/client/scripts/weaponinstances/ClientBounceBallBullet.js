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

ClientBounceBallBulletClass = BounceBallBulletClass.extend({
  _spriteAnim: new SpriteSheetAnimClass(),
  init: function (x, y, settings) {
	this.parent(x, y, settings);
	var owningPlayer = gGameEngine.namedEntities[settings.owner];
	var startPos = settings.pos;
	var dir = settings.dir;
 this._spriteAnim.loadSheet('grits_effects',"img/grits_effects.png");

    for(var i =1; i < 8; i++)
		this._spriteAnim.pushFrame("grenade_launcher_projectile_000" + i + ".png");

	
	gGameEngine.playWorldSound("./sound/grenade_shoot0.ogg",x,y);
  },

  //-----------------------------------------
  draw: function (fractionOfNextPhysicsUpdate) {
    var gMap = gGameEngine.gMap;
    
    //rotate based upon velocity
    var pPos = this.pos;
    if (this.physBody) pPos = this.physBody.GetPosition();

    var interpolatedPosition = {x:pPos.x, y:pPos.y};
	var rotRads = this.owningPlayer.faceAngleRadians;
    if(this.physBody) {
      var velocity = this.physBody.GetLinearVelocity();
      interpolatedPosition.x += (velocity.x * Constants.PHYSICS_LOOP_HZ) * fractionOfNextPhysicsUpdate;
      interpolatedPosition.y += (velocity.y * Constants.PHYSICS_LOOP_HZ) * fractionOfNextPhysicsUpdate;
	  
	  rotRads = Math.atan2(velocity.y, velocity.x);
    }

	this._spriteAnim.draw(interpolatedPosition.x,interpolatedPosition.y,{rotRadians:rotRads});
  }
});

Factory.nameClassMap['BounceBallBullet'] = ClientBounceBallBulletClass;

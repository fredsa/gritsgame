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

LandmineDiskClass = WeaponInstanceClass.extend({
  lifetime: 0,
  physBody: null,
  team:null,
  init: function (x, y, settings) {
	this.parent(x, y, settings);
	var startPos = settings.pos;
	
    
    this.lifetime = 100;
    this.team = settings.team;

    //DETERMINE WHAT OUR ROTATION ANGLE IS
    rotAngle = 0;
    var guid = newGuid_short();
    //create our physics body;
    var entityDef = {
      id: "wpnLandmineDisk" + guid,
      type: 'static',
      x: startPos.x,
      y: startPos.y,
      halfHeight: 18 * 0.5,
      halfWidth: 19 * 0.5,
      damping: 0,
      angle: 0,
      categories: ['projectile', this.team == 0 ? 'team0' : 'team1'],
      collidesWith: [this.team == 0 ? 'team1' : 'team0'],
      userData: {
        "id": "wpnLandmineDisk" + guid,
        "ent": this
      }
    };
    this.physBody = gPhysicsEngine.addBody(entityDef);

    this.physBody.SetLinearVelocity(new Vec2(0, 0));
  },
  kill: function () {
    //remove my physics body
    gPhysicsEngine.removeBodyAsObj(this.physBody);
    this.physBody = null;
    //destroy me as an ent.
    gGameEngine.removeEntity(this);
  },
  update: function () {
    this.lifetime-=0.05;
    if (this.lifetime <= 0) {
      this.kill();
      return;
    }


    this.parent();
  },

  onTouch: function (otherBody, point, impulse) {
    if (!this.physBody) return false;

    if (otherBody ==null || !otherBody.GetUserData()) return false; //invalid object??
    var physOwner = otherBody.GetUserData().ent;
   


    //spawn impact visual
	if (!IS_SERVER) {
                this.makeBang();
	}
	else
	{
		gGameEngine.dealDmg(this,physOwner,parseInt(15 * this.damageMultiplier));
	}

    this.markForDeath = true;

    return true; //return false if we don't validate the collision
  },

});

//exports.Class = LandmineDiskClass;
Factory.nameClassMap['LandmineDisk'] = LandmineDiskClass;

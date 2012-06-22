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

BounceBallBulletClass = WeaponInstanceClass.extend({
  rotAngle: 0,
  lifetime: 0,
  physBody: null,
  init: function (x, y, settings) {
	this.parent(x, y, settings);
	var owningPlayer = gGameEngine.namedEntities[settings.owner];
	var startPos = settings.pos;
	var dir = settings.dir;
	
    //this.parent(owningPlayer);
    
    this.lifetime = 101;

    //DETERMINE WHAT OUR ROTATION ANGLE IS
    rotAngle = 0;
    var guid = newGuid_short();
    //create our physics body;
    var entityDef = {
      id: "MachineBullet" + guid,
      x: startPos.x,
      y: startPos.y,
      halfHeight: 5 * 0.5,
      halfWidth: 11 * 0.5,
      damping: 0,
      angle: rotAngle,
      useBouncyFixture: true,
      categories: ['projectile', owningPlayer.team == 0 ? 'team0' : 'team1'],
      collidesWith: ['mapobject', owningPlayer.team == 0 ? 'team1' : 'team0'],
      userData: {
        "id": "wpnMachineBullet" + guid,
        "ent": this
      }
    };
    this.physBody = gPhysicsEngine.addBody(entityDef);

    this.physBody.SetLinearVelocity(new Vec2(dir.x * 800, dir.y * 800));
  },
  kill: function () {
    //remove my physics body
    gPhysicsEngine.removeBodyAsObj(this.physBody);
    this.physBody = null;
    //destroy me as an ent.
    gGameEngine.removeEntity(this);
  },
  update: function () {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.kill();
      return;
    }

    if (this.physBody != null) {
      this.autoAdjustVelocity();
      var pPos = this.physBody.GetPosition();
      this.pos.x = pPos.x;
      this.pos.y = pPos.y;
    }

    this.parent();
  },

  sendUpdates: function () {
    this.sendPhysicsUpdates();
  },

  onTouch: function (otherBody, point, impulse) {
    if (!this.physBody) {
      // The object has already been killed, ignore
      return false;
    }
	
    if (otherBody ==null || !otherBody.GetUserData()) {
      Logger.log("Invalid collision object");
      return false; //invalid object??
    }
    var physOwner = otherBody.GetUserData().ent;
    if (physOwner != null) {
      if (physOwner._killed) return false;

      //spawn impact visual
      if (!IS_SERVER) {
        var pPos = this.physBody.GetPosition();
        var ent = gGameEngine.spawnEntity("BounceBallImpact", pPos.x, pPos.y, null);
        // TODO: pass in settings
        ent.onInit(pPos);
      }
      else
      {
        gGameEngine.dealDmg(this,physOwner,parseInt(5 * this.damageMultiplier));
      }

      this.markForDeath = true;
    } else {
      // The bullet should bounce off walls and other things using box2d
    }

    return true; //return false if we don't validate the collision
           },

});

Factory.nameClassMap['BounceBallBullet'] = BounceBallBulletClass;

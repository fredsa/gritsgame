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

ShotGunClass = WeaponClass.extend({
  itemID: "8234",
  // ABCD format ,hex

  drawPulse: 0,
  drawSide: false,
  onInit: function (owningPlayer) {
    this.parent(owningPlayer);
	this.fireDelayInSeconds = 0.25;
	this.energyCost = 4;
  },
onUpdate: function (owningPlayer) 
  {
  },
  
  onFire: function (owningPlayer) {
    this.parent(owningPlayer);
	if(!this.firing)
		return;

    var gMap = gGameEngine.gMap;

	var numBullets = 5;
	var incr = (2.0 / numBullets);
	for(var i =0; i < numBullets; i++)
	{
		var sprayOffset = (incr * (i + 1) )-1;
		//cast a ray and see if we hit something
		var point1 = new Vec2(owningPlayer.pos.x, owningPlayer.pos.y);
		var dir = new Vec2(Math.cos(owningPlayer.faceAngleRadians + sprayOffset), Math.sin(owningPlayer.faceAngleRadians + sprayOffset));
		point1.x += dir.x * 20;
		point1.y += dir.y * 20;


		var ent = gGameEngine.spawnEntity("SimpleProjectile", point1.x - gMap.viewRect.x, point1.y - gMap.viewRect.y, {
			name:owningPlayer.name+"_SGB_"+gGameEngine.nextSpawnId(),
			owner:owningPlayer.name,
                        faceAngleRadians:owningPlayer.faceAngleRadians,
                        team:owningPlayer.team,
			pos:point1,
			dir:dir,
			lifetimeInSeconds:2,
			speed:700,
			animFrameName:"shotgun_projectile_00",
			spawnSound:"./sound/shotgun_shoot0.ogg",
			impactFrameName:"shotgun_impact_00",
			impactSound:"./sound/bounce0.ogg"
			
			});
	}



  },
});

//exports.Class = ShotGunClass;
Factory.nameClassMap['ShotGun'] = ShotGunClass;

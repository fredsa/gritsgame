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

RocketLauncherClass = WeaponClass.extend({
  itemID: "4805",
  // ABCD format ,hex
  
  drawPulse: 0,
  drawSide: false,
  onInit: function (owningPlayer) {
    this.parent(owningPlayer);
	this.energyCost = 10;
	this.fireDelayInSeconds = 0.5;
  },
  
  onUpdate: function (owningPlayer) 
  {
	
  },
  
  onFire: function (owningPlayer) {
   this.parent(owningPlayer);
	if(!this.firing)
		return;

    var gMap = gGameEngine.gMap;

    //cast a ray and see if we hit something
    var point1 = new Vec2(owningPlayer.pos.x, owningPlayer.pos.y);
    var dir = new Vec2(Math.cos(owningPlayer.faceAngleRadians), Math.sin(owningPlayer.faceAngleRadians));
    point1.x += dir.x * 20;
    point1.y += dir.y * 20;


    var ent = gGameEngine.spawnEntity("SimpleProjectile", point1.x - gMap.viewRect.x, point1.y - gMap.viewRect.y, {
		name:owningPlayer.name+"_RLR_"+gGameEngine.nextSpawnId(),
		owner:owningPlayer.name,
                faceAngleRadians:owningPlayer.faceAngleRadians,
                team:owningPlayer.team,
		pos:point1,
		dir:dir,
		lifetimeInSeconds:3,
		speed:900,
		animFrameName:"rocket_launcher_projectile_00",
		spawnSound:"./sound/rocket_shoot0.ogg",
		impactFrameName:"rocket_launcher_impact_00",
		impactSound:"./sound/explode0.ogg"
		
		});



  },
});

//exports.Class = RocketLauncherClass;
Factory.nameClassMap['RocketLauncher'] = RocketLauncherClass;

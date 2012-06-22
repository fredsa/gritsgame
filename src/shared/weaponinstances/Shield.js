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

ShieldInstanceClass = WeaponInstanceClass.extend({
  physBody: null,
  team:null,
  owningPlayer:null,
  init: function (x, y, settings) {
	this.parent(x, y, settings);
	this.owningPlayer = gGameEngine.namedEntities[settings.owner];
	var startPos = settings.pos;
	
   
    this.team = this.owningPlayer.team;

    //DETERMINE WHAT OUR ROTATION ANGLE IS
    rotAngle = 0;
    var guid = newGuid_short();
    //create our physics body;
    var entityDef = {
      id: "ShieldInstanceClass" + guid,
      type: 'static',
      x: startPos.x,
      y: startPos.y,
      halfHeight: 15,
      halfWidth: 15,
      damping: 0,
      angle: 0,
      categories: [this.owningPlayer.team == 0 ? 'team0' : 'team1'],
      collidesWith: [this.owningPlayer.team == 0 ? 'team1' : 'team0'],
      userData: {
        "id": "ShieldInstanceClass" + guid,
        "ent": this
      }
    };
    this.physBody = gPhysicsEngine.addBody(entityDef);

    this.physBody.SetLinearVelocity(new Vec2(0, 0));
	this.energyCost = 0.05;
	
	if(!IS_SERVER)
	{
		gGameEngine.playWorldSound("./sound/shield_activate.ogg",x,y);
		this.zIndex = 20;
	}
  },
  kill: function () {
    //remove my physics body
    gPhysicsEngine.removeBodyAsObj(this.physBody);
    this.physBody = null;
    //destroy me as an ent.
    gGameEngine.removeEntity(this);
  },
  
  update: function () 
  {
	if(!IS_SERVER)
	{
		if(!this.owningPlayer.pInput.fire2 || this.owningPlayer.energy<=0)
			this.markForDeath = true;
	}
		//we're still alive
		this.physBody.SetPosition(this.owningPlayer.physBody.GetPosition());

	

    this.parent();
  },
   //-----------------------------------------
  draw: function (fractionOfNextPhysicsUpdate) {
    //rotate based upon velocity
    var pPos = this.pos;
    if (this.physBody) pPos = this.physBody.GetPosition();
	
	
	drawSprite("shield_defensive.png", pPos.x, pPos.y);
	
	
  }

});

Factory.nameClassMap['ShieldInstance'] = ShieldInstanceClass;

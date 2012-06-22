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


function AngleBetween(a, b) {
  var dotProd = a.dot(b);
  var lenProd = a.length() * b.length();
  var divOperation = dotProd / lenProd;
  return Math.acos(divOperation); // * (180.0 / Math.PI);
}

PlayerClass = EntityClass.extend({
  walkSpeed: 52*5, //JJG: move 5 tiles/sec
  weapons: null,
  legRotation: 90.0,
  walking: false,
  physBody: null,
  faceAngleRadians: 0,
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  team: 0, //0 or 1,
  color: 0, 
  numKills: 0,
  powerUpTime:0,
  isDead:false,
  zIndex: 1,
  init: function (inputx, inputy, settings) {
    settings.hsize = {x:26, y:26};
    this.parent(inputx, inputy, settings);
    this.weapons = [null, null, null];
    this.team = settings.team;
    var entityDef = {
      id: "player",
      x: this.pos.x,
      y: this.pos.y,
      halfHeight: this.hsize.x / 2, //JJG: divide by 2 to let the player squeeze through narrow corridors
      halfWidth: this.hsize.y / 2,
      damping: 0,
      angle: 0,
      categories: ['player', settings.team == 0 ? 'team0' : 'team1'],
      collidesWith: ['all'],
      //mapobject','team0','team1','projectile','pickupobject'],
      userData: {
        "id": "player",
        "ent": this
      }
    };
    this.physBody = gPhysicsEngine.addBody(entityDef);

    var weapon0Class = Factory.getClass("ShotGun");//("ChainGun");//("ShotGun");//("MachineGun");//("BounceBallGun");
    this.weapons[0] = new weapon0Class();
    this.weapons[0].onInit(this);

    var weapon1Class = Factory.getClass("Shield");//("Landmine");
    this.weapons[1] = new weapon1Class();
    this.weapons[1].onInit(this);
	
	var weapon2Class = Factory.getClass("Thrusters");
    this.weapons[2] = new weapon2Class();
    this.weapons[2].onInit(this);
	
    this.userID = settings.userID;
    this.displayName = settings.displayName;
	
  },

  update: function () {
    this.parent();

	if(IS_SERVER)
	{
		if(this.powerUpTime>0) 
		  this.powerUpTime -=0.05;//CLM attempt to make this 'seconds' accurate?
		else
			this.powerUpTime =0;
	}
	
	for(var i =0; i < this.weapons.length; i++)
		this.weapons[i].onUpdate(this);
	 
	if(this.health<=0)
	{
		if (IS_SERVER && !this.isDead) {
                  Server.stats.log('death_pos', {'x':this.pos.x, 'y':this.pos.y, 'team':this.team});
                }
		this.isDead = true;
		this.physBody.SetActive(false);
	}
	else
	{
		//did we just respawn?
		if(this.isDead)
		{
			this.isDead = false;
			this.physBody.SetActive(true);
			if(!IS_SERVER)
			{
				var pPos = this.physBody.GetPosition();
				var ent = gGameEngine.spawnEntity("SpawnEffect", pPos.x, pPos.y, null);
				ent.onInit(this,pPos);
				
			}
		
		}
	}
	
		
  },

  applyInputs: function () {
    if (this.pInput) {
      this.faceAngleRadians = this.pInput.faceAngle0to7 / 8 * 2 * Math.PI;
      this.walking = this.pInput.walking;
      this.legRotation = this.pInput.legRotation;

      var vx = this.pInput.x;
      var vy = this.pInput.y;
      var ovx = vx;
      var ovy = vy;
      var adjust = this.getPhysicsSyncAdjustment();
      vx += adjust.x;
      vy += adjust.y;

      //Logger.log(vx + ' ' + vy + ' ' + ovx + ' ' + ovy);
      this.physBody.SetLinearVelocity(new Vec2(vx, vy));
		
      //are we shooting?
      if (IS_SERVER)
	  {	
			for(var i =0; i < this.weapons.length; i++)
				this.weapons[i].firing = false;
			
			//CLM if you're dead, don't fire things!
			if(!this.isDead)
			{
				if(this.pInput.fire0 && 
					this.energy >= this.weapons[0].energyCost) 
				{
					this.weapons[0].onFire(this);
				} 
				else if (this.pInput.fire1 && 
						this.energy >= this.weapons[1].energyCost) 
				{
					this.weapons[1].onFire(this);
				}
				else if (this.pInput.fire2 && 
						this.energy >= this.weapons[2].energyCost) 
				{
					this.weapons[2].onFire(this);
				}
			}
	  }
      if (this.pInput.fire0_off) {
        this.pInput.fire0 = false;
      }
      if (this.pInput.fire1_off) {
        this.pInput.fire1 = false;
      }
	   if (this.pInput.fire2_off) {
        this.pInput.fire2 = false;
      }
    }
  },

  sendUpdates: function () {
    this.sendPhysicsUpdates(true);
    if (this.pInput) this.toOthers.q_input(this.pInput);
    if (IS_SERVER) {
      this.toAll.q_stats({
          health: this.health,
          energy: this.energy,
		  walkSpeed: this.walkSpeed,
		  powerUpTime: Math.floor(this.powerUpTime),
		  numKills: this.numKills,
      });
    }
  },

  on_input: function (msg) {
    if (this.pInput && this.pInput.fire0 && !msg.fire0) {
      msg.fire0 = true;
      msg.fire0_off = true;
    }
    if (this.pInput && this.pInput.fire1 && !msg.fire1) {
      msg.fire1 = true;
      msg.fire1_off = true;
    }
	if (this.pInput && this.pInput.fire2 && !msg.fire2) {
      msg.fire2 = true;
      msg.fire2_off = true;
    }
    this.pInput = msg;
  },

  on_stats: function (msg) {
	if(IS_SERVER) return;	 //this is a client only function
	
	this.health = msg.health;
	this.energy = msg.energy;
	this.walkSpeed = msg.walkSpeed;
	this.powerUpTime = msg.powerUpTime;
	this.numKills = msg.numKills;
  },

  takeDamage: function(amount) {
    this.health -= amount;
  },
  
  resetStats:function()
  {
	this.health = 100;
	this.energy = 100;
	this.isDead = false;
	this.powerUpTime = 0;
	this.physBody.SetActive(true);
  },

  on_setPosition: function (msg) {
    this.centerAt(msg);
  },
  
  on_setWeapons: function (msg) {
	
	//set our weapons based on the message input
	var weapon0Class = Factory.nameClassMap[msg.wep0];
    this.weapons[0] = new(weapon0Class)();
    this.weapons[0].onInit(this);

    var weapon1Class = Factory.nameClassMap[msg.wep1];
    this.weapons[1] = new(weapon1Class)();
    this.weapons[1].onInit(this);
	
	var weapon2Class = Factory.nameClassMap[msg.wep2];
    this.weapons[2] = new(weapon2Class)();
    this.weapons[2].onInit(this);
    
  },
  
});
Factory.nameClassMap["Player"] = PlayerClass;

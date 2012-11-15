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

GameEngineClass = Class.extend({

  clearColor: '#000000',
  gravity: 0,
  screen: {
    x: 0,
    y: 0
  },

  entities: [],
  namedEntities: {},
  backgroundAnims: {},
  
  spawnCounter: 0,

  cellSize: 64,
  timeSinceGameUpdate: 0,
  timeSincePhysicsUpdate: 0,
  clock: null,

  _deferredKill: [],
  _deferredRespawn: [],
  
  dataTypes: [],
  localUserID: -1,
  gMap: null,
  gPlayer0: null,
  gPlayers: {},
  fps:0,
  currentTick:0,
  lastFpsSec:0,

  init: function () {
    this.clock = new TimerClass();
  },

  //-----------------------------
  setup: function () {
    //create physics
    gPhysicsEngine.create(Constants.PHYSICS_UPDATES_PER_SEC, false);
    gPhysicsEngine.addContactListener({
      BeginContact: function (idA, idB) {
        // log('bc');
      },

      PostSolve: function (bodyA, bodyB, impulse) {
		
			
		if (impulse < 0.1) return;
	 
		var u = [bodyA.GetUserData(),bodyB.GetUserData()];
		var nm = ['',''];
		var typ = [-1,-1];//0,1,2 = player, projectile, wall
		
		//figure out what our player names are,and what types they are
		for(var i =0; i < 2; i++)
		{
		  if (u[i] != null)
			{
				if(u[i].ent != null) 
				{
					nm[i] = u[i].ent.name || '';
					if(u[i].ent.walkSpeed != null)
						typ[i] = 0;	//player
					else
						typ[i] = 1;	//projectile / object
				}
				else
				{
					typ[i] = 2;	//wall
				}
				
			}
		}
	
		//if this is player/player, or player/wall, ignore it!
			if(typ[0] == 0)
				if(typ[1] == 0 || typ[1] == 2)
					return;
				
			if(typ[1] == 0)
				if(typ[0] == 0 || typ[0] == 2)
					return;
				
				
				
		if(IS_SERVER)		
		{
			//we care about sending this along, so do such.
			Server.broadcaster.q_collision({
			  ent0: nm[0],
			  ent1: nm[1],
			  impulse: impulse,
			});
		}
		else
		{
			//if we're client ignore the collision unless it's projectile/wall
			if(typ[0] == 1)
				if(typ[1] != 2)
					return;
				
			if(typ[1] == 1)
				if(typ[0] != 2)
					return;
		}
	  gGameEngine.onCollisionTouch(bodyA,bodyB,impulse);
	  
		
	  
      }
    });

	
    //clm hax - force load a map
    this.gMap = new TileMapLoaderClass();
    this.gMap.load(map1);
	
  },
  notifyPlayers : function(msg) {
  if(!IS_SERVER)return;
	Server.broadcaster.q_statusMsg({msg:msg});
  },
  //-----------------------------
  onCollisionTouch: function(bodyA,bodyB,impulse)
  {
        if (impulse < 0.1) return;
        var uA = bodyA?bodyA.GetUserData():null;
        var uB = bodyB?bodyB.GetUserData():null;
        //CLM commented out due to perf spew
        //Logger.log('Touch' + uA + ' ' + uB + ' ' + uA.ent + ' ' + uB.ent);

        if (uA != null) {
          if (uA.ent != null && uA.ent.onTouch) {
            uA.ent.onTouch(bodyB, null, impulse);
          }
        }

        if (uB != null) {
          if (uB.ent != null && uB.ent.onTouch) {
            uB.ent.onTouch(bodyA, null, impulse);
          }
        }
  },

	//returns time in seconds
  getTime: function() { return this.currentTick * 0.05; },
  
  getEntityByName: function (name) {
    return this.namedEntities[name];
  },

  getEntityById: function(id) {
    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      if (ent.id == id) {
        return ent;
      }
    }
    return null;
  },

  getEntitiesByLocation: function (pos) {
    var a = [];
    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      if (ent.pos.x <= pos.x && ent.pos.y <= pos.y && (ent.pos.x + ent.size.x) > pos.x && (ent.pos.y + ent.size.y) > pos.y) {
        a.push(ent);
      }
    }
    return a;
  },

  getEntitiesWithinCircle: function(center, radius) {
    var a = [];
    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      var dist = Math.sqrt((ent.pos.x - center.x)*(ent.pos.x - center.x) + (ent.pos.y - center.y)*(ent.pos.y - center.y));
      if (dist <= radius) {
        a.push(ent);
      }
    }
    return a;
  },

  getEntitiesByType: function (typeName) {
    var entityClass = Factory.nameClassMap[typeName];
    var a = [];
    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      if (ent instanceof entityClass && !ent._killed) {
        a.push(ent);
      }
    }
    return a;
  },

  nextSpawnId: function () {
	return this.spawnCounter++;
  },

  onSpawned: function () {},
  onUnspawned: function () {},

  spawnEntity: function (typename, x, y, settings) {
    var entityClass = Factory.nameClassMap[typename];
    var es = settings || {};
    es.type = typename;
    var ent = new(entityClass)(x, y, es);
    var msg = "SPAWNING " + typename + " WITH ID " + ent.id;
    if (ent.name) {
      msg += " WITH NAME " + ent.name;
    }
    if (es.displayName) {
      msg += " WITH displayName " + es.displayName;
    }
    if (es.userID) {
      msg += " WITH userID " + es.userID;
    }
    if (es.displayName) {
      Logger.log(msg);
    }
    gGameEngine.entities.push(ent);	
    if (ent.name) {
      gGameEngine.namedEntities[ent.name] = ent;
    }
    gGameEngine.onSpawned(ent);
    if (ent.type == "Player") {
      this.gPlayers[ent.name] = ent;
    }
    return ent;
  },
  
  respawnEntity: function(respkt)
  {
	if(IS_SERVER)
	{
		var player = this.namedEntities[respkt.from];
		if(!player)
		{
			Logger.log("player.id = " + respkt.from  + " Not found for respawn");
			return;
		}
		
		this._deferredRespawn.push(respkt);
		
	}
		
  },

  removeEntity: function (ent) {
    if (!ent) return;

    this.onUnspawned(ent);

    // Remove this entity from the named entities
    if (ent.name) {
      delete this.namedEntities[ent.name];
      delete this.gPlayers[ent.name];
    }

    // We can not remove the entity from the entities[] array in the midst
    // of an update cycle, so remember all killed entities and remove
    // them later.
    // Also make sure this entity doesn't collide anymore and won't get
    // updated or checked
    ent._killed = true;

    this._deferredKill.push(ent);
  },


  run: function () {
    this.fps++;
    GlobalTimer.step();

    var timeElapsed = this.clock.tick();
    this.timeSinceGameUpdate += timeElapsed;
    this.timeSincePhysicsUpdate += timeElapsed;

    while (this.timeSinceGameUpdate >= Constants.GAME_LOOP_HZ &&
      this.timeSincePhysicsUpdate >= Constants.PHYSICS_LOOP_HZ) {
      // JJG: We should to do a physics update immediately after a game update to avoid
      //      the case where we draw after a game update has run but before a physics update
      this.update();
      this.updatePhysics();
      this.timeSinceGameUpdate -= Constants.GAME_LOOP_HZ;
      this.timeSincePhysicsUpdate -= Constants.PHYSICS_LOOP_HZ;
    }

    while (this.timeSincePhysicsUpdate >= Constants.PHYSICS_LOOP_HZ) {
      // JJG: Do extra physics updates
      this.updatePhysics();
      this.timeSincePhysicsUpdate -= Constants.PHYSICS_LOOP_HZ;
    }

    if(this.lastFpsSec < this.currentTick/Constants.GAME_UPDATES_PER_SEC && this.currentTick % Constants.GAME_UPDATES_PER_SEC == 0) {
      this.lastFpsSec = this.currentTick / Constants.GAME_UPDATES_PER_SEC;
      this.fps = 0;
    }
  },


  update: function () {
    this.currentTick++;

    // entities
    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      if (!ent._killed) {
        ent.update();
      }
    }
    // remove all killed entities
    for (var i = 0; i < this._deferredKill.length; i++) {
      this.entities.erase(this._deferredKill[i]);
    }
    this._deferredKill = [];

    for (var p in this.gPlayers) {
		this.gPlayers[p].applyInputs();
    }
	
	//respawn entities
	  
	   
	for (var i = 0; i < this._deferredRespawn.length; i++) {
				
		var pkt = this._deferredRespawn[i];
		var p = this.namedEntities[pkt.from];
		var spawnPoint = "Team"+p.team+"Spawn0";
		var ent = this.getEntityByName(spawnPoint);
		if(!ent)
		{
			Logger.log("Did not find spawn point");
			return;
		}
		p.resetStats();
		p.centerAt(ent.pos);
		var wep_pktt = {
                from: p.name,
				wep0: pkt.wep0,
	   			wep1: pkt.wep1,
	   			wep2: pkt.wep2,
              };
		p.on_setWeapons(wep_pktt);
		p.toAll.q_setWeapons(wep_pktt);
		p.toAll.q_setPosition(ent.pos);
		
		
		Logger.log("Respawned entity " + p.name + "at location " + p.pos.x + "," + p.pos.y);
	}
	this._deferredRespawn.length=0;
		
  },

  updatePhysics: function() {
    gPhysicsEngine.update();


    for (var p in this.gPlayers) {
      var plyr = this.gPlayers[p];
      var pPos = plyr.physBody.GetPosition();
      plyr.pos.x = pPos.x;
      plyr.pos.y = pPos.y;
    }
  },
   //-----------------------------
  dealDmg: function(fromObj,toPlayer,amt)
  {
	if(!IS_SERVER)return;
	var objOwner = fromObj.owningPlayer;
	if (toPlayer == null || toPlayer._killed) return false;
	 
	if(toPlayer.takeDamage)
		toPlayer.takeDamage(amt);
	
	if(toPlayer.health <=0)
	{
		this.notifyPlayers(toPlayer.displayName + " was killed by " + objOwner.displayName );
		objOwner.numKills++;
	}
  },
  //-----------------------------
  on_collision: function (msg) {
		var ent0 = this.getEntityByName(msg.ent0);
		var ent1 = this.getEntityByName(msg.ent1);
		if(ent0 == null) ent0 = this.getEntityById(msg.ent0);
		if(ent1 == null) ent1 = this.getEntityById(msg.ent1);
		var body0 = null;
		var body1 = null;
		
		if(ent0 != null)
			body0 = ent0.physBody;
		if(ent1 != null)
			body1 = ent1.physBody;
		
		
		this.onCollisionTouch(body0,body1,msg.impulse);
		
	},
	
  //-----------------------------
  spawnPlayer: function (id, teamID, spname, typename, userID, displayName) {
    Logger.log("spawn " + id + " at " + spname);
    var ent = this.getEntityByName(spname);
    if(ent == null)
    {
    	console.log("could not find ent " + spname);
    	return -1;
    }
     this.gPlayers[id] = this.spawnEntity(typename, ent.pos.x, ent.pos.y, {name: '!'+id, team: teamID, userID: userID, displayName: displayName});
	 this.gPlayers[id].health = 0;
	 return this.gPlayers[id];
  },
  //-----------------------------
  unspawnPlayer: function (id) {
	if(this.gPlayers[id])
		this.notifyPlayers(this.gPlayers[id].displayName + " disconnected.");
    this.removeEntity(this.gPlayers[id]);
  }

});

var gGameEngine =  new GameEngineClass();
//exports.Class = GameEngineClass;

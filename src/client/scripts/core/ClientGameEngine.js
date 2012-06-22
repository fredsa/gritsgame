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

ClientGameEngineClass = GameEngineClass.extend({
  gSocket: null,
  colorTintCanvas:null,
  colorTintCanvasContext:null,
  colorTintCanvas2:null,
  colorTintCanvasContext2:null,
  newMapPos: {x:0,y:0},

  init: function () {
    this.parent();
  },
  //-----------------------------
  setup: function () {
    this.parent();
	this.colorTintCanvas= document.createElement('canvas');
	this.colorTintCanvas.width = 128;
	this.colorTintCanvas.height = 128;
	this.colorTintCanvasContext = this.colorTintCanvas.getContext('2d');
	this.colorTintCanvas2= document.createElement('canvas');
	this.colorTintCanvas2.width = 128;
	this.colorTintCanvas2.height = 128;
	this.colorTintCanvasContext2 = this.colorTintCanvas2.getContext('2d');

	
    gInputEngine.bind(gInputEngine.KEY.W, 'move-up');
    gInputEngine.bind(gInputEngine.KEY.S, 'move-down');
    gInputEngine.bind(gInputEngine.KEY.A, 'move-left');
    gInputEngine.bind(gInputEngine.KEY.D, 'move-right');

    gInputEngine.bind(gInputEngine.KEY.UP_ARROW, 'fire-up');
    gInputEngine.bind(gInputEngine.KEY.DOWN_ARROW, 'fire-down');
    gInputEngine.bind(gInputEngine.KEY.LEFT_ARROW, 'fire-left');
    gInputEngine.bind(gInputEngine.KEY.RIGHT_ARROW, 'fire-right');

    //firing
    gInputEngine.bind(gInputEngine.KEY.MOUSE1, 'fire0-mouse');
    gInputEngine.bind(gInputEngine.KEY.SHIFT, 'fire1-instead-of-0');
    gInputEngine.bind(gInputEngine.KEY.MOUSE2, 'fire1-mouse');
    gInputEngine.bind(gInputEngine.KEY.SPACE, 'fire2');

    // Misc Commands
  },
  //-----------------------------
  update: function () {
    this.parent();


    var inputEngine = gInputEngine;

    if (gRenderEngine.canvas.width != this.gMap.viewRect.w) {
      this.gMap.viewRect.w = gRenderEngine.canvas.width;

    }
    if (gRenderEngine.canvas.height != this.gMap.viewRect.h) {
      this.gMap.viewRect.h = gRenderEngine.canvas.height;
    }

    if (!this.gPlayer0 || this.gPlayer0.isDead) {
      return;
    }

    //logic
    var pInput = {
      x: 0,
      y: 0,
      faceAngle0to7: 0, // Limited to 8 directions
      legRotation: 0,
      walking: false,
      fire0: false,
      fire1: false,
	  fire2: false
    };
    var move_dir = new Vec2(0, 0);
    if (gInputEngine.state('move-up'))
      move_dir.y -= 1;
    if (gInputEngine.state('move-down'))
      move_dir.y += 1;
    if (gInputEngine.state('move-left'))
      move_dir.x -= 1;
    if (gInputEngine.state('move-right'))
      move_dir.x += 1;
    if (move_dir.LengthSquared()) {
      pInput.walking = true;
      move_dir.Normalize();
      move_dir.Multiply(this.gPlayer0.walkSpeed);
      pInput.x += move_dir.x;
      pInput.y += move_dir.y;
      pInput.legRotation = Math.atan2(move_dir.y, move_dir.x) / Math.PI * 180 - 90;
    } else {
      pInput.walking = false;
      pInput.x = 0;
      pInput.y = 0;
    }

    var dPX = gRenderEngine.getScreenPosition(this.gPlayer0.pos).x;
    var dPY = gRenderEngine.getScreenPosition(this.gPlayer0.pos).y;

    // Facing direction, from mouse or keyboard, default to last value
    var faceAngleRadians = this.gPlayer0.faceAngleRadians;
    // Mouse fire command orrients based on mouse position
    if (gInputEngine.state('fire0-mouse') || gInputEngine.state('fire1-mouse')) {
      faceAngleRadians = Math.atan2(
        (gInputEngine.mouse.y - dPY - gRenderEngine.canvas.offsetTop), 
        gInputEngine.mouse.x - dPX);
		
      if (gInputEngine.state('fire0-mouse') )
        pInput.fire0 = true;
      else
        pInput.fire1 = true;
    }
    // Keyboard based facing & firing direction
    var fire_dir = new Vec2(0, 0);
    if (gInputEngine.state('fire-up'))
      fire_dir.y--;
    if (gInputEngine.state('fire-down'))
      fire_dir.y++;
    if (gInputEngine.state('fire-left'))
      fire_dir.x--;
    if (gInputEngine.state('fire-right'))
      fire_dir.x++;
    if (fire_dir.LengthSquared()) {
      // Override mouse direction
      faceAngleRadians = Math.atan2(fire_dir.y, fire_dir.x);
      if (gInputEngine.state('fire1-instead-of-0'))
        pInput.fire1 = true;
      else
        pInput.fire0 = true;
    }
    pInput.faceAngle0to7 = (Math.round(faceAngleRadians / (2 * Math.PI) * 8) + 8) % 8;

    if (gInputEngine.state('fire1')) {
      pInput.fire1 = true;
    }
	if (gInputEngine.state('fire2')) {
      pInput.fire2 = true;
    }


    // Record and send out inputs
    this.gPlayer0.pInput = pInput;
    this.gPlayer0.sendUpdates();
    this.gSocket.sendq();

    //recenter our map bounds based upon the player's centered position
    this.newMapPos.x = this.gPlayer0.pos.x - (this.gMap.viewRect.w * 0.5);
    this.newMapPos.y = this.gPlayer0.pos.y - (this.gMap.viewRect.h * 0.5);
  },
	//-----------------------------
  run: function() {
    this.parent();

    var fractionOfNextPhysicsUpdate = this.timeSincePhysicsUpdate / Constants.PHYSICS_LOOP_HZ;

	this.update(); //CLM why was this removed?

    gGuiEngine.draw();

    this.draw(fractionOfNextPhysicsUpdate);
    gInputEngine.clearPressed();
  },

  //-----------------------------
  draw: function (fractionOfNextPhysicsUpdate) {

    // Alpha-beta filter on camera
    this.gMap.viewRect.x = parseInt(alphaBeta(this.gMap.viewRect.x, this.newMapPos.x, 0.9));
    this.gMap.viewRect.y = parseInt(alphaBeta(this.gMap.viewRect.y, this.newMapPos.y, 0.9));

    // Draw map.
    this.gMap.draw(null);

    // Bucket entities by zIndex
	var fudgeVariance = 128;
    var zIndex_array = [];
    var entities_bucketed_by_zIndex = {}
    this.entities.forEach(function(entity) {
		//don't draw entities that are off screen
		if(	entity.pos.x >= gGameEngine.gMap.viewRect.x-fudgeVariance && entity.pos.x < gGameEngine.gMap.viewRect.x+gGameEngine.gMap.viewRect.w+fudgeVariance &&
			entity.pos.y >= gGameEngine.gMap.viewRect.y-fudgeVariance && entity.pos.y < gGameEngine.gMap.viewRect.y+gGameEngine.gMap.viewRect.h+fudgeVariance)
		{				
			if (zIndex_array.indexOf(entity.zIndex) === -1) 
			{
				zIndex_array.push(entity.zIndex);
				entities_bucketed_by_zIndex[entity.zIndex] = [];
			}
			entities_bucketed_by_zIndex[entity.zIndex].push(entity);
		}
    });
	
    // Draw entities sorted by zIndex
    zIndex_array.sort(function (a,b) {return a - b;});
    zIndex_array.forEach(function(zIndex) {
      entities_bucketed_by_zIndex[zIndex].forEach(function(entity) {
				entity.draw(fractionOfNextPhysicsUpdate);
      });
    });
  },
  //-----------------------------
  requestRespawn: function () {

	Logger.log("requesting respawn for " + this.gPlayer0.name);
	gGameEngine.gSocket.send_respawn({
                from: this.gPlayer0.name,
				wep0: gWeapons_DB.weapons[gGuiEngine.pendingWeaponSwapIdxs[0]].logicClass,
	   			wep1: gWeapons_DB.weapons[gGuiEngine.pendingWeaponSwapIdxs[1]].logicClass,
	   			wep2: gWeapons_DB.weapons[gGuiEngine.pendingWeaponSwapIdxs[2]].logicClass,
              });
              
	},
	//-----------------------------		
	playWorldSound:function(soundURL,x,y)
	{
		if(this.gPlayer0 == null)
			return;
		var gMap = gGameEngine.gMap;
		//fade out volume based upon distance to me
		var viewSize = Math.max(gMap.viewRect.w,gMap.viewRect.h) * 0.5;
		var oCenter = this.gPlayer0.pos;
		var dx = Math.abs(oCenter.x - x);
		var dy = Math.abs(oCenter.y - y);
		var distToObserver = Math.sqrt(dx*dx + dy*dy);
		var normDist = distToObserver / viewSize;
		if(normDist > 1) normDist = 1;
		if(normDist <0) return;//dont' play
		
		var volume = 1.0 - normDist;
		
		//volume = distance to center of current player
		var sound = gSM.loadAsync(soundURL, function(sObj) 
			{
				gSM.playSound(sObj.path,{looping:false, volume:volume});	
//				gSM.playsObj.play(false);
			});
	},
	//-----------------------------		
	preloadComplete:false,
	preloadAssets:function ()
	{
		//go load images first
		var assets = new Array();
		assets.push("img/grits_effects.png");
		//assets.push("img/grits_master.png");
		//maps!
		var map = map1;
		for (var i = 0; i < map.tilesets.length; i++) 
			assets.push("img/" + map.tilesets[i].image.replace(/^.*[\\\/]/, ''));
		
		//sounds
		assets.push("./sound/bg_game.ogg");
		assets.push("./sound/bounce0.ogg");
		assets.push("./sound/energy_pickup.ogg");
		assets.push("./sound/explode0.ogg");
		assets.push("./sound/grenade_shoot0.ogg");
		assets.push("./sound/item_pickup0.ogg");
		assets.push("./sound/machine_shoot0.ogg");
		assets.push("./sound/quad_pickup.ogg");
		assets.push("./sound/rocket_shoot0.ogg");
		assets.push("./sound/shield_activate.ogg");
		assets.push("./sound/shotgun_shoot0.ogg");
		assets.push("./sound/spawn0.ogg");
		assets.push("./sound/sword_activate.ogg");
		
		loadAssets(assets, function()
		{
			xhrGet("img/grits_effects.json", false,
				function(data){
					var obj = JSON.parse(data.response);
						
					var sheet = new SpriteSheetClass();
					gSpriteSheets['grits_effects'] =sheet;
					sheet.load("img/grits_effects.png");
						
					for (var key in obj.frames)
					{
						var val = obj.frames[key];
						var cx=-val.frame.w * 0.5;
						var cy=-val.frame.h * 0.5;
						
						if(val.trimmed)
						{
							cx = val.spriteSourceSize.x - (val.sourceSize.w * 0.5);
							cy = val.spriteSourceSize.y - (val.sourceSize.h * 0.5);
							
						}
						
						sheet.defSprite(key, val.frame.x, val.frame.y, val.frame.w, val.frame.h, cx, cy);
					}
					
					
					//CLM some extra effects taht are defined in a diff file
					var sheetmaster = new SpriteSheetClass();
					gSpriteSheets['grits_master'] =sheetmaster;
					sheetmaster.load("img/grits_master.png");
					sheetmaster.defSprite('teleporter', 704,640, 256,256);
					sheetmaster.defSprite('team_spawn', 576,0, 256,256);
					
					
					//CLm ok, maybe not the BEST way to do this...
					gGameEngine.preloadComplete = true;
				});
		});
		
			
	
		//effects!@
		
	
	},
	//-----------------------------
	colorTintSprite_fcn:function(colorStr,callbackFcn,settings)
	{
		if(callbackFcn == null)	return;
		
		gGameEngine.colorTintCanvasContext.clearRect ( 0 , 0 , 128, 128);
			callbackFcn(gGameEngine.colorTintCanvasContext,settings);
		
		var context =gGameEngine.colorTintCanvasContext2;
		context.clearRect ( 0 , 0 , 128, 128);
		 context.drawImage(gGameEngine.colorTintCanvas, 0, 0);
		var g = context.globalCompositeOperation;
		context.globalCompositeOperation = 'source-in'; 
		context.fillStyle=colorStr;
		context.fillRect(0,0,128,128);         
		context.globalCompositeOperation = 'darker';   
		context.drawImage(gGameEngine.colorTintCanvas, 0, 0);
		context.globalCompositeOperation = g;
	},
	calcSpriteRotAngle:function(origFace,desiredRotationAngle)
	{
		var firstAngle = 0;
		if(origFace == 0)	//top
			firstAngle = 0;
			
	}
});

// Override the parent's singleton
gGameEngine = new ClientGameEngineClass();


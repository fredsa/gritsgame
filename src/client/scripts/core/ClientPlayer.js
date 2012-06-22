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


function AngleBetween(a, b) {
  var dotProd = a.dot(b);
  var lenProd = a.length() * b.length();
  var divOperation = dotProd / lenProd;
  return Math.acos(divOperation); // * (180.0 / Math.PI);
}

ClientPlayerClass = PlayerClass.extend({
  _legSpriteAnimList: [],
  _legSpriteMaskAnimList: [],
  _currLegAnimIndex:0,
  init: function (inputx, inputy, settings) {

	this.zIndex = 8;
	
   var names=["walk_up","walk_left","walk_down","walk_right"];
   for(var q=0; q < names.length; q++)
   {
	   var sheet_down = new SpriteSheetAnimClass();
	   sheet_down._animIncPerFrame = 0.75;
	   sheet_down.loadSheet('grits_effects',"img/grits_effects.png");
		for(var i =0; i < 10; i++)
			sheet_down.pushFrame(names[q] + "_000" + i + ".png");
		for(var i =10; i < 30; i++)
			sheet_down.pushFrame(names[q] + "_00" + i + ".png");
		this._legSpriteAnimList.push(sheet_down);
	}
	
	for(var q=0; q < names.length; q++)
   {
	   var sheet_down = new SpriteSheetAnimClass();
	   sheet_down._animIncPerFrame = 0.75;
	   sheet_down.loadSheet('grits_effects',"img/grits_effects.png");
		for(var i =0; i < 10; i++)
			sheet_down.pushFrame(names[q] + "_mask_000" + i + ".png");
		for(var i =10; i < 30; i++)
			sheet_down.pushFrame(names[q] + "_mask_00" + i + ".png");
		this._legSpriteMaskAnimList.push(sheet_down);
	}
	
	

    // JJG: Ugly hack, we need the spritesheet before calling the parent.
    this.parent(inputx, inputy, settings);
  },
	//-----------------------------------------
  update: function () {
    this.parent();

	if(this.isDead) return;
	
	this._legSpriteAnimList[this._currLegAnimIndex].pause(!this.walking);
	this._legSpriteMaskAnimList[this._currLegAnimIndex].pause(!this.walking);
	//what anim should I be playing?
	 var move_dir = new Vec2(0, 0);
    if (gInputEngine.state('move-up'))
      this._currLegAnimIndex = 0;
    else if (gInputEngine.state('move-down'))
      this._currLegAnimIndex = 2;
    if (gInputEngine.state('move-left'))
      this._currLegAnimIndex = 1;
    else if (gInputEngine.state('move-right'))
      this._currLegAnimIndex = 3;
   
  },
//-----------------------------------------
  on_stats: function (msg) {
  	this.parent(msg);

	//note, we detect this before the parent fucntion gets a chance to modify us.
	if(this.health<=0 && !this.isDead)
	{
		//spawn player death explosion!
		var interpolatedPosition = {x:this.pos.x, y:this.pos.y};

   
		var dPX = gRenderEngine.getScreenPosition(interpolatedPosition).x;
		var dPY = gRenderEngine.getScreenPosition(interpolatedPosition).y;
	
		var efct = gGameEngine.spawnEntity("InstancedEffect", this.pos.x, this.pos.y, null);
		efct.onInit({x:this.pos.x,y:this.pos.y},
				{	playOnce:true, 
					similarName:"landmine_explosion_large_", 
					uriToSound:"./sound/explode0.ogg"
				});
				
		if(this == gGameEngine.gPlayer0)
			show_respawn();
	}
		
  },
  //-----------------------------------------
  draw: function (fractionOfNextPhysicsUpdate) {
  
	if(this.isDead) return;
	
    var ctx = gRenderEngine.context;

    var interpolatedPosition = {x:this.pos.x, y:this.pos.y};

    if(this.pInput) {
      // JJG: input is in  units/sec so we convert to units/update and multiply by the fraction of an update
      interpolatedPosition.x += (this.pInput.x * Constants.PHYSICS_LOOP_HZ) * fractionOfNextPhysicsUpdate;
      interpolatedPosition.y += (this.pInput.y * Constants.PHYSICS_LOOP_HZ) * fractionOfNextPhysicsUpdate;
    }

    var dPX = gRenderEngine.getScreenPosition(interpolatedPosition).x;
    var dPY = gRenderEngine.getScreenPosition(interpolatedPosition).y;

	//CLM only draw bars for the local player
	if(this.name == gGameEngine.gPlayer0.name)
	{
		//Draw health bar
		if (this.health * 3 / 2 >= this.maxHealth) {
		  ctx.fillStyle = "green";
		} else if (this.health * 3 >= this.maxHealth) {
		  ctx.fillStyle = "orange";
		} else {
		  ctx.fillStyle = "red";
		}
		ctx.fillRect(dPX - 30, dPY - 40, (60 * this.health / this.maxHealth), 10);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		ctx.strokeRect(dPX - 30, dPY - 40, 60, 10);

		//Draw energy bar
		if (this.energy * 3 / 2 >= this.maxEnergy) {
		  ctx.fillStyle = "aqua";
		} else if (this.energy * 3 >= this.maxEnergy) {
		  ctx.fillStyle = "blue";
		} else {
		  ctx.fillStyle = "darkblue";
		}
		ctx.fillRect(dPX - 30, dPY - 30, (60 * this.energy / this.maxEnergy), 10);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		ctx.strokeRect(dPX - 30, dPY - 30, 60, 10);
		if(window.location.origin.indexOf("localhost") != -1) {
			//gRenderEngine.drawString('DEBUG:' + this.displayName, 'roboto', dPX - 31, dPY - 41, 18, {color:"gray"});
		}
	}
	else
	{
		gRenderEngine.drawString(this.displayName, 'roboto', dPX - 31, dPY - 41, 18, {color:"black"});
		gRenderEngine.drawString(this.displayName, 'roboto', dPX - 30, dPY - 40, 18, {color:"green"});
	}

    //draw debug helpers
    if (this.targetPhys) {
      var tp = gRenderEngine.getScreenPosition(this.targetPhys);
      var op = gRenderEngine.getScreenPosition(this.tpOrig);
      var ox = op.x;
      var oy = op.y;
      var ovx = this.tpOrig.vx;
      var ovy = this.tpOrig.vy;
      var dt = (new Date().getTime() - this.tpOrig.t)/1000;
      var px = ox + ovx*dt;
      var py = oy + ovy*dt;
      function disc(x, y, radius, clr) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = clr;
        ctx.fill();
      }
      //////////////////disc(px, py, Math.sqrt(ovx*ovx + ovy*ovy)*(0.05+dt), 'rgba(0,255,0,1)');
      /*
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, this.allowableError, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,255,255,0.7)";
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, this.noCorrectError, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,0,0,0.7)";
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(op.x, op.y, 20, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,255,0,0.3)";
      ctx.fill();
      */
    }

	var colors=['#33FF33','#FF9933'];
	gGameEngine.colorTintSprite_fcn(colors[this.team],this._drawLegMask,{player:this});
	
	this._drawPlayerAvatar(ctx, {player:this, locX:dPX, locY:dPY});
	
  },
  //-----------------------------------------
	_drawLegMask: function(ctx,settings)
    {
		var spt = settings.player._legSpriteMaskAnimList[settings.player._currLegAnimIndex].getCurrentFrameStats();
		{
		  var dPX = (spt.w / 2.0),dPY = (spt.h / 2.0);
		  //var sptidx = 0;
		  if (settings.player.walking == true) sptidx = settings.player.legWalkFrameIdx;
		  

		  var rotRadians = 0;//settings.player.legRotation * (Math.PI / 180.0);
		  ctx.translate(dPX, dPY);
		  ctx.rotate(rotRadians);

		  settings.player._legSpriteMaskAnimList[settings.player._currLegAnimIndex].draw(0,0,{ctx: ctx,noMapTrans:true});
		 
		  ctx.rotate(-rotRadians);
		  ctx.translate(-dPX, -dPY);
		}
	},
  //-----------------------------------------
	_drawPlayerAvatar: function(ctx,settings)
    {
		var spt = settings.player._legSpriteAnimList[settings.player._currLegAnimIndex].getCurrentFrameStats();
		{
		  var dPX = settings.locX ,dPY = settings.locY ;
		  //var sptidx = 0;
		  if (settings.player.walking == true) sptidx = settings.player.legWalkFrameIdx;
		  

		  var rotRadians = 0;//settings.player.legRotation * (Math.PI / 180.0);
		  ctx.translate(dPX, dPY);
		  ctx.rotate(rotRadians);
		//  ctx.translate(-(spt.w / 2.0), -(spt.h / 2.0));

		  settings.player._legSpriteAnimList[settings.player._currLegAnimIndex].draw(0,0,{ctx: ctx,noMapTrans:true});
		 
		 //draw our color mask
			var sptleg = this._legSpriteMaskAnimList[this._currLegAnimIndex].getCurrentFrameStats();
			ctx.drawImage( gGameEngine.colorTintCanvas2, -(sptleg.w / 2.0),-(sptleg.h / 2.0));
			
		  ctx.rotate(-rotRadians);
		  ctx.translate(-dPX, -dPY);
		}
		
		//DRAW THE TOP
		//determine the proper rotation for the top
		{

		  var rotRadians = -1.0 * Math.PI + settings.player.faceAngleRadians; // Initial sprite position faces up, rotate 1/4 turn clockwise first.
		  ctx.translate(dPX, dPY);
		  ctx.rotate(rotRadians);


		drawSprite("turret.png", 0, 0, {ctx:ctx,noMapTrans:true});
		
		  //draw any weapons we have.
		  for (var i = 0; i < settings.player.weapons.length; i++)
			if (settings.player.weapons[i] != null) settings.player.weapons[i].onDraw(this);

		  ctx.rotate(-rotRadians);
		  ctx.translate(-dPX, -dPY);

		}
		
	},

});

Factory.nameClassMap["Player"] = ClientPlayerClass;

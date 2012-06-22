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

InstancedEffectClass = EntityClass.extend({
 lifetime: 10,
  zIndex: 2,
  _spriteAnim: null,
  _playOnce:false,
  //-----------------------------------------
  onInit: function (pos, settings) {
    this.pos.x = pos.x;
    this.pos.y = pos.y;
	this._spriteAnim = new SpriteSheetAnimClass();
	this._spriteAnim.loadSheet('grits_effects',"img/grits_effects.png");
	this.zIndex = 30;
	if(settings)
	{
		//keep looping until time runs out
		if(settings.lifeInSeconds)
			this.lifetime = lifeInSeconds;
			
		if(settings.similarName)
		{
			var spriteNames = getSpriteNamesSimilarTo(settings.similarName);
			for(var i =0; i < spriteNames.length; i++)
				this._spriteAnim.pushFrame(spriteNames[i]);
		}
		else if(settings.spriteFramesArray)
		{
			for(var i =0; i < settings.spriteFramesArray.length; i++)
				this._spriteAnim.pushFrame(settings.spriteFramesArray[i]);
		}
		
		//stop playing onec we've coverd all the frames
		if(settings.playOnce)
		{
			this._playOnce = true;
			this.lifetime = this._spriteAnim.getNumFrames() * 0.05;
		}
		
		if(settings.uriToSound != null && settings.uriToSound !="")
			gGameEngine.playWorldSound(settings.uriToSound,pos.x,pos.y);
	}
    

	
	
		
	
  },
  //-----------------------------------------
	update: function () {

		if(this._playOnce)
		{
			if(this._spriteAnim._currAnimIdx >= this._spriteAnim._spriteNames.length)
			{
				gGameEngine.removeEntity(this);
				return;
			}
		}
		else
		{
			this.lifetime-=0.05;
			if (this.lifetime <= 0) 
			{
				gGameEngine.removeEntity(this);
				return;
			}
		}

    this.parent();
  },
  //-----------------------------------------
  draw: function (fractionOfNextUpdate) {
  
	this._spriteAnim.draw(this.pos.x,this.pos.y);
  }
});

Factory.nameClassMap['InstancedEffect'] = InstancedEffectClass;

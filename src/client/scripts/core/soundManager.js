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

//----------------------------
SoundManager = Class.extend({
	clips: {},
	enabled:true,
	_context:null,
	_mainNode:null,
	//----------------------------
	init: function() 
	{
		//http://www.html5rocks.com/en/tutorials/webaudio/intro/
		//WEBAUDIO API
		 try {
			this._context = new webkitAudioContext();
		  }
		  catch(e) {
			alert('Web Audio API is not supported in this browser');
		  }
		  
		  this._mainNode = this._context.createGainNode(0);
		  this._mainNode.connect(this._context.destination);
	},
	//----------------------------
	loadAsync: function(path, callbackFcn)
	{
		if(this.clips[path])
		{
			callbackFcn(this.clips[path].s);
			return this.clips[path].s;
		}
		
		var clip = {s:new Sound(),b:null,l:false};
		this.clips[path] = clip;
		clip.s.path = path;
	
		var request = new XMLHttpRequest();
		request.open('GET', path, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			gSM._context.decodeAudioData(request.response, 
			function(buffer)
			{
				clip.b = buffer;
				clip.l = true;
				callbackFcn(clip.s); 
			},
			function(data)
			{
				Logger.log("failed");
			});
			
		}
		request.send();
		
		
		return clip.s;
		
	},
	
	//----------------------------
	isLoaded:function(path)
	{
		var sd = this.clips[obj.path];
		if(sd == null)
			return false;
		return sd.l;
	},
	//----------------------------
	togglemute: function()
	{
		if(this._mainNode.gain.value>0)
			this._mainNode.gain.value = 0;
		else 
			this._mainNode.gain.value =1;
	},
	//----------------------------
	stopAll: function()
	{
		this._mainNode.disconnect();
		this._mainNode = this._context.createGainNode(0);
		this._mainNode.connect(this._context.destination);
	},
	//----------------------------
	playSound: function(path,settings)
	{
		if( !gSM.enabled ) 
			return false;
		
		var looping = false;
		var volume = 0.2;
		if(settings)
		{
			if(settings.looping)
				looping = settings.looping;
			if(settings.volume)
				volume = settings.volume;
		}
		
		var sd = this.clips[path];
		if(sd == null)
			return false;
		if(sd.l == false) return false;
			
		var currentClip = gSM._context.createBufferSource(); // creates a sound source
		currentClip.buffer = sd.b;                    // tell the source which sound to play
		currentClip.gain.value = volume;
		currentClip.connect(gSM._mainNode);
		currentClip.loop = looping;
		currentClip.noteOn(0);                          // play the source now
		return true;
	}
});


//----------------------------
Sound = Class.extend({
	//----------------------------
	init: function(  ) {
	},
	//----------------------------
	play: function(loop) {
		
	    gSM.playSound(this.path,{looping:loop, volume:1});
	},


});
//----------------------------
function playSoundInstance(soundpath)
{
	var sound = gSM.loadAsync(soundpath, function(sObj) {sObj.play(false);});
}

var gSM = new SoundManager();

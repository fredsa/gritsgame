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

	ImageCache = {};
	
	loadAtlasImage = function(imagename)
	{
		if(ImageCache[imagename] != null)
			return ImageCache[imagename];
		var img = new Image();
		img.src = imagename;
		ImageCache[imagename] = img;
		return img;
	};
	
SpriteSheetClass = Class.extend({
  img: null,
  url:"",
  sprites: new Array(),
  //-----------------------------------------
  init: function () {},
	//-----------------------------------------
  load: function (imgName) {
    this.img = loadAtlasImage(imgName); //new Image(imgName);
	this.url = imgName;
  },
  //-----------------------------------------
  defSprite: function (name, x, y, w, h, cx, cy) {
    var spt = {
      "id": name,
      "x": x,
      "y": y,
      "w": w,
      "h": h,
      "cx": cx==null? 0 : cx,
      "cy": cy==null? 0 : cy
    };
    this.sprites.push(spt);
  },
  //-----------------------------------------
  getStats: function (name) {
    for (var i = 0; i < this.sprites.length; i++) {
      if (this.sprites[i].id == name) return this.sprites[i];
    }
    return null;
  }
  

});
//-----------------------------------------
SpriteSheetAnimClass = Class.extend({
	_spriteSheet:null,
	_spriteNames:new Array(),
	_currAnimIdx: 0,  
	_fps:15,
	_animIncPerFrame:0.5,
	_paused:false,
	//-----------------------------------------
	loadSheet: function(sheetName, spriteSheetURI)
	{
		this._spriteSheet = gSpriteSheets[sheetName];
		if(this._spriteSheet != null)
			return;
			
		var sheet = new SpriteSheetClass();	
		sheet.load(spriteSheetURI);
		
		this._spriteSheet = sheet
		gSpriteSheets['grits_effects'] =sheet;
		
		this._spriteNames.length = 0;
		this._currAnimIdx = 0;
	},
	//-----------------------------------------
	pushFrame: function(spriteName)
	{
		this._spriteNames.push(spriteName);
	},
	//-----------------------------------------
	pause: function(onOff)
	{
		this._paused = onOff;
	},
	//-----------------------------------------
	getNumFrames: function()
	{
		return this._spriteNames.length;
	},
	//-----------------------------------------
	draw: function(posX, posY, settings)
	{
		if(this._spriteSheet == null) return;
		
		if(!this._paused)
			this._currAnimIdx +=  this._animIncPerFrame;
			
		var cIDX = Math.floor(this._currAnimIdx) % this._spriteNames.length;
			
		var spt = this._spriteSheet.getStats(this._spriteNames[cIDX]);
		if(spt == null)
			return;
			
		__drawSpriteInternal(spt,this._spriteSheet,posX,posY,settings);
	},
	//-----------------------------------------
	getCurrentFrameStats:function()
	{
		var cIDX = Math.floor(this._currAnimIdx) % this._spriteNames.length;
		return this._spriteSheet.getStats(this._spriteNames[cIDX]);
	}
});
//-----------------------------------------
function getSpriteNamesSimilarTo(nameValue)
{
	var d = new Array();
	for( sheetName in gSpriteSheets)
	{
		var sheet = gSpriteSheets[sheetName];
		for(var i =0; i < sheet.sprites.length; i++)
		{
			if(sheet.sprites[i].id.indexOf(nameValue) ==-1)
				continue;
				
			d.push(sheet.sprites[i].id);
		}
	}
	return d;
}

//-----------------------------------------
function drawSprite(spritename, posX, posY, settings)
{		
	for( sheetName in gSpriteSheets)
	{
		var sheet = gSpriteSheets[sheetName];
		var spt = sheet.getStats(spritename);
		if(spt == null)
			continue;
		
		__drawSpriteInternal(spt,sheet,posX,posY,settings);
		
		
		return;
										
	}

};

//-------
function __drawSpriteInternal(spt,sheet,posX,posY,settings)
{
	if(spt == null || sheet == null)
		return;
			
		var gMap = gGameEngine.gMap;
		var hlf = {x: spt.cx , y: spt.cy};
		//var hlf = {x: spt.w * 0.5, y: spt.h * 0.5};
		
		

		var mapTrans = {x: gMap.viewRect.x, y: gMap.viewRect.y};
		var ctx = gRenderEngine.context;
		if(settings)
		{
			if(settings.noMapTrans)
			{
				mapTrans.x = 0;
				mapTrans.y = 0;
			}
			if(settings.ctx)
			{
				ctx = settings.ctx;
			}
			
		}
		
		
		if(settings && settings.rotRadians != null)
		{
			ctx.save();
          		var rotRadians = Math.PI + settings.rotRadians;

          		ctx.translate(posX - mapTrans.x, posY - mapTrans.y);
                ctx.rotate(rotRadians); //rotate in origin


                ctx.drawImage(sheet.img, 
										spt.x, spt.y, 
										spt.w, spt.h, 
										+hlf.x,
										+hlf.y, 
										spt.w, 
										spt.h);
             ctx.restore();
                
	
		}
		else
		{
			ctx.drawImage(sheet.img, 
										spt.x, spt.y, 
										spt.w, spt.h, 
										(posX - mapTrans.x) + (hlf.x), 
										(posY - mapTrans.y) + (hlf.y), 
										spt.w, 
										spt.h);
		}
	
};	
var gSpriteSheets = {};

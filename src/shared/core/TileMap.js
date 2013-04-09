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

var TileMapLoaderClass = Class.extend({
  currMapData: null,
  tileSets: new Array(),
  viewRect: {
    "x": 0,
    "y": 0,
    "w": 512,
    "h": 512
  },
  numXTiles: 100,
  numYTiles: 100,
  tileSize: {
    "x": 64,
    "y": 64
  },
  pixelSize: {
    "x": 64,
    "y": 64
  },
  preCacheCanvasArray:null,
  imgLoadCount:0,
  initialize: function () {},
  load: function (map) {
    this.currMapData = map;
    this.numXTiles = map.width;
    this.numYTiles = map.height;
    this.tileSize.x = map.tilewidth;
    this.tileSize.y = map.tileheight;
    this.pixelSize.x = this.numXTiles * this.tileSize.x;
    this.pixelSize.y = this.numYTiles * this.tileSize.y;
    //load our tilesets if we are a client.
    if (!IS_SERVER) {
		var mapInst = this;
      for (var i = 0; i < map.tilesets.length; i++) {
        var img = new Image();
		img.onload = new function() 		{mapInst.imgLoadCount++;};
        img.src = "img/" + map.tilesets[i].image.replace(/^.*[\\\/]/, '');
        var ts = {
          "firstgid": map.tilesets[i].firstgid,
          "image": img,
          "imageheight": map.tilesets[i].imageheight,
          "imagewidth": map.tilesets[i].imagewidth,
          "name": map.tilesets[i].name,
          "numXTiles": Math.floor(map.tilesets[i].imagewidth / this.tileSize.x),
          "numYTiles": Math.floor(map.tilesets[i].imageheight / this.tileSize.y)
        };
        this.tileSets.push(ts);
      }
    
		//Once all the images are loaded, kick off the pre-caching system
		checkWait(
					function()
					{
						return mapInst.imgLoadCount == mapInst.tileSets.length;
					},
					function () 
					{
						mapInst.preDrawCache();
					}
		);
	}

    //load our object and collision layers
    for (var layerIdx = 0; layerIdx < this.currMapData.layers.length; layerIdx++) {
      if (this.currMapData.layers[layerIdx].type != "objectgroup") continue;
      var lyr = this.currMapData.layers[layerIdx];
      var name = lyr.name;
      if (name == "collision") {
        //for each object, make a collision object
        for (var objIdx = 0; objIdx < lyr.objects.length; objIdx++) {
          var lobj = lyr.objects[objIdx];
         
		  
		  var collidesWithArray = new Array();
		  var collisionTypeArray = new Array();
		  
		  //read any specific collision properties we have
		  if(lobj.properties.length != 0)
		  {
			if(lobj.properties['collisionFlags'])
			{
				var flagsArray = lobj.properties['collisionFlags'].split(",");
				for(var propIdx = 0; propIdx < flagsArray.length; propIdx++)
				{
					if(flagsArray[propIdx] == 'projectileignore')
					{
						collisionTypeArray.push('projectileignore');
						collidesWithArray.push('player');
					}
				}
				
				
				
			}		  
		  }
		  
		  
		if(collisionTypeArray.length ==0)
			collisionTypeArray.push('mapobject');
		  
		  
		if(collidesWithArray.length ==0)
			collidesWithArray.push('all');
			
		  if (lobj.polygon == null) //we/re an object
		  {
		  
			  var entityDef = {
				id: lobj.name,
				x: lobj.x + (lobj.width * 0.5),
				y: lobj.y + (lobj.height * 0.5),
				halfHeight: lobj.height * 0.5,
				halfWidth: lobj.width * 0.5,
				dampen: 0,
				angle: 0,
				type: 'static',
				categories: collisionTypeArray,
				collidesWith: collidesWithArray,
				userData: {
				  "id": lobj.name
				},
			  };
			  gPhysicsEngine.addBody(entityDef);


          }
		  else	//POLY LINE
		  {
			 var entityDef = {
				id: lobj.name,
				x: lobj.x + (lobj.width * 0.5),
				y: lobj.y + (lobj.height * 0.5),
				dampen: 0,
				angle: 0,
				polyPoints: lobj.polygon,
				type: 'static',
				categories: collisionTypeArray,
				collidesWith: collidesWithArray,
				userData: {
				  "id": lobj.name
				},
			  };
			  gPhysicsEngine.addBody(entityDef);
		  }


        }
      } else if (name == "environment") { // Environment layer (teleporters, etc.)
        for (var objIdx = 0; objIdx < lyr.objects.length; objIdx++) {
          var lobj = lyr.objects[objIdx];

          if (lobj.type.toLowerCase() == 'teleporter') {
            // This is a teleporter
            var posArray = lobj.properties.destination.split(",");
            var destPos = {
              'x': (parseInt(posArray[0].replace(" ", ""))) * this.tileSize.x,
              'y': (parseInt(posArray[1].replace(" ", ""))) * this.tileSize.y
            };

            var ent = gGameEngine.spawnEntity("Teleporter", lobj.x, lobj.y, {
              name: lobj.name + "_" + objIdx
            });
            var physicsDef = {
              id: lobj.name,
              x: lobj.x + (lobj.width * 0.5),
              y: lobj.y + (lobj.height * 0.5),
              halfHeight: lobj.height * 0.5,
              halfWidth: lobj.width * 0.5,
              dampen: 0,
              angle: 0,
              type: 'static',
              categories: ['mapobject'],
              userData: {
                "id": lobj.name,
                "ent": ent
              },
            };
            ent.onInit(physicsDef, destPos);
          } else if (lobj.type.toLowerCase() == 'spawnpoint') {
            // This is a teleporter
            var settings = {
              name: lobj.name,
              hsize: {
                x: lobj.width / 2,
                y: lobj.height / 2
              },
              team: parseInt(lobj.properties.team)
            };
            var ent = gGameEngine.spawnEntity("SpawnPoint", lobj.x + lobj.width / 2, lobj.y + lobj.height / 2, settings);
            ent.onInit();
          } else if (lobj.type.toLowerCase() == 'spawner') {
            var settings = {
              name: lobj.name + "_" + objIdx,
              hsize: {
                x: lobj.width / 2,
                y: lobj.height / 2
              },
            };
            var ent = gGameEngine.spawnEntity("Spawner", lobj.x + lobj.width / 2, lobj.y + lobj.height / 2, settings);
            ent.onInit(lobj.properties.SpawnItem);
          } else {
            Logger.log("Tried to load an unknown object: " + lobj.type);
          }
        }
      }


    }
	
	
  },
  getTilePacket: function (tileIndex) {
    var pkt = {
      "img": null,
      "px": 0,
      "py": 0
    };
    var i = 0;
    for (i = this.tileSets.length - 1; i >= 0; i--) {
      if (this.tileSets[i].firstgid <= tileIndex) break;
    }

    pkt.img = this.tileSets[i].image;
    var localIdx = tileIndex - this.tileSets[i].firstgid;
    var lTileX = Math.floor(localIdx % this.tileSets[i].numXTiles);
    var lTileY = Math.floor(localIdx / this.tileSets[i].numXTiles);
    pkt.px = (lTileX * this.tileSize.x);
    pkt.py = (lTileY * this.tileSize.y);

    return pkt;
  },
	intersectRect:function (r1, r2) {
	return !(r2.left > r1.right || 
           r2.right < r1.left || 
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
	},
  //CLM this needs to be client only!!!
  draw: function () { //
	
	if(this.preCacheCanvasArray !=null)
	{
		var r2 = this.viewRect;
		//aabb test to see if our view-rect intersects with this canvas.
		for(var q =0; q < this.preCacheCanvasArray.length; q++)
		{
			var r1 = this.preCacheCanvasArray[q];
			var visible= this.intersectRect(	{top:r1.y,left:r1.x,bottom:r1.y+r1.h,right:r1.x+r1.w},
												                {top:r2.y,left:r2.x,bottom:r2.y+r2.h,right:r2.x+r2.w});
			
			if(visible)
				gRenderEngine.context.drawImage(r1.preCacheCanvas, r1.x-this.viewRect.x,r1.y-this.viewRect.y);
		}
		return;
	}
	
	
    for (var layerIdx = 0; layerIdx < this.currMapData.layers.length; layerIdx++) {
      if (this.currMapData.layers[layerIdx].type != "tilelayer") continue;

      var dat = this.currMapData.layers[layerIdx].data;
      //find what the tileIndexOffset is for this layer
      for (var tileIDX = 0; tileIDX < dat.length; tileIDX++) {
        var tID = dat[tileIDX];
        if (tID == 0) continue;

        var tPKT = this.getTilePacket(tID);

        //test if this tile is within our world bounds
        var worldX = Math.floor(tileIDX % this.numXTiles) * this.tileSize.x;
        var worldY = Math.floor(tileIDX / this.numXTiles) * this.tileSize.y;
        if ((worldX + this.tileSize.x) < this.viewRect.x || (worldY + this.tileSize.y) < this.viewRect.y || worldX > this.viewRect.x + this.viewRect.w || worldY > this.viewRect.y + this.viewRect.h) continue;

        //adjust all the visible tiles to draw at canvas origin.
        worldX -= this.viewRect.x;
        worldY -= this.viewRect.y;

        // Nine arguments: the element, source (x,y) coordinates, source width and 
        // height (for cropping), destination (x,y) coordinates, and destination width 
        // and height (resize).
        gRenderEngine.context.drawImage(tPKT.img, tPKT.px, tPKT.py, this.tileSize.x, this.tileSize.y, worldX, worldY, this.tileSize.x, this.tileSize.y);

      }
    }

    //CLM used to help debugging
    var drawCollisionShapes = false;
    if (drawCollisionShapes) {
      //load our object and collision layers
      for (var layerIdx = 0; layerIdx < this.currMapData.layers.length; layerIdx++) {
        if (this.currMapData.layers[layerIdx].type != "objectgroup") continue;
        var lyr = this.currMapData.layers[layerIdx];
        var name = lyr.name;
        if (name == "collision") {
          //for each object, make a collision object
          for (var objIdx = 0; objIdx < lyr.objects.length; objIdx++) {
            var lobj = lyr.objects[objIdx];
            if (lobj.type != "") continue; //don't handle poly-lines just yet...
            //test if this tile is within our world bounds
            var worldX = lobj.x;
            var worldY = lobj.y;

            //adjust all the visible tiles to draw at canvas origin.
            worldX -= this.viewRect.x;
            worldY -= this.viewRect.y;


			gRenderEngine.context.fillStyle = "white";
			gRenderEngine.context.fillRect( worldX, worldY,lobj.width, lobj.height);
		
          }
        }
        //else WTF else are we doing right now?

      }
    }

  },
  
  preDrawCache:function()
  {
	var divSize = 1024;
	this.preCacheCanvasArray = new Array();
	var xCanvasCount = 1 + Math.floor(this.pixelSize.x / divSize);
	var yCanvasCount = 1 + Math.floor(this.pixelSize.y / divSize);
	var numSubCanv = xCanvasCount*yCanvasCount;
	
	for(var yC = 0; yC <yCanvasCount; yC ++)
	{
		for(var xC = 0; xC <xCanvasCount; xC ++)
		{
			var k = {
					x:xC * divSize,
					y:yC * divSize,
					w:Math.min(divSize, this.pixelSize.x),
					h:Math.min(divSize, this.pixelSize.y),
					preCacheCanvas:null};
					
			var can2 = document.createElement('canvas');
			can2.width = k.w;
			can2.height = k.h;

			k.preCacheCanvas = can2;
			this.preCacheCanvasArray.push(k);
		}
	}
	
	for(var cc = 0; cc < this.preCacheCanvasArray.length; cc++)
	{
		var can2 = this.preCacheCanvasArray[cc].preCacheCanvas;
		
		var ctx = can2.getContext('2d');
		
		ctx.fillRect(0,0,this.preCacheCanvasArray[cc].w, this.preCacheCanvasArray[cc].h);
		var vRect={	top:this.preCacheCanvasArray[cc].y,
					left:this.preCacheCanvasArray[cc].x,
					bottom:this.preCacheCanvasArray[cc].y+this.preCacheCanvasArray[cc].h,
					right:this.preCacheCanvasArray[cc].x+this.preCacheCanvasArray[cc].w};
		
		for (var layerIdx = 0; layerIdx < this.currMapData.layers.length; layerIdx++) 
		{
		  if (this.currMapData.layers[layerIdx].type != "tilelayer") continue;

		  var dat = this.currMapData.layers[layerIdx].data;
		  //find what the tileIndexOffset is for this layer
		  for (var tileIDX = 0; tileIDX < dat.length; tileIDX++) {
			var tID = dat[tileIDX];
			if (tID == 0) continue;

			var tPKT = this.getTilePacket(tID);

			//test if this tile is within our world bounds
			var worldX = Math.floor(tileIDX % this.numXTiles) * this.tileSize.x;
			var worldY = Math.floor(tileIDX / this.numXTiles) * this.tileSize.y;

			var visible= this.intersectRect(	vRect,
										{top:worldY,left:worldX,bottom:worldY + this.tileSize.y,right:worldX + this.tileSize.x});
			if(!visible)	
				continue;
				
			// Nine arguments: the element, source (x,y) coordinates, source width and 
			// height (for cropping), destination (x,y) coordinates, and destination width 
			// and height (resize).
	//		ctx.fillRect(worldX,worldY,this.tileSize.x, this.tileSize.y);
			
			ctx.drawImage(tPKT.img,
							tPKT.px, tPKT.py, 
							this.tileSize.x, this.tileSize.y, 
							worldX - vRect.left, 
							worldY - vRect.top, 
							this.tileSize.x, this.tileSize.y);
			
			

		  }
		}
		this.preCacheCanvas = can2;
	}
	
  }
  
});


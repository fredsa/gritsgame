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

ClientLandmineClass = LandmineClass.extend({
  onInit: function (owningPlayer) {
    this.parent(owningPlayer);
    //CLM TODO draw a landmine distributor on our player
    //TODO only allow 5-10 landmines active at once.
  },

  onDraw: function (owningPlayer) {
  //draw left gun
    //BEWARE MAGIC NUMBERS HERE!!
    var attachPts = {
      "x0": 2,
      "y0": 0,
      
    };
	var ctx =gGameEngine.colorTintCanvasContext;//gRenderEngine.context
	
	
	drawSprite("landmine.png", attachPts.x0, attachPts.y0, {noMapTrans:true});

  },
});

Factory.nameClassMap['Landmine'] = ClientLandmineClass;

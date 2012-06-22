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

ClientBounceBallGunClass = BounceBallGunClass.extend({
  onInit: function (owningPlayer) {

    this.parent(owningPlayer);
  },

  onDraw: function (owningPlayer) {
    //draw left gun
    //BEWARE MAGIC NUMBERS HERE!!
    var attachPts = {
      "x0": 0,
      "y0": 0,
    };
	gRenderEngine.context.scale(1, -1);
	drawSprite("grenade_launcher.png", attachPts.x0, attachPts.y0, {noMapTrans:true});
	gRenderEngine.context.scale(1, -1);
 /*   spt = owningPlayer.spriteSheet.getStats("gun7");
    ctx.drawImage(owningPlayer.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, attachPts.x0, attachPts.y0, spt.w, spt.h);
    ctx.scale(-1, 1);
    ctx.drawImage(owningPlayer.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, attachPts.x1, attachPts.y1, spt.w, spt.h);
    ctx.scale(-1, 1);


    if (this.firing) {

      var muzzlePts = {
        "x0": 38,
        "y0": -4,
        "x1": -12,
        "y1": -4
      }; //MAGIC, HOW DOES IT WORK!?
      spt = owningPlayer.spriteSheet.getStats("muzzle0");
      if (this.drawSide) {
        ctx.drawImage(owningPlayer.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, muzzlePts.x0, muzzlePts.y0, spt.w, spt.h);

      } else {
        ctx.scale(-1, 1);
        ctx.drawImage(owningPlayer.spriteSheet.img, spt.x, spt.y, spt.w, spt.h, muzzlePts.x1, muzzlePts.y1, spt.w, spt.h);
        ctx.scale(-1, 1);
      }



      if (this.drawPulse > 4) {
        this.drawPulse = 0;
        this.drawSide = !this.drawSide;
      } else this.drawPulse++;


    }
*/


    this.firing = false;
  },
});

Factory.nameClassMap['BounceBallGun'] = ClientBounceBallGunClass;

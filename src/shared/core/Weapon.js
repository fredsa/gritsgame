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

WeaponClass = Class.extend({
  itemID: "0",
  // ABCD format ,hex
  firing: false,
  energyCost: 1,
  nextFireTime:0,
  fireDelayInSeconds:0.01,
  onInit: function (owningPlayer) {},
  onUpdate: function (owningPlayer) {},
  onFire: function (owningPlayer) {
	if (this.nextFireTime>gGameEngine.getTime()) {
		this.firing = false;
        return;
      }
	  
    owningPlayer.energy -= this.energyCost;
	this.firing = true;
	this.nextFireTime = gGameEngine.getTime() + this.fireDelayInSeconds;
  },
  onDraw: function (owningPlayer) {},
});


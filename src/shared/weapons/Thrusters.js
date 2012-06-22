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

ThrustersClass = WeaponClass.extend({
  itemID: "4133",
  storedSpeed:-1,
  // ABCD format ,hex
  onInit: function (owningPlayer) {},

  onUpdate: function (owningPlayer) 
  {
	if(owningPlayer.pInput && owningPlayer.pInput.fire2_off)
	{
		if(this.storedSpeed != -1)
		{
			owningPlayer.walkSpeed = this.storedSpeed;
			this.storedSpeed = -1;
		}
	}
  },
   
  onFire: function (owningPlayer) {
	this.parent(owningPlayer);
    if (this.storedSpeed !=-1)
	{
		return;
	}
	
	
    this.storedSpeed = owningPlayer.walkSpeed;
	owningPlayer.walkSpeed += owningPlayer.walkSpeed* 0.5; //30%

  },
});

//exports.Class = ThrustersClass
Factory.nameClassMap['Thrusters'] = ThrustersClass;

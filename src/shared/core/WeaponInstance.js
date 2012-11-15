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

WeaponInstanceClass = EntityClass.extend({
  damageMultiplier:1.0,
  owningPlayer:null,
  init: function (x, y, settings) {
	this.parent(x, y, settings);
  
        this.owningPlayer = gGameEngine.namedEntities[settings.owner];
    if (this.owningPlayer && this.owningPlayer.powerUpTime>0) {
      this.damageMultiplier *= 4.0;
    }
  },
});

//exports.Class = WeaponInstanceClass;
Factory.nameClassMap['WeaponInstance'] = WeaponInstanceClass;

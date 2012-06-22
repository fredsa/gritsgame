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

TeleporterClass = EntityClass.extend({
  onInit: function (physicsDef, destination) {
    Logger.log('CREATING TELEPORTER');
    this.physicsDef = physicsDef;
    this.destination = destination;
    this.physBody = gPhysicsEngine.addBody(physicsDef);
  },
  kill: function () {},
  update: function () {},

  onTouch: function (otherBody, point, impulse) {
    var otherEnt = otherBody.GetUserData().ent;
    if (otherEnt.lastCloseTeleportPos == null) {
      otherEnt.centerAt(this.destination);
      otherEnt.lastCloseTeleportPos = {x:this.destination.x,y:this.destination.y};
    }
    return true;
  },
});

Factory.nameClassMap['Teleporter'] = TeleporterClass;

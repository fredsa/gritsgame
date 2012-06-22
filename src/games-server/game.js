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

var fs = require('fs');
var vm = require('vm');

var ALL_SOURCE = [];

function include(name) {
  ALL_SOURCE.push({
    name: name,
    src: fs.readFileSync(__dirname + '/' + name),
  });
}

include("../shared/core/core.js");
include("../shared/core/Logger.js");
include("../shared/core/box2D.js");
include("../shared/core/Constants.js");
include("../shared/core/Timer.js");
include("../shared/core/Entity.js");
include("../shared/core/Util.js");
include("../shared/core/Factory.js");
include("../shared/core/GameEngine.js");
include("../shared/core/PhysicsEngine.js");
include("../shared/core/Player.js");
include("../shared/core/TileMap.js");
include("../shared/core/Weapon.js");
include("../shared/core/WeaponInstance.js");
include("../shared/environment/Spawner.js");
include("../shared/environment/SpawnPoint.js");
include("../shared/environment/Teleporter.js");
include("../shared/items/EnergyCanister.js");
include("../shared/items/HealthCanister.js");
include("../shared/items/QuadDamage.js");
include("../shared/maps/map1.js");
include("../shared/weaponinstances/SimpleProjectile.js");
include("../shared/weaponinstances/BounceBallBullet.js");
include("../shared/weaponinstances/LandmineDisk.js");
include("../shared/weaponinstances/Shield.js");
include("../shared/weaponinstances/Sword.js");
include("../shared/weapons/Thrusters.js");
include("../shared/weapons/Shield.js");
include("../shared/weapons/BounceBallGun.js");
include("../shared/weapons/Landmine.js");
include("../shared/weapons/ShotGun.js");
include("../shared/weapons/ChainGun.js");
include("../shared/weapons/MachineGun.js");
include("../shared/weapons/RocketLauncher.js");
include("../shared/weapons/Sword.js");

exports.createGameInstance = function(callbacks) {
  var fakeConsole = { log: function() {} };

  var phonyContextGlobals = {
    IS_SERVER:true,
    console:fakeConsole,
    Server:callbacks,
  };

  var phonyContext = vm.createContext(phonyContextGlobals);

  for (var i=0; i<ALL_SOURCE.length; i++) {
    var s = ALL_SOURCE[i];
    try {
      vm.runInContext(String(s.src), phonyContext, s.name);
    } catch (e) {
      console.log("error loading game file " + s.name);
      throw e;
    }
  }

  phonyContext.enableLogging = function() {
    fakeConsole.log = console.log;
  }

  return phonyContext;
};


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

SpawnerClass = EntityClass.extend({
  timeUntilSpawn:0,
  lastSpawned:null,
  spawnItem:null,
  nextSpawnTime:0,
  onInit: function (spawnItem) {
    this.spawnItem = spawnItem;
  },
  kill: function () {},
  update: function () {
	if(!IS_SERVER)	return;
    if (this.lastSpawned == null)
	{
		if (this.nextSpawnTime>gGameEngine.getTime()) 
			return;
      
		//Create entity on spawner
		var startPoint = new Vec2(this.pos.x, this.pos.y);
		var ent_name = this.name + "_" + this.spawnItem;
		if(gGameEngine.getEntityByName(ent_name)!=null)
			return;
		var ent = gGameEngine.spawnEntity(this.spawnItem, this.pos.x, this.pos.y, {
              name: "!" + ent_name
            });
		this.lastSpawned = ent;
	 }
	 else
	 {
		if(this.lastSpawned._killed == true )
		{
			this.nextSpawnTime = gGameEngine.getTime() + 20;
			this.lastSpawned = null;
		}
	 }
    
  },
});

Factory.nameClassMap['Spawner'] = SpawnerClass;

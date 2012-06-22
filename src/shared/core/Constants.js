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

ConstantsClass = Class.extend({

	GAME_UPDATES_PER_SEC : 10,
	GAME_LOOP_HZ : 1.0 / 10.0,

	PHYSICS_UPDATES_PER_SEC : 60,
	PHYSICS_LOOP_HZ : 1.0 / 60.0

});


var Constants = new ConstantsClass();
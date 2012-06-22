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

FactoryClass = Class.extend({
  nameClassMap: {},

  init: function () {},

  getClass: function (name) {
    return this.nameClassMap[name];
  },

  createInstance: function () {
    var name = arguments[0];
    var ClassToCreate = this.getClass();
    switch (arguments.length) {
    case 1:
      return new ClassToCreate();
    case 2:
      return new ClassToCreate(arugments[1]);
    case 3:
      return new ClassToCreate(arugments[1], arugments[2]);
    case 4:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3]);
    case 5:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4]);
    case 6:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4], arugments[5]);
    case 7:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4], arugments[5], arguments[6]);
    case 8:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4], arugments[5], arguments[6], arguments[7]);
    case 9:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4], arugments[5], arguments[6], arguments[7], arguments[8]);
    case 10:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4], arugments[5], arguments[6], arguments[7], arguments[8], arguments[9]);
    case 11:
      return new ClassToCreate(arugments[1], arugments[2], arugments[3], arugments[4], arugments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10]);
    default:
      Logger.log("Creating instances with more than 10 arguments not supported");
    }

  },

});

var Factory = new FactoryClass();
//exports.Class = FactoryClass;

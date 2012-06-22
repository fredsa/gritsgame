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

GuiEngineClass = Class.extend({
  lightBoxes: [],
  inventorySlots: [],
  _draggingItemIndex: -1,
  pendingWeaponSwapIdxs: [0,7,1],

  init: function () {
    this.loadout = $doc('#loadout');
    this.primaryWeaponSlot = $doc("#primary-weapon-slot");
    this.secondaryWeaponSlot = $doc("#secondary-weapon-slot");
    this.itemSlot = $doc("#item-slot");
  },

  //-----------------------------
  draw: function () {

    for (var i = 0; i < this.lightBoxes.length; i++) {
      this.lightBoxes[i].draw();
    }
  },
//-----------------------------
  grabInventoryObjects:function() {
   for(var i=0;i<gWeapons_DB.weapons.length;i++) {
      this.inventorySlots[i] = $doc("#inventory-slot-" + i);
    }
	
	
	this.primaryWeaponSlot.className = this.inventorySlots[this.pendingWeaponSwapIdxs[0]].className;
	this.secondaryWeaponSlot.className = this.inventorySlots[this.pendingWeaponSwapIdxs[1]].className;
	this.itemSlot.className = this.inventorySlots[this.pendingWeaponSwapIdxs[2]].className;
    
  },
  //-----------------------------
  onMouseDownEvent: function (button, pointX, pointY, event) {
   
	if (!this.isLoadoutDisplayed())
      return false;
	  
    return true;
  },
  //-----------------------------------------
  onLoadoutWeaponClick:function(itemIdx)
  {
	var wpn = gWeapons_DB.weapons[itemIdx];
	if(wpn.type == 0)
	{
		this.pendingWeaponSwapIdxs[0] = itemIdx;
		this.primaryWeaponSlot.className = this.inventorySlots[itemIdx].className;
	}
	else if(wpn.type == 1)
	{
		this.pendingWeaponSwapIdxs[1] = itemIdx;
		this.secondaryWeaponSlot.className = this.inventorySlots[itemIdx].className;
	}
	else if(wpn.type == 2)
	{
		this.pendingWeaponSwapIdxs[2] = itemIdx;
		this.itemSlot.className = this.inventorySlots[itemIdx].className;
	}
	
	
  },
  //-----------------------------------------
  onMouseUpEvent: function (button, pointX, pointY, event) {
    if (!this.isLoadoutDisplayed())
      return false;

    return true;
  },
//-----------------------------
  onClick: function(pos) {
    for (var i = 0; i < this.lightBoxes.length; i++) {
      var lb = this.lightBoxes[i];
      var localPos = {x:(pos.x - lb.rect.x), y:(pos.y - lb.rect.y)};
      lb.onClick(localPos);
    }
  },
//-----------------------------
  isLoadoutDisplayed: function() {
    return this.loadout.style.display !== "none";
  },

});

var gGuiEngine = new GuiEngineClass();


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


var cachedPlayerData = null;

var genFriendsTableHTML = function()
{
	var txti = "";
				
				txti +="<table style='border-collapse: collapse;' >";
				for(var i =0; i < gCachedFriendsList.items.length; i++)
				{
					txti += "<tr><td><img src='" + gCachedFriendsList.items[i].image.url +"'></td><td><a href='"+ gCachedFriendsList.items[i].url+"' target='_blank'><font class='profileFriendName'>"+ gCachedFriendsList.items[i].displayName + "</a></font></td></tr>";
				}
				
				txti +="</table>"
		
				
	return txti;
}


var show_qrTile = function()
{
document.getElementById('pc_qrTile').style.display = "block";
}

var show_scoreTile = function()
{
	document.getElementById('pc_scoresTile').style.display = "block";
	var popupWidth = 600;
	var windowWidth = document.documentElement.clientWidth;
	$("#pc_scoresTile").css({
		"position": "absolute",
		"top": -160,
		"left": 0//windowWidth/2-popupWidth/2
	});
	var html="";
	html+="<center>TIME LEFT: 00:00</center></br>";
	html+="<table width='100%'><tr><td width='200px'  valign='top'>";
		//team 0
		html+="<img class='team_light' src='./img/blank.png'><br>";
		html+="<table>";
		for (var p in gGameEngine.gPlayers) {
			var plyr = gGameEngine.gPlayers[p];
			if(plyr.team !=0) continue;
			html+="<tr><td>" + plyr.displayName + "</td><td><font color='red'>" + plyr.numKills + "</font></td></tr>";
		}
		html+="</table>";
		html+="</td><td width='200px' valign='top'>";
		
		//team 1
		html+="<img class='team_dark' src='./img/blank.png'><br>";
		html+="<table>";
		for (var p in gGameEngine.gPlayers) {
			var plyr = gGameEngine.gPlayers[p];
			if(plyr.team !=1) continue;
			html+="<tr><td><font color='red'>" + plyr.numKills + "</font></td><td>" + plyr.displayName + "</td></tr>";
		}
		html+="</table>";
	
	html+="</td></tr></table>";
	document.getElementById('pc_scoresTile').innerHTML = html;
}

var goto_aboutScreen = function()
{
	document.getElementById('pc_gamesearch').style.display = "none";
	document.getElementById('pc_loadinggame').style.display = "none";
	document.getElementById('pc_spawnscreen').style.display = "none";
	document.getElementById('pc_in-opts').style.display = "none";
	document.getElementById('pc_scoresTile').style.display = "none";
	
	document.getElementById('pc_aboutscreen').style.display = "block";
	
	centerPopup();loadPopup();
}


var goto_ingameoptions = function()
{
	document.getElementById('pc_gamesearch').style.display = "none";
	document.getElementById('pc_loadinggame').style.display = "none";
	document.getElementById('pc_spawnscreen').style.display = "none";
	document.getElementById('pc_aboutscreen').style.display = "none";
	
	document.getElementById('pc_in-opts').style.display = "block";
	centerPopup();loadPopup();
	show_scoreTile();
	show_qrTile();
}

var goto_findGame = function(retry)
{
	document.getElementById('pc_gamesearch').style.display = "block";
	centerPopup();loadPopup();
	
	//ask the matchmaker for a game
	var reqUri = window.location.origin + '/grits/findGame';
	// userID query parameter is only used in the dev_appserver
	reqUri += '?userID=' + cachedUserID;

	function clearpopup() {
		document.getElementById('pc_gamesearch').style.display = "none";
		document.getElementById('pc_loadinggame').style.display = "block";
		disablePopup();
	}
	
	xhrPost(reqUri, gAccessToken, function(xhr)
	{
		var respDat = JSON.parse(xhr.responseText);
		if(respDat.result == 'no-available-servers') {
			alert('Sorry, no game servers with available capacity are available. Please try again in a few minutes.');
			clearpopup();
			return;
		}
		if(respDat.result == 'wait') {
                        if (respDat.players_needed_for_next_game == -1) {
				if (retry) {
					goto_findGame(false);
					return;
				}
				alert('Sorry, all existing games are currently full. Please wait a few moments, and join again.');
			} else {
				alert('Sorry, we need a total of ' + respDat.players_needed_for_next_game + ' players before we can start the next game.');
			}
			clearpopup();
			return;
		}
		if(!respDat.game) {
			throw 'Unable to find game';
		}
		if(!respDat.player_game_key) {
			throw 'Unable to find player_game_key';
		}
                if(!respDat.game.gameURL) {
                        throw 'response did not specify gameURL';
                }
	
		document.getElementById('pc_gamesearch').style.display = "none";	
		document.getElementById('pc_loadinggame').style.display = "block";
		centerPopup();loadPopup();
	
		console.log('Connecting to game at ' + respDat.game.gameURL + ' using player_game_key ' + respDat.player_game_key);
		loadGame(respDat.game.gameURL, respDat.player_game_key);
	});
}

var goto_profile = function()
{

	if(cachedPlayerData!=null)
	{
		select('UI_ProfileMenu');
		return;
	}
	
	var reqUri = window.location.origin + '/grits/getProfile';
	// userID query parameter is only used in the dev_appserver
	reqUri += '?userID=' + cachedUserID;

	
	//console.log('goto_profile(): reqUri=', reqUri)
	xhrPost(reqUri, gAccessToken, function(xhr)
	{
			//console.log('goto_profile(): xhr=', xhr);
			if (xhr.status != 200) {
				throw 'goto_profile(): ' + reqUri + '\n' + xhr.status + ' ' + xhr.responseText;
			}
			var userDat;
			try {
				userDat = JSON.parse(xhr.responseText);
			} catch(err) {
				throw 'goto_profile(): Failed to JSON.parse xhr.responseText=' + xhr.responseText;
			}
			cachedPlayerData = userDat;
			
			select('UI_ProfileMenu');
			var profHeader = document.getElementById('profile_header');
			profHeader.innerHTML = "<img  class='portrait' src='"+cachedUserProfile.picture+"?sz=200'><img src='./img/blank.png' class='portrait_boarder' ><div class='profile_header'><font class='profileMyName'>" + cachedUserProfile.name + "<a href='"+cachedUserProfile.link+"' target='_blank'>+</a></font><br><font class='profileMyStats'>Num Credits : " + userDat.credits + "<br>High Score : 000</font></div>";
			
			var profHeader = document.getElementById('profile_friendslist');
			
			if(gCachedFriendsList == null)
			{
				profHeader.innerHTML = "<img src='img/loading.gif'>";
				
				checkWait(
					function()
					{
						
						var docl = document.getElementById('profile_friendslist');
						
						return (gCachedFriendsList != null) && (docl != null);
					},
					function()
					{
						var docl = document.getElementById('profile_friendslist');
						docl.innerHTML =  genFriendsTableHTML();
					}
				);
			}
			else
			{
				profHeader.innerHTML = genFriendsTableHTML();
			}
			
	});
	
}


var goto_mainmenu = function()
{
	select('UI_MainMenu');
}

var buyItem=function(itemID)
{
	var reqUri = window.location.origin + '/grits/buyItem';
	// userID query parameter is only used in the dev_appserver
	reqUri += '?userID=' + cachedUserID;
	reqUri += '&itemID=' + itemID;
	

	xhrPost(reqUri, gAccessToken, function(xhr)
	{
			var docl = document.getElementById('welcomescreen');
			if (xhr.status != 200) {
				throw 'buyItem xhr ' + xhr.status + ': " + xhr.responseText';
			}
			try {
				var r = JSON.parse(xhr.responseText);
			} catch(e) {
				throw 'buyItem xhr failed to parse responseText:\n' + xhr.responseText;
			}
			
			if (r.result == 'offer')
			{
				alert(r.offerDesc + '\n\nxhr.responseText=' + xhr.responseText);
			}
			else if (r.result)
			{
				cachedPlayerData.credits = r.userCredits;
				cachedPlayerData.virtualItems.push(r.itemID);
				var docl = document.getElementById('UI_StoreMenu_creditsnumber');
				docl.innerHTML = "credits : c" + cachedPlayerData.credits;
			}
			else
			{
				console.log('Unable able to buy item; got result', r);
			}
	});
}

var toggle_spawn_inv_panel = function(panelIdx)
{
	var names=['primary','secondary','item'];
	for(var invIdx =0; invIdx < names.length; invIdx++)
	{
		$doc('#inventory-container-' + names[invIdx]).style.display = 'none';
		$doc('#spawn_bracket_' + names[invIdx]).style.display = 'none';
	}
	
		$doc('#inventory-container-' + names[panelIdx]).style.display = 'block';
		$doc('#spawn_bracket_' + names[panelIdx]).style.display = 'block';
}

var show_respawn = function()
{
	var names=['primary','secondary','item'];
	for(var invIdx =0; invIdx < names.length; invIdx++)
	{
		var _spawnMenu_inventory = document.getElementById('inventory-container-' + names[invIdx]);
		
		
		var layoutstring = "";
		
		layoutstring+="<table>";
			for(var i =0; i < gWeapons_DB.weapons.length; i++)
			{
				if(gWeapons_DB.weapons[i].type != invIdx)
					continue;
				var x = i %7;
				var y = Math.floor(i / 7);
				layoutstring += "<tr><td><div id='inventory-slot-" +i+ "' class='"+gWeapons_DB.weapons[i].icon+"_btn' " ;
				layoutstring += "onclick='playSoundInstance(\"./sound/menu_select.ogg\");gGuiEngine.onLoadoutWeaponClick(" + i + ");'>&nbsp;</div></td><td>" +  gWeapons_DB.weapons[i].displayName + "<br>" + gWeapons_DB.weapons[i].displayDesc + "</td>";
			}
			layoutstring += "</table>";
		_spawnMenu_inventory.innerHTML = layoutstring;
	}
	
	if(gGuiEngine!=null)
	{
		gGuiEngine.grabInventoryObjects();
		//set our selected icons properly
		for(var widx = 0; widx < gGameEngine.gPlayer0.weapons.length; widx++)
		{
			var idx = -1;
			for(var i =0; i < gWeapons_DB.weapons.length; i++)
			{
				if(gGameEngine.gPlayer0.weapons[widx].itemID == gWeapons_DB.weapons[i].itemID)
				{
					break;
				}
			}
			if(idx != -1)
			{
				gGuiEngine.pendingWeaponSwapIdxs[widx] = idx;
			}
		}
	}
	
	
	document.getElementById('pc_loadinggame').style.display = "none";
	document.getElementById('pc_gamesearch').style.display = "none";
	document.getElementById('pc_spawnscreen').style.display = "block";
	document.getElementById('pc_aboutscreen').style.display = "none";
	show_scoreTile();
	show_qrTile();
	loadPopup();	
}

var goto_store = function()
{
	try {
		var reqUri = window.location.origin + '/grits/getProfile';
		// userID query parameter is only used in the dev_appserver
		reqUri += '?userID=' + cachedUserID;


		var _StoreMenu_creditsnumber = document.getElementById('UI_StoreMenu_creditsnumber');
		_StoreMenu_creditsnumber.innerHTML = "credits : " + cachedPlayerData.credits ;

		var _StoreMenu_inventory = document.getElementById('UI_StoreMenu_inventory');

		var layoutstring = "<div style='overflow:scroll;position:absolute;top:12px;left:16px;width:760px;height:475px;'><table>";
		for(var i =0; i < gWeapons_DB.weapons.length; i++)
		{
			layoutstring += "<tr><td><div class='"+gWeapons_DB.weapons[i].icon+"_btn'>&nbsp;</div></td><td><font class='storeItemTitle'>" +  gWeapons_DB.weapons[i].displayName + "</font><br><font class='storeItemDesc'>" + gWeapons_DB.weapons[i].displayDesc + "</font></td>";

			var found = false;
			for(var k = 0; k < cachedPlayerData.virtualItems.length; k++)
			{
				if(cachedPlayerData.virtualItems[k] == gWeapons_DB.weapons[i].itemID)
				{
					found = true;
					break;
				}
			}

			if(!found)
				layoutstring+= "<td>cost : c" + gWeapons_DB.weapons[i].priceInCredits + "<br><a href='#' onclick='playSoundInstance(\"./sound/menu_select.ogg\");buyItem(" +gWeapons_DB.weapons[i].itemID + ")' onmouseover='playSoundInstance(\"./sound/menu_bump.ogg\")'><img class='buy_btn' src='./img/blank.png'></a></td>";

		}
		layoutstring += "</table></div>";


		_StoreMenu_inventory.innerHTML = layoutstring;

		select('UI_StoreMenu');
	} catch(e) {
		throw 'exception in goto_store:\n' + e + '\ncalled by: ' + goto_store.caller;
	}
}

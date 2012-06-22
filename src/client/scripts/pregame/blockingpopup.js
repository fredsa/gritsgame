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


function popupOnPageLoad()
{
	//document.getElementById('mainbody').innerHTML += givePopupHTML();
	//CLOSING POPUP
	//Click the x event!
	$("#popupContactClose").click(function(){
		disablePopup();
	});
	/*//Click out event!
	$("#backgroundPopup").click(function(){
		disablePopup();
	});
	//Press Escape event!
	$(document).keypress(function(e){
		if(e.keyCode==27 && popupStatus==1){disablePopup();}
	});*/
}

function givePopupHTML()
{
	return "<div id='popupContact'><a id='popupContactClose'>x</a><div id='popupContent' style='color:white;opacity:0.7;background:#000000;width:100%;height:100%;'></div></div> <div id='backgroundPopup'></div>"  
	
};

//SETTING UP OUR POPUP
//0 means disabled; 1 means enabled;
var popupStatus = 0;

//loading popup with jQuery magic!
function loadPopup(){
	//loads popup only if it is disabled
	if(popupStatus==0)
	{
		$("#backgroundPopup").css({"opacity": "0.7"});
		$("#backgroundPopup").fadeIn("slow");
		$("#popupContact").fadeIn("slow");
		popupStatus = 1;
	}
}
//disabling popup with jQuery magic!
function disablePopup(){
	//disables popup only if it is enabled
	if(popupStatus==1){
		$("#backgroundPopup").fadeOut("slow");
		$("#popupContact").fadeOut("slow");
		popupStatus = 0;
		document.getElementById('pc_gamesearch').style.display = "none";
		document.getElementById('pc_loadinggame').style.display = "none";
		document.getElementById('pc_spawnscreen').style.display = "none";
		document.getElementById('pc_in-opts').style.display = "none";
		document.getElementById('pc_scoresTile').style.display = "none";
		document.getElementById('pc_aboutscreen').style.display = "none";
		document.getElementById('pc_qrTile').style.display = "none";
	}
}

//centering popup
function centerPopup(){
	//request data for centering
	var windowWidth = document.documentElement.clientWidth;
	var windowHeight = document.documentElement.clientHeight;
	var popupHeight = $("#popupContact").height();
	var popupWidth = $("#popupContact").width();
	//centering
	$("#popupContact").css({
		"position": "absolute",
		"top": 180,//windowHeight/2-(popupHeight/2),
		"left": windowWidth/2-popupWidth/2
	});
//only need force for IE6

	$("#backgroundPopup").css({
		"height": windowHeight
	});

}
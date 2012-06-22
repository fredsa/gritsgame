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


var OAuthKeys=[];
OAuthKeys['gaeURI'] = window.location.origin + '/';




var authScope = 'https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/plus.me+https://www.googleapis.com/auth/plus.people.recommended';



// collisions are rare and surviable
var ANONYMOUS = "bot*" + Math.ceil(Math.random()*9999);
var gAccessToken = null;
var cachedUserID = ANONYMOUS;
var cachedUserProfile = null;
var cachedUserName = "";

function getProfile() 
  {
	if(gAccessToken == null)
		return;
		
	var reqUri = 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + gAccessToken;
	
	//console.log('getProfile(): reqUri=', reqUri);
	xhrJSONP(reqUri, function(resp) 
		{
			//console.log('getProfile(): resp=', resp)
			cachedUserProfile = resp;
			cachedUserName = resp.email;
			
			//now go get our grits ID
			var reqUri = OAuthKeys['gaeURI'] + "login";
			// these query parameters are only used in the dev_appserver
			reqUri += '?userID=' + resp.id + '&displayName=' + resp.name;
			
			//console.log('getProfile(): reqUri=', reqUri);
			xhrPost(reqUri, gAccessToken, function(xhr)
			{
				if (xhr.status != 200) {
					throw 'getProfile() xhr ' + xhr.status + ':\n' + xhr.responseText
				}
				try {
					var userDat = JSON.parse(xhr.responseText);
				} catch(e) {
					var userDat = xhr.responseText;
					throw 'getProfile() xhr parse error (' + e + ') with response text:\n' + xhr.responseText
				}
				cachedUserID = userDat.userID;
				getRecommended();
				goto_profile();
			});
	
	
		});
    
  }

//---------------------------------
var loginComplete = function()
{
	//we now have our oauth token, we need to fetch the user ID from their OAUTH profile, and convert it to 
	//a grits ID	
	
	//get our userID token from the server
	
	getProfile();
}
//---------------------------------
function dologin()
{
	authorize();
}
//---------------------------------
var dologout = function()
{
	accessToken = null;
	cachedUserID=ANONYMOUS;
	
	if(gGameEngine && gGameEngine.gSocket)
		gGameEngine.gSocket.disconnect();
	
}

//---------------------------------



//NOTE below is dark OAUTH2.0 voodoo..
  
 //---------------------------------
function authorize(e) {
  event.preventDefault();
	
	var mysize = [window.outerWidth, window.outerHeight]
	var mypos = [window.screenX, window.screenY]

	var size = [550, 550];
	var coords = [mypos[0] + Math.floor((mysize[0] - size[0]) / 2), mypos[1] + Math.floor((mysize[1] - (size[1] * 1.25)) / 2)];
		
		
	window.open(window.location.origin + "/loginoauth", "Grits OAUTH2.0", "width=" + size[0] + ", height=" + size[1] + ", left=" + coords[0] + ", top=" + coords[1]);	
	
    
  return false;
  }
  
  //---------------------------------
  //called from logup.html
var setOauthParams = function(params)
{
	//console.log('setOauthParams(): params=', params)
	gAccessToken = params.access_token;
	// TODO Handle token expiration more gracefully:
	// - perhaps at the beginning of each game
	// - if a bad token is detected on one of the /grits service calls
	setTimeout(function() {
		alert('Our OAuth2 access token has expired after ' + params.expires_in +
		      ' seconds. Please refresh the page to login again.');
		}, params.expires_in * 1000);
	loginComplete();
}

	

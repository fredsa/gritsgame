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


var gCachedFriendsList = null;
 //---------------------------------
  function getRecommended() 
  {
	if(gAccessToken == null)
		return;
		
	var reqUri = window.location.origin + '/grits/getFriends';
	reqUri += '?userID=' + cachedUserID;
	reqUri += '&accessToken=' + gAccessToken;
	
	
/*
    var reqUri = 'https://www.googleapis.com/plus/v1games/people/me/people/recommended';
	reqUri += '?key=' + OAuthKeys['APIKey'];
	reqUri += '&access_token=' + gAccessToken;
	*/
	xhrPost(reqUri, gAccessToken, function(jsonObj) 
		{
			gCachedFriendsList = JSON.parse(jsonObj.responseText);
		});
    
  }

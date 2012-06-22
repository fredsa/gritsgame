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


function xhrGet(reqUri,reqCred,callback)
{
	var caller = xhrGet.caller;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", reqUri, true);
	xhr.onreadystatechange = function() 
	{
		if (xhr.readyState == 4)
		{
			if (xhr.status != 200) {
				throw 'xhrGet failed:\n' + reqUri + '\nHTTP ' + xhr.status + ': ' + xhr.responseText + '\ncaller: ' + caller;
			}
			if(callback) {
				try {
					callback(xhr);
				} catch(e) {
					throw 'xhrGet failed:\n' + reqUri + '\nException: ' + e + '\nresponseText: ' + xhr.responseText + '\ncaller: ' + caller;
				}
			}
		}
	};
	if(reqCred)
		xhr.withCredentials = "true";
	xhr.send();
}
function xhrPost(reqUri, oauth2AccessToken, callback)
{
	var xhr = new XMLHttpRequest();
	xhr.open("POST", reqUri, true);
	xhr.onreadystatechange = function() 
	{
		if (xhr.readyState == 4) 
		{
			if(callback)
				callback(xhr);
		}
	};
	
	//Send the proper header information along with the request
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("Authorization", "Bearer " + oauth2AccessToken);
	xhr.send(reqUri);
}

//---------------------------------
function xhrJSONP(reqUri,callback)
{
	$.ajax(
	{
		'url':reqUri,
		'dataType':'jsonp',
		'success': function(data, textStatus, jqXHR) 
		{
			if(callback != null)
				callback(data);
			
		},
		'error': function(jqXHR, textStatus, errorThrown) 
		{
			console.log(errorThrown);
			
		}
	});

}

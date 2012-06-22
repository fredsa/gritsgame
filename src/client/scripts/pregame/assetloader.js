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

al_currAssetStates= Array();
function al_isImgFilename(fname)
	{
		return  fname.indexOf('.jpg') != -1 ||
				fname.indexOf('.png') != -1 ||
				fname.indexOf('.gif') != -1 ||
				fname.indexOf('.wp') != -1;
	};

	function al_isSoundFilename(fname)
	{
		return  fname.indexOf('.ogg') != -1 ||
				fname.indexOf('.ogg') != -1 ||
				fname.indexOf('.ogg') != -1 != -1;
	};
	
	function al_isLoadFinished()
	{
		for(key in al_currAssetStates)
		{
			if(al_currAssetStates[key] == 0)
				return false;
		}
		return true;
	};
	function al_imgLoadCallback(imgName)
	{
		al_currAssetStates[imgName] = 1;
	};
	function loadAssets(uriList, onCompleteFunction)
	{
		al_currAssetStates.length = 0;
		
		for(var i =0; i < uriList.length;i++)
		{
			var ast = uriList[i];
			al_currAssetStates[ast] = 0;
			
			if(al_isImgFilename(ast))
			{
				if(ImageCache[ast] != null)
					return ImageCache[ast];
				var img = new Image();
				img.onload = new function() {al_imgLoadCallback(ast)};
				img.src = ast;	
				
				ImageCache[ast] = img;
			}
			else if(al_isSoundFilename(ast))
			{
				gSM.loadAsync(ast, function(s) {
				al_currAssetStates[s.path] = 1;
				} );
			}
			
			//else //TODO
			
		}
		
		checkWait(al_isLoadFinished, onCompleteFunction);
	}
	



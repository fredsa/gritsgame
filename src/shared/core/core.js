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



Number.prototype.map = function(istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((this - istart) / (istop - istart));
};

Number.prototype.limit = function(min, max) {
	return Math.min(max, Math.max(min, this));
};

Number.prototype.round = function(precision) {
	precision = Math.pow(10, precision || 0);
	return Math.round(this * precision) / precision;
};

Number.prototype.floor = function() {
	return Math.floor(this);
};

Number.prototype.ceil = function() {
	return Math.ceil(this);
};

Number.prototype.toInt = function() {
	return (this | 0);
};

Array.prototype.erase = function(item) {
	for (var i = this.length; i--; i) {
		if (this[i] === item) this.splice(i, 1);
	}
	return this;
};

Array.prototype.random = function() {
	return this[ (Math.random() * this.length).floor() ];
};

Function.prototype.bind = function(bind) {
	var self = this;
	return function(){
		var args = Array.prototype.slice.call(arguments);
		return self.apply(bind || null, args);
	};
};

merge = function(original, extended)
{
    for (var key in extended)
    {
        var ext = extended[key];
        if (
		typeof (ext) != 'object' ||
		ext instanceof Class
	)
        {
            original[key] = ext;
        }
        else
        {
            if (!original[key] || typeof (original[key]) != 'object')
            {
                original[key] = {};
            }
            merge(original[key], ext);
        }
    }
    return original;
};

function copy(object) 
{
    if (
   !object || typeof (object) != 'object' ||
   object instanceof Class
) {
        return object;
    }
    else if (object instanceof Array) {
        var c = [];
        for (var i = 0, l = object.length; i < l; i++) {
            c[i] = copy(object[i]);
        }
        return c;
    }
    else {
        var c = {};
        for (var i in object) {
            c[i] = copy(object[i]);
        }
        return c;
    }
};

 function ksort(obj) {
     if (!obj || typeof (obj) != 'object') {
         return [];
     }

     var keys = [], values = [];
     for (var i in obj) {
         keys.push(i);
     }

     keys.sort();
     for (var i = 0; i < keys.length; i++) {
         values.push(obj[keys[i]]);
     }

     return values;
    };
    
// -----------------------------------------------------------------------------
// Class object based on John Resigs code; inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/
(function(){
var initializing = false, fnTest = /xyz/.test(function() { xyz; }) ? /\bparent\b/ : /.*/;

this.Class = function() { };
var inject = function(prop)
{
    var proto = this.prototype;
    var parent = {};
    for (var name in prop)
    {
        if (
		typeof (prop[name]) == "function" &&
		typeof (proto[name]) == "function" &&
		fnTest.test(prop[name])
	)
        {
            parent[name] = proto[name]; // save original function
            proto[name] = (function(name, fn)
            {
                return function()
                {
                    var tmp = this.parent;
                    this.parent = parent[name];
                    var ret = fn.apply(this, arguments);
                    this.parent = tmp;
                    return ret;
                };
            })(name, prop[name])
        }
        else
        {
            proto[name] = prop[name];
        }
    }
};

this.Class.extend = function(prop)
{
    var parent = this.prototype;

    initializing = true;
    var prototype = new this();
    initializing = false;

    for (var name in prop)
    {
        if (
		typeof (prop[name]) == "function" &&
		typeof (parent[name]) == "function" &&
		fnTest.test(prop[name])
	)
        {
            prototype[name] = (function(name, fn)
            {
                return function()
                {
                    var tmp = this.parent;
                    this.parent = parent[name];
                    var ret = fn.apply(this, arguments);
                    this.parent = tmp;
                    return ret;
                };
            })(name, prop[name])
        }
        else
        {
            prototype[name] = prop[name];
        }
    }

    function Class()
    {
        if (!initializing)
        {

            // If this class has a staticInstantiate method, invoke it
            // and check if we got something back. If not, the normal
            // constructor (init) is called.
            if (this.staticInstantiate)
            {
                var obj = this.staticInstantiate.apply(this, arguments);
                if (obj)
                {
                    return obj;
                }
            }
			
            for (var p in this)
            {
                if (typeof (this[p]) == 'object')
                {
                    this[p] = copy(this[p]); // deep copy!
                }
            }
			
            if (this.init)
            {
                this.init.apply(this, arguments);
            }
        }
        return this;
    }

    Class.prototype = prototype;
    Class.constructor = Class;
    Class.extend = arguments.callee;
    Class.inject = inject;

    return Class;
};
})();



									
  newGuid_short = function()
  {
    var S4 = function() { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
    return (S4()).toString();
  };

  newGuid = function()
  {
    var S4 = function() { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4()).toString();
  };

	


XHR = function(domainURL, callerInstance, function_name,opt_argv)
	{
	
	 // If optional arguments was not provided, create it as empty
  if (!opt_argv)
    opt_argv = new Array();
    
    // Find if the last arg is a callback function; save it
  var callback = null;
  var len = opt_argv.length;
  if (len > 0 && typeof opt_argv[len-1] == 'function') {
    callback = opt_argv[len-1];
    opt_argv.length--;
  }
  var async = (callback != null);

  // Encode the arguments in to a URI
  var query = 'fcn=' + encodeURIComponent(function_name);
  for (var i = 0; i < opt_argv.length-1; i+=2) {
    var key = (opt_argv[i]);
    var val = (opt_argv[i + 1]);//JSON.stringify(..)
    query += '&' + key + '=' + encodeURIComponent(val);
  }
 // query += '&time=' + new Date().getTime(); // IE cache workaround

//query = "fcn=getActiveGames&p0guid=000";
  // See http://en.wikipedia.org/wiki/XMLHttpRequest to make this cross-browser compatible
  var req = new XMLHttpRequest();

  // Create a 'GET' request w/ an optional callback handler
  req.open('GET', 'http://localhost:8080/grits/?' + query, async);

  if (async) {
    req.onreadystatechange = function() {
      if(req.readyState == 4 && req.status == 200) {
        var response = null;
        try {
         response = JSON.parse(req.responseText);
        } catch (e) {
         response = req.responseText;
        }
        callback(response);
      }
    }
  }

  // Make the actual request
  req.send(null);


	
};

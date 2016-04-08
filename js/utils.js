/*
 * This file is part of OpenLevelUp!.
 * 
 * OpenLevelUp! is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * OpenLevelUp! is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with OpenLevelUp!.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * OpenLevelUp!
 * Web viewer for indoor mapping (based on OpenStreetMap data).
 * Author: Adrien PAVIE
 *
 * Utility JS functions
 */
"use strict";

var has_require = typeof require !== 'undefined';
if(has_require) {
	// var utils = require('./utils');
	// var parseOsmData = utils.parseOsmData;

	var osmtogeojson = require('../lib/osmtogeojson.js');
}

/**
 * Parses raw OSM data, and return result.
 * @param data The OSM data.
 * @return The OSM parsed data (GeoJSON)
 */
function parseOsmData(data) {
	if(!data) {
		console.error(data);
		throw new Error("Invalid data");
	}
	return osmtogeojson(data, { polygonFeatures: POLYGON_FEATURES });
};

function addCompatibility() {
	//Bind
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if (typeof this !== 'function') {
				// closest thing possible to the ECMAScript 5
				// internal IsCallable function
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}
			
			var aArgs   = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP    = function() {},
			fBound  = function() {
				return fToBind.apply(this instanceof fNOP
				? this
				: oThis,
			 aArgs.concat(Array.prototype.slice.call(arguments)));
			};
			
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();
			
			return fBound;
		};
	}
	
	//Object.keys
	if (!Object.keys) {
	  Object.keys = (function() {
		'use strict';
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
			dontEnums = [
			  'toString',
			  'toLocaleString',
			  'valueOf',
			  'hasOwnProperty',
			  'isPrototypeOf',
			  'propertyIsEnumerable',
			  'constructor'
			],
			dontEnumsLength = dontEnums.length;

		return function(obj) {
		  if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
			throw new TypeError('Object.keys called on non-object');
		  }

		  var result = [], prop, i;

		  for (prop in obj) {
			if (hasOwnProperty.call(obj, prop)) {
			  result.push(prop);
			}
		  }

		  if (hasDontEnumBug) {
			for (i = 0; i < dontEnumsLength; i++) {
			  if (hasOwnProperty.call(obj, dontEnums[i])) {
				result.push(dontEnums[i]);
			  }
			}
		  }
		  return result;
		};
	  }());
	}
};

/**
 * Merges two arrays and removes duplicates values
 * @param a1 The first array
 * @param a2 The second array
 * @return The merged array
 */
function mergeArrays(a1, a2) {
	var a = a1.concat(a2);
	for(var i=0; i<a.length; ++i) {
		for(var j=i+1; j<a.length; ++j) {
			if(a[i] === a[j])
				a.splice(j--, 1);
		}
	}
	return a;
};

/**
 * Does the array contains the given object
 * @param a The array
 * @param obj The object to look for
 * @return True if obj in array
 */
function contains(a, obj) {
	var i = a.length;
	while (i--) {
		if (a[i] === obj) {
			return true;
		}
	}
	return false;
};

/**
 * Sorts a number array
 */
function sortNumberArray(a, b) {
	return a-b;
};

/**
 * Removes duplicates elements in a sorted array
 */
function rmDuplicatesSortedArray(item, pos, ary) {
	return !pos || item != ary[pos - 1];
};

/**
 * Get the levels list from tags and relation list
 * @param tags The object tags
 * @param relations The list of associated relations
 * @return The levels in a sorted array
 */
function listLevels(tags, relations) {
	//try to find levels for this feature
	var currentLevel = null;
	
	//No tags
	if(tags == null) {
		currentLevel = [];
	}
	//Tag level
	else if(tags.level != undefined) {
		currentLevel = parseLevelsFloat(tags.level);
	}
	//Tag repeat_on
	else if(tags.repeat_on != undefined) {
		currentLevel = parseLevelsFloat(tags.repeat_on);
	}
	//Tag min_level and max_level
	else if(tags.min_level != undefined && tags.max_level != undefined) {
		currentLevel = parseLevelsFloat(tags.min_level+"-"+tags.max_level);
	}
	//Tag buildingpart:verticalpassage:floorrange
	else if(tags["buildingpart:verticalpassage:floorrange"] != undefined) {
		currentLevel = parseLevelsFloat(tags["buildingpart:verticalpassage:floorrange"]);
	}
	//Relations type=level
	else if(relations != undefined && relations.length > 0) {
		currentLevel = [];
		
		//Try to find type=level relations, and add level value in level array
		for(var i=0; i < relations.length; i++) {
			var rel = relations[i];
			if(rel.reltags.type == "level" && rel.reltags.level != undefined) {
				var relLevel = parseLevelsFloat(rel.reltags.level);
				
				//Test if level value in relation is unique
				if(relLevel.length == 1) {
					currentLevel.push(relLevel[0]);
				}
				else {
					console.log("Invalid level value for relation "+rel.rel);
				}
			}
		}
		
		//Reset currentLevel if no level found
		if(currentLevel.length == 0) { currentLevel = null; }
	}
	
	//Save found levels
	if(currentLevel != null) {
		currentLevel.sort(sortNumberArray);
		return currentLevel;
	} else {
		//console.log("No valid level found for "+_id);
		return [];
	}
}

/**
 * Parses levels list.
 * @param str The levels as a string (for example "1;5", "1,3", "1-3", "-1--6", "from 1 to 42" or "-2 to 6")
 * @return The parsed levels as a float array, or null if invalid
 */
function parseLevelsFloat(str) {
	var result = null;
	
	//Level values separated by ';'
	var regex1 = /^-?\d+(?:\.\d+)?(?:;-?\d+(?:\.\d+)?)*$/;
	
	//Level values separated by ','
	var regex2 = /^-?\d+(?:\.\d+)?(?:,-?\d+(?:\.\d+)?)*$/;
	
	if(regex1.test(str)) {
		result = str.split(';');
		for(var i=0; i < result.length; i++) {
			result[i] = parseFloat(result[i]);
		}
		result.sort(sortNumberArray);
	}
	else if(regex2.test(str)) {
		result = str.split(',');
		for(var i=0; i < result.length; i++) {
			result[i] = parseFloat(result[i]);
		}
		result.sort(sortNumberArray);
	}
	//Level intervals
	else {
		var regexResult = null;
		var min = null;
		var max = null;
		
		//Level values (only integers) in an interval, bounded with '-'
		var regex3 = /^(-?\d+)-(-?\d+)$/;
		
		//Level values from start to end (example: "-3 to 2")
		var regex4 = /^(?:\w+ )?(-?\d+) to (-?\d+)$/;
		
		if(regex3.test(str)) {
			regexResult = regex3.exec(str);
			min = parseInt(regexResult[1]);
			max = parseInt(regexResult[2]);
		}
		else if(regex4.test(str)) {
			regexResult = regex4.exec(str);
			min = parseInt(regexResult[1]);
			max = parseInt(regexResult[2]);
		}
		
		//Add values between min and max
		if(regexResult != null && min != null && max != null) {
			result = [];
			if(min > max) {
				var tmp = min;
				min = max;
				max = tmp;
			}
			
			//Add intermediate values
			for(var i=min; i != max; i=i+((max-min)/Math.abs(max-min))) {
				result.push(i);
			}
			result.push(max);
		}
	}
	
	return result;
}

/**
 * @return The map bounds as string for Overpass API
 */
function boundsString(bounds) {
	return normLat(bounds.getSouth())+","+normLon(bounds.getWest())+","+normLat(bounds.getNorth())+","+normLon(bounds.getEast());
}

/**
 * Adds the default dimension unit if undefined in OSM tag
 * @param v The tag value
 * @return The dimension with unit
 */
function addDimensionUnit(v) {
	if(!isNaN(parseInt(v.substr(-1)))) {
		v+="m";
	}
	return v;
}

/**
 * @return The string with all underscores replace by spaces
 */
function removeUscore(v) {
	return v.replace(/_/g, " ");
}

/**
 * @return The string as a HTML link
 */
function asWebLink(v) {
	return '<a href="'+correctWebLink(v)+'">Link</a>';
}

/**
 * Corrects website URL
 * @param url The website URL
 * @return The corrected URL (or the same if invalid)
 */
function correctWebLink(url) {
	var result;
	var regexUrl = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/[\w#!:.?+=&%@!\-\/]+)?$/;
	var regexUrlNoProtocol = /^(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/[\w#!:.?+=&%@!\-\/]+)?$/;
	
	if(url.match(regexUrl)) {
		result = url;
	}
	else if(url.match(regexUrlNoProtocol)) {
		result = 'http://'+url;
	}
	else {
		console.warn("[Website] Invalid URL: "+url);
		result = url;
	}
	
	return result;
}

/**
 * Calculates the distance between two points through levels
 * @param c1 The first node coordinates
 * @param l1 The first node level
 * @param c2 The second node coordinates
 * @param l2 The second node level
 * @return The estimated distance in meters
 */
function distanceLevels(c1, l1, c2, l2) {
	return Math.sqrt(Math.pow(c1.distanceTo(c2), 2) + Math.pow((l2-l1)*2.5, 2));
}

/**
 * More strict parseFloat function
 */
function filterFloat(value) {
	if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
		.test(value))
		return Number(value);
	return NaN;
}

/**
 * Converts a 0-360° angle into a -180 - 180° angle
 */
function angle360toAngle180(a) {
	if(a >= 0 && a <= 360) { return (a <= 180) ? a : -(360-a); }
	else if(a > 360) { return angle360toAngle180(a-360); }
	else { return angle360toAngle180(a+360); }
}

/**
 * Contains characters used in base 62
 */
var base62 = [ "0","1","2","3","4","5","6","7","8","9",
		"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
		"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z" ];

/**
 * Converts an integer from base 10 (decimal) to base 62 (0-9 + a-z + A-Z)
 * @param val The integer to convert
 * @return The integer in base 62
 */
function decToBase62(val) {
	var result = "";
	
	var i = 0;
	var qi = val;
	var r = [];
	
	while(qi > 0) {
		r[i+1] = qi % 62;
		qi = Math.floor(qi / 62);
		i++;
	}
	
	for(var i in r) {
		result = base62[r[i]] + result;
	}
	
	if(result == "") { result = "0"; }
	
	return result;
}

/**
 * Converts a string in base 62 into an integer (base 10, decimal)
 * This is based on the Horner method
 * @param val The string in base 62
 * @return The integer in base 10
 */
function base62toDec(val) {
	var result = 0;
	
	for(var i=0; i < val.length; i++) {
		result += base62.indexOf(val[i]) * Math.pow(62, val.length - 1 - i);
	}
	
	return result;
}

/**
 * Contains all characters used in 1-26 interval conversion
 */
var letters = [ "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z" ];

/**
 * Converts an integer from 1 to 26 as a letter
 * @param val The integer to convert
 * @return The corresponding letter
 */
function intToLetter(val) {
	return letters[val-1];
}

/**
 * Converts a letter into an integer between 1 and 26
 * @param val The letter to convert
 * @return The integer
 */
function letterToInt(val) {
	return letters.indexOf(val) + 1;
}

/**
 * Converts an integer into a bit array
 * @param val The integer to convert
 * @return The integer as a bit array
 */
function intToBitArray(val) {
	return val.toString(2);
}

/**
 * Converts a bit array into a value in base 62
 * @param val The bit array
 * @return The value in base 62
 */
function bitArrayToBase62(val) {
	var valInt = 0;
	
	for(var i=0; i < val.length; i++) {
		valInt += parseInt(val[i]) * Math.pow(2, val.length - 1 - i);
	}
	
	return decToBase62(valInt);
}

/**
 * @param val The latitude
 * @return The normalized latitude (between -90 and 90)
 */
function normLat(val) {
	return normAbs(val, 90);
}

/**
 * @param val The longitude
 * @return The normalized longitude (between -180 and 180)
 */
function normLon(val) {
	return normAbs(val, 180);
}

function normAbs(val, mod) {
	while(val < -mod) { val += 2*mod; }
	while(val > mod) { val -= 2*mod; }
	var neg = val < 0;
	val = Math.abs(val) % mod;
	return (neg) ? -val : val;
}

/*****************
 * MD5 functions *
 *****************/
function md5(str) {
	//  discuss at: http://phpjs.org/functions/md5/
	// original by: Webtoolkit.info (http://www.webtoolkit.info/)
	// improved by: Michael White (http://getsprink.com)
	// improved by: Jack
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	//    input by: Brett Zamir (http://brett-zamir.me)
	// bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	//  depends on: utf8_encode
	//   example 1: md5('Kevin van Zonneveld');
	//   returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
	
	var xl;
	
	var rotateLeft = function(lValue, iShiftBits) {
		return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
	};
	
	var addUnsigned = function(lX, lY) {
		var lX4, lY4, lX8, lY8, lResult;
		lX8 = (lX & 0x80000000);
		lY8 = (lY & 0x80000000);
		lX4 = (lX & 0x40000000);
		lY4 = (lY & 0x40000000);
		lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
		if (lX4 & lY4) {
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if (lX4 | lY4) {
			if (lResult & 0x40000000) {
				return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			} else {
				return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			}
		} else {
			return (lResult ^ lX8 ^ lY8);
		}
	};
	
	var _F = function(x, y, z) {
		return (x & y) | ((~x) & z);
	};
	var _G = function(x, y, z) {
		return (x & z) | (y & (~z));
	};
	var _H = function(x, y, z) {
		return (x ^ y ^ z);
	};
	var _I = function(x, y, z) {
		return (y ^ (x | (~z)));
	};
	
	var _FF = function(a, b, c, d, x, s, ac) {
		a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
		return addUnsigned(rotateLeft(a, s), b);
	};
	
	var _GG = function(a, b, c, d, x, s, ac) {
		a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
		return addUnsigned(rotateLeft(a, s), b);
	};
	
	var _HH = function(a, b, c, d, x, s, ac) {
		a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
		return addUnsigned(rotateLeft(a, s), b);
	};
	
	var _II = function(a, b, c, d, x, s, ac) {
		a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
		return addUnsigned(rotateLeft(a, s), b);
	};
	
	var convertToWordArray = function(str) {
		var lWordCount;
		var lMessageLength = str.length;
		var lNumberOfWords_temp1 = lMessageLength + 8;
		var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
		var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
		var lWordArray = new Array(lNumberOfWords - 1);
		var lBytePosition = 0;
		var lByteCount = 0;
		while (lByteCount < lMessageLength) {
			lWordCount = (lByteCount - (lByteCount % 4)) / 4;
			lBytePosition = (lByteCount % 4) * 8;
			lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
			lByteCount++;
		}
		lWordCount = (lByteCount - (lByteCount % 4)) / 4;
		lBytePosition = (lByteCount % 4) * 8;
		lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
		lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
		lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
		return lWordArray;
	};
	
	var wordToHex = function(lValue) {
		var wordToHexValue = '',
		wordToHexValue_temp = '',
		lByte, lCount;
		for (lCount = 0; lCount <= 3; lCount++) {
			lByte = (lValue >>> (lCount * 8)) & 255;
			wordToHexValue_temp = '0' + lByte.toString(16);
			wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
		}
		return wordToHexValue;
	};
	
	var x = [],
	k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
	S12 = 12,
	S13 = 17,
	S14 = 22,
	S21 = 5,
	S22 = 9,
	S23 = 14,
	S24 = 20,
	S31 = 4,
	S32 = 11,
	S33 = 16,
	S34 = 23,
	S41 = 6,
	S42 = 10,
	S43 = 15,
	S44 = 21;
	
	str = this.utf8_encode(str);
	x = convertToWordArray(str);
	a = 0x67452301;
	b = 0xEFCDAB89;
	c = 0x98BADCFE;
	d = 0x10325476;
	
	xl = x.length;
	for (k = 0; k < xl; k += 16) {
		AA = a;
		BB = b;
		CC = c;
		DD = d;
		a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
		d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
		c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
		b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
		a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
		d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
		c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
		b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
		a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
		d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
		c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
		b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
		a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
		d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
		c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
		b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
		a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
		d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
		c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
		b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
		a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
		d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
		c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
		b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
		a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
		d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
		c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
		b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
		a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
		d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
		c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
		b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
		a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
		d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
		c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
		b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
		a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
		d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
		c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
		b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
		a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
		d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
		c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
		b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
		a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
		d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
		c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
		b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
		a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
		d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
		c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
		b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
		a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
		d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
		c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
		b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
		a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
		d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
		c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
		b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
		a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
		d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
		c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
		b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
		a = addUnsigned(a, AA);
		b = addUnsigned(b, BB);
		c = addUnsigned(c, CC);
		d = addUnsigned(d, DD);
	}
	
	var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
	
	return temp.toLowerCase();
};

function utf8_encode(argString) {
	//  discuss at: http://phpjs.org/functions/utf8_encode/
	// original by: Webtoolkit.info (http://www.webtoolkit.info/)
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// improved by: sowberry
	// improved by: Jack
	// improved by: Yves Sucaet
	// improved by: kirilloid
	// bugfixed by: Onno Marsman
	// bugfixed by: Onno Marsman
	// bugfixed by: Ulrich
	// bugfixed by: Rafal Kukawski
	// bugfixed by: kirilloid
	//   example 1: utf8_encode('Kevin van Zonneveld');
	//   returns 1: 'Kevin van Zonneveld'
	
	if (argString === null || typeof argString === 'undefined') {
		return '';
	}
	
	var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	var utftext = '',
	start, end, stringl = 0;
	
	start = end = 0;
	stringl = string.length;
	for (var n = 0; n < stringl; n++) {
		var c1 = string.charCodeAt(n);
		var enc = null;
		
		if (c1 < 128) {
			end++;
		} else if (c1 > 127 && c1 < 2048) {
			enc = String.fromCharCode(
				(c1 >> 6) | 192, (c1 & 63) | 128
			);
		} else if ((c1 & 0xF800) != 0xD800) {
			enc = String.fromCharCode(
				(c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
			);
		} else { // surrogate pairs
			if ((c1 & 0xFC00) != 0xD800) {
				throw new RangeError('Unmatched trail surrogate at ' + n);
			}
			var c2 = string.charCodeAt(++n);
			if ((c2 & 0xFC00) != 0xDC00) {
				throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
			}
			c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
			enc = String.fromCharCode(
				(c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
			);
		}
		if (enc !== null) {
			if (end > start) {
				utftext += string.slice(start, end);
			}
			utftext += enc;
			start = end = n + 1;
		}
	}
	
	if (end > start) {
		utftext += string.slice(start, stringl);
	}
	
	return utftext;
};

// define utils for Node module pattern loaders
if (typeof define === 'function' && define.amd) {
	// AMD. Register as an anonymous module.
	// define([], factory);
} else if (typeof module === 'object') {
	// Node js environment
	module.exports.parseOsmData = parseOsmData;
	module.exports.addCompatibility = addCompatibility;
	module.exports.mergeArrays = mergeArrays;
	module.exports.contains = contains;
	module.exports.sortNumberArray = sortNumberArray;
	module.exports.rmDuplicatesSortedArray = rmDuplicatesSortedArray;
	module.exports.listLevels = listLevels;
	module.exports.parseLevelsFloat = parseLevelsFloat;
	module.exports.boundsString = boundsString;
	module.exports.addDimensionUnit = addDimensionUnit;
	module.exports.removeUscore = removeUscore;
	module.exports.asWebLink = asWebLink;
	module.exports.correctWebLink = correctWebLink;
	module.exports.distanceLevels = distanceLevels;
	module.exports.filterFloat = filterFloat;
	module.exports.angle360toAngle180 = angle360toAngle180;
	module.exports.decToBase62 = decToBase62;
	module.exports.base62toDec = base62toDec;
	module.exports.intToLetter = intToLetter;
	module.exports.letterToInt = letterToInt;
	module.exports.intToBitArray = intToBitArray;
	module.exports.bitArrayToBase62 = bitArrayToBase62;
	module.exports.normLat = normLat;
	module.exports.normLon = normLon;
	module.exports.normAbs = normAbs;
	module.exports.md5 = md5;
	module.exports.utf8_encode = utf8_encode;
} else {
	// Browser globals (this is window)
	// this.HashMap = factory();
}

/*
 * This file is part of OpenLevelUp!.
 * 
 * OpenLevelUp! is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * OpenLevelUp! is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with OpenLevelUp!.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * OpenLevelUp!
 * Web viewer for indoor mapping (based on OpenStreetMap data).
 * Author: Adrien PAVIE
 *
 * Utility JS functions
 */

/**
 * Is the given value a float value ?
 * @param val The value to test
 * @return True if it's a float
 */
function isFloat(val) {
	return !isNaN(val);
}

/**
 * @return The current page URL
 */
function myUrl() {
	return $(location).attr('href').split('?')[0];
}

/**
 * @return The current folder URL
 */
function myFolderUrl() {
	var pos = $(location).attr('href').lastIndexOf('/');
	return $(location).attr('href').substring(0, pos);
}

/**
 * Checks if a file exists on the server
 * @param url The URL of the file to check
 * @return True if it exists
 */
function fileExists(url) {
	if(url){
		var req = new XMLHttpRequest();
		req.open('GET', url, false);
		req.send();
		return req.status==200;
	} else {
		return false;
	}
}

/** Checked URL **/
var checkedUrl = new Object();

/**
 * Checks if an URL exists (once)
 * @param url The URL to check
 * @return True if URL is correct
 */
function checkUrl(url) {
	if(Object.keys(checkedUrl).indexOf(url) < 0) {
		checkedUrl[url] = fileExists(url);
	}
	
	return checkedUrl[url];
}

/**
 * Parses levels list.
 * @param str The levels as a string (for example "1;5", "1,3", "1-3", "-1--6", "from 1 to 42" or "-2 to 6")
 * @return The parsed levels as a string array, or null if invalid
 */
function parseLevelsStr(str) {
	var result = null;
	
	//Level values separated by ';'
	var regex1 = /^-?\d+(?:\.\d+)?(?:;-?\d+(?:\.\d+)?)*$/;
	
	//Level values separated by ','
	var regex2 = /^-?\d+(?:\.\d+)?(?:,-?\d+(?:\.\d+)?)*$/;
	
	if(regex1.test(str)) {
		result = str.split(';');
	}
	else if(regex2.test(str)) {
		result = str.split(',');
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
			result = new Array();
			
			//Add intermediate values
			for(var i=min; i != max; i=i+((max-min)/Math.abs(max-min))) {
				result.push(i.toString());
			}
			result.push(max.toString());
		}
	}
	
	//If levels available, sort them
	if(result != null) {
		result.sort(function (a,b) { return parseFloat(a)-parseFloat(b); });
	}
	
	return result;
}

/**
 * Parses levels list.
 * @param str The levels as a string (for example "1;5", "1,3", "1-3", "-1--6", "from 1 to 42" or "-2 to 6")
 * @return The parsed levels as a float array, or null if invalid
 */
function parseLevelsFloat(str) {
	var result = parseLevelsStr(str);
	if(result != null) {
		for(var i in result) {
			result[i] = parseFloat(result[i]);
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
 * @param feature The feature
 * @return The centroid (geometry type independent), as [longitude, latitude]
 */
function centroid(feature) {
	var result = null;
	
	if(feature.geometry.type == "Point") {
		result = feature.geometry.coordinates;
	}
	else if(feature.geometry.type == "LineString") {
		result = centroidLineString(feature.geometry);
	}
	else if(feature.geometry.type == "Polygon") {
		result = centroidPolygon(feature.geometry);
	}
	
	return result;
}

/**
 * @return The centroid of given GeoJSON polygon
 */
function centroidPolygon(geom) {
	var centroid = [0, 0];
	
	for(var i in geom.coordinates[0]) {
		if(i < geom.coordinates[0].length - 1) {
			centroid[0] += geom.coordinates[0][i][0];
			centroid[1] += geom.coordinates[0][i][1];
		}
	}
	
	centroid[0] = centroid[0] / (geom.coordinates[0].length -1);
	centroid[1] = centroid[1] / (geom.coordinates[0].length -1);
	
	return centroid;
}

/**
 * @return The centroid of given GeoJSON linestring
 */
function centroidLineString(geom) {
	var centroid = [0, 0];
	
	for(var i in geom.coordinates) {
		if(i < geom.coordinates.length) {
			centroid[0] += geom.coordinates[i][0];
			centroid[1] += geom.coordinates[i][1];
		}
	}
	
	centroid[0] = centroid[0] / (geom.coordinates.length);
	centroid[1] = centroid[1] / (geom.coordinates.length);
	
	return centroid;
}

/**
 * Adds the default dimension unit if undefined in OSM tag
 * @param v The tag value
 * @return The dimension with unit
 */
function addDimensionUnit(v) {
	if(!isNaN(Number.parseInt(v.substr(-1)))) {
		v+="m";
	}
	return v;
}

/**
 * @return An understandable value for OSM direction tag
 */
function orientationValue(v) {
	//Is the orientation a number value or not ?
	var vInt = Number.parseInt(v);
	if(isNaN(vInt)) {
		var txtVals = {
			N: "North", NNE: "North North-east", NE:"North-east", ENE: "East North-east",
			E: "East", ESE: "East South-east", SE: "South-east", SSE: "South South-east",
			S: "South", SSW: "South South-west", SW: "South-west", WSW:"West South-west",
			W: "West", WNW: "West North-west", NW: "North-west", NNW: "North North-west",
			north: "North", south: "South", east: "East", west: "West"
		};
		var vOk = txtVals[v];
		v = (vOk == undefined) ? "Invalid value ("+v+")" : vOk;
	}
	else {
		//Define a simple direction
		if((vInt >= 337 && vInt < 360) || (vInt >= 0 && vInt < 22)) {
			v = "North";
		}
		else if(vInt >= 22 && vInt < 67) {
			v = "North-east";
		}
		else if(vInt >= 67 && vInt < 112) {
			v = "East";
		}
		else if(vInt >= 112 && vInt < 157) {
			v = "South-east";
		}
		else if(vInt >= 157 && vInt < 202) {
			v = "South";
		}
		else if(vInt >= 202 && vInt < 247) {
			v = "South-west";
		}
		else if(vInt >= 247 && vInt < 292) {
			v = "West";
		}
		else if(vInt >= 292 && vInt < 337) {
			v = "North-west";
		}
		else {
			v = "Invalid direction ("+vInt+")";
		}
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
	return '<a href="'+v+'">Link</a>';
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
	var r = new Array();
	
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
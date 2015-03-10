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
 * @return The centroid of given GeoJSON polygon
 */
function centroidPolygon(geom) {
	var centroid = [0, 0];
	var first = true;
	
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

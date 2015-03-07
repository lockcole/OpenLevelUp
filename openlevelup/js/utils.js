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
 * Parses levels list.
 * @param str The levels as a string (for example "1;5", "1-3" or "-1--6")
 * @return The parsed levels as an array, or null if invalid
 */
function parseLevels(str) {
	var result = null;
	
	//Level values separated by ';'
	var regex1 = /^-?\d+(?:\.\d+)?(?:;-?\d+(?:\.\d+)?)*$/;
	if(regex1.test(str)) {
		result = str.split(';');
	}
	else {
		//Level values (only integers) in an interval, bounded with '-'
		var regex2 = /^(-?\d+)-(-?\d+)$/;
		var regex2result = regex2.exec(str);
		if(regex2result != null) {
			var min = parseInt(regex2result[1]);
			var max = parseInt(regex2result[2]);
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
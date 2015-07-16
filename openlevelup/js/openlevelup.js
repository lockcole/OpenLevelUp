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
 * Application init
 */

//Global conf (cache enabled)
$.ajaxSetup({ cache: true });

//Load JSON style file
var STYLE;
$.ajax({
	url: 'style.json',
       async: false,
       dataType: 'json',
       success: function(data) { STYLE = data; }
});

//Load PolygonFeatures file
var POLYGON_FEATURES;
$.ajax({
	url: 'polygon_features.json',
       async: false,
       dataType: 'json',
       success: function(data) { POLYGON_FEATURES = data; }
});

//Application core handler
OLvlUp = function() {};

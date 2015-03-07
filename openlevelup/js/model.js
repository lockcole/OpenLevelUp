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
 * Model JS classes
 */

OLvlUp.model = {

// ======= CLASSES =======
/**
 * Class MapData, model of the application (as defined in MVC pattern).
 * It allows to manage and process OSM and GeoJSON data.
 */
MapData: function(ctrl) {
//ATTRIBUTES
	/** Levels array, ordered **/
	var _levels = null;
	
	/** Data as GeoJSON **/
	var _geojson = null;
	
	/** Cluster data as GeoJSON **/
	var _geojsonCluster = null;
	
	/** Bounding box for current data **/
	var _bbox = null;
	
	/** Bounding box for cluster data **/
	var _bboxCluster = null;
	
	/** Does the cluster contain legacy data ? **/
	var _legacyCluster = false;
	
	/** The application controller **/
	var _ctrl = ctrl;
	
	/** The current object **/
	var _self = this;
	
//ACCESSORS
	/**
	 * @return The data, as GeoJSON
	 */
	this.getData = function() {
		return _geojson;
	}
	
	/**
	 * @return True if the cluster contains legacy data
	 */
	this.isClusterLegacy = function() {
		return _legacyCluster;
	}
	
	/**
	 * @return The cluster data, as GeoJSON
	 */
	this.getClusterData = function() {
		return _geojsonCluster;
	}
	
	/**
	 * @return The bounding box (see LatLngBounds in Leaflet API)
	 */
	this.getBBox = function() {
		return _bbox;
	}
	
	/**
	 * @return The bounding box for cluster data (see LatLngBounds in Leaflet API)
	 */
	this.getClusterBBox = function() {
		return _bboxCluster;
	}
	
	/**
	 * @return The data, as GeoJSON
	 */
	this.getLevels = function() {
		return _levels;
	}
	
//MODIFIERS
	/**
	 * Changes the data bounding box.
	 * @param bbox The new bounding box
	 */
	this.setBBox = function(bbox) {
		_bbox = bbox;
	}
	
	/**
	 * Changes the cluster data bounding box.
	 * @param bbox The new bounding box
	 */
	this.setClusterBBox = function(bbox) {
		_bboxCluster = bbox;
	}
	
	/**
	 * Sets if the current cluster data contains legacy objects
	 * @param l True if legacy
	 */
	this.setClusterLegacy = function(l) {
		_legacyCluster = l;
	}
	
	/**
	 * This functions deletes all information related to data (but not cluster data).
	 */
	this.cleanData = function() {
		_geojson = null;
		_bbox = null;
	}
	
	/**
	 * This functions deletes all information related to cluster data.
	 */
	this.cleanClusterData = function() {
		_geojsonCluster = null;
		_bboxCluster = null;
	}
	
//OTHER METHODS
/*
 * Data update methods
 */
	/**
	 * Handles OAPI response.
	 * @param data The OAPI data
	 */
	this.handleOapiResponse = function(data) {
		//Parse data
		_geojson = _parseOsmData(data);
		
		//Retrieve level informations
		var levelsSet = new Set();
		for(var i in _geojson.features) {
			var feature = _geojson.features[i];
			
			//Parse level value (could be an integer, a float, a list of those, ...)
			if(feature.properties['tags']['level'] != undefined) {
				//Separate different values
				var currentLevel = parseLevels(feature.properties['tags']['level']);
				
				//Add each value in list
				if(currentLevel != null) {
					for(var i=0; i < currentLevel.length; i++) {
						if(isFloat(currentLevel[i])) {
							levelsSet.add(parseFloat(currentLevel[i]));
						}
					}
				} else {
					console.log("Invalid level: "+feature.properties['tags']['level']);
				}
			}
			
			//Edit indoor areas to set them as polygons instead of linestrings
			if(((feature.properties.tags.indoor != undefined
				&& feature.properties.tags.indoor != "yes")
				|| feature.properties.tags.buildingpart != undefined
				|| feature.properties.tags.highway == "elevator")
				&& feature.geometry.type == "LineString") {
				
				feature = _convertLineToPolygon(feature);
			}
		}
		
		//Transform level set into a sorted array
		try {
			_levels = Array.from(levelsSet.values());
		}
		catch(error) {
			//An error is possible if browser doesn't support Set.values()
			_levels = _legacyProcessLevels();
		}
		_levels.sort(function (a,b) { return a-b;});
		
		//Call this method to notify controller that download is done
		_ctrl.endMapUpdate();
	}
	
	/**
	 * Handles OAPI response for cluster data.
	 * @param data The OAPI data
	 */
	this.handleOapiClusterResponse = function(data) {
		//Parse data
		_geojsonCluster = _parseOsmData(data);
		
		//Call this method to notify controller that download is done
		_ctrl.endMapClusterUpdate();
	}

/*
 * Data processing methods
 */
	/**
	* Parses raw OSM XML data, and return result.
	* @param data The OSM XML data.
	* @return The OSM parsed data (GeoJSON)
	*/
	function _parseOsmData(data) {
		//Convert XML to GeoJSON
		data = data || "<osm></osm>";
		try {
			data = $.parseXML(data);
		} catch(e) {
			data = JSON.parse(data);
		}
		return osmtogeojson(data);
	}
	
	/**
	 * This function parses levels values from GeoJSON.
	 * @deprecated Created only because of the lack of support of Set, to delete when it will be wide supported.
	 * @return The parsed levels as an array (unsorted)
	 */
	function _legacyProcessLevels() {
		levelsAsArray = new Array();
		for(var i in _geojson.features) {
			var feature = _geojson.features[i];
			
			//Parse level value (could be an integer, a float, a list of those, ...)
			if(feature.properties['tags']['level'] != undefined) {
				//Separate different values
				var currentLevel = parseLevels(feature.properties['tags']['level']);
				
				//Add each value in list
				if(currentLevel != null) {
					for(var i=0; i < currentLevel.length; i++) {
						if(isFloat(currentLevel[i])) {
							var lvl = parseFloat(currentLevel[i]);
							if(levelsAsArray.indexOf(lvl) < 0) {
								levelsAsArray[levelsAsArray.length] = lvl;
							}
						}
					}
				} else {
					console.log("Invalid level: "+feature.properties['tags']['level']);
				}
			}
		}
		return levelsAsArray;
	}
	
	/**
	 * Converts a GeoJSON LineString into a GeoJSON polygon.
	 * @param f The GeoJSON linestring
	 * @return The corresponding polygon
	 */
	function _convertLineToPolygon(f) {
		f.geometry.type = "Polygon";
		f.geometry.coordinates = [ f.geometry.coordinates ];
		return f;
	}
}

};

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
	
	/** The names of all rooms in data **/
	var _roomNames = null;
	
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
	};
	
	/**
	 * @return True if the cluster contains legacy data
	 */
	this.isClusterLegacy = function() {
		return _legacyCluster;
	};
	
	/**
	 * @return The cluster data, as GeoJSON
	 */
	this.getClusterData = function() {
		return _geojsonCluster;
	};
	
	/**
	 * @return The bounding box (see LatLngBounds in Leaflet API)
	 */
	this.getBBox = function() {
		return _bbox;
	};
	
	/**
	 * @return The bounding box for cluster data (see LatLngBounds in Leaflet API)
	 */
	this.getClusterBBox = function() {
		return _bboxCluster;
	};
	
	/**
	 * @return The levels, as an array
	 */
	this.getLevels = function() {
		return _levels;
	};
	
	/**
	 * @return The room names, as an object[level][roomName] = featureGeometry
	 */
	this.getRoomNames = function() {
		return _roomNames;
	};
	
//MODIFIERS
	/**
	 * Changes the data bounding box.
	 * @param bbox The new bounding box
	 */
	this.setBBox = function(bbox) {
		_bbox = bbox;
	};
	
	/**
	 * Changes the cluster data bounding box.
	 * @param bbox The new bounding box
	 */
	this.setClusterBBox = function(bbox) {
		_bboxCluster = bbox;
	};
	
	/**
	 * Sets if the current cluster data contains legacy objects
	 * @param l True if legacy
	 */
	this.setClusterLegacy = function(l) {
		_legacyCluster = l;
	};
	
	/**
	 * This functions deletes all information related to data (but not cluster data).
	 */
	this.cleanData = function() {
		_geojson = null;
		_bbox = null;
		_roomNames = null;
		_levels = null;
	};
	
	/**
	 * This functions deletes all information related to cluster data.
	 */
	this.cleanClusterData = function() {
		_geojsonCluster = null;
		_bboxCluster = null;
	};
	
//OTHER METHODS
/*
 * Data update methods
 */
	/**
	 * Handles OAPI response.
	 * @param data The OAPI data
	 */
	this.handleOapiResponse = function(data) {
		_ctrl.getView().addLoadingInfo("Process received data");
		
		//Parse data
		_geojson = _parseOsmData(data);
		
		//Create _roomNames object
		_roomNames = new Object();
		
		//Retrieve level informations
		var levelsSet = new Set();
		for(var i in _geojson.features) {
			var feature = _geojson.features[i];
			
			//try to find levels for this feature
			var currentLevel = null;
			
			//Tag level
			if(feature.properties.tags.level != undefined) {
				currentLevel = parseLevelsStr(feature.properties.tags.level);
			}
			//Tag repeat_on
			else if(feature.properties.tags.repeat_on != undefined) {
				currentLevel = parseLevelsStr(feature.properties.tags.repeat_on);
			}
			//Tag min_level and max_level
			else if(feature.properties.tags.min_level != undefined && feature.properties.tags.max_level != undefined) {
				currentLevel = parseLevelsStr(feature.properties.tags.min_level+"-"+feature.properties.tags.max_level);
			}
			//Tag buildingpart:verticalpassage:floorrange
			else if(feature.properties.tags["buildingpart:verticalpassage:floorrange"] != undefined) {
				currentLevel = parseLevelsStr(feature.properties.tags["buildingpart:verticalpassage:floorrange"]);
			}
			//Relations type=level
			else if(feature.properties.relations != undefined && feature.properties.relations.length > 0) {
				currentLevel = new Array();
				
				//Try to find type=level relations, and add level value in level array
				for(var i in feature.properties.relations) {
					var rel = feature.properties.relations[i];
					if(rel.reltags.type == "level" && rel.reltags.level != undefined) {
						var relLevel = parseLevelsStr(rel.reltags.level);
						
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
			
			//Add each level value in list, and create levels property in feature
			if(currentLevel != null) {
				for(var i=0; i < currentLevel.length; i++) {
					if(isFloat(currentLevel[i])) {
						levelsSet.add(parseFloat(currentLevel[i]));
					}
				}
				feature.properties.levels = currentLevel;
				feature.properties.levels.sort(function(a,b) { return parseFloat(a) - parseFloat(b); });
				_addName(feature);
			} else {
				//console.log("No valid level found for "+feature.properties.type+" "+feature.properties.id);
			}
			
			//Edit indoor areas to set them as polygons instead of linestrings
			if(((feature.properties.tags.indoor != undefined
				&& feature.properties.tags.indoor != "yes"
				&& feature.properties.tags.indoor != "wall")
				|| (feature.properties.tags.buildingpart != undefined
				&& feature.properties.tags.buildingpart != "wall")
				|| feature.properties.tags.highway == "elevator"
				|| feature.properties.tags.room != undefined)
				&& feature.geometry.type == "LineString") {
				
				feature = _convertLineToPolygon(feature);
			}
			
			//Edit some polygons that should be linestrings
			if(feature.properties.tags.barrier != undefined
				&& feature.geometry.type == "Polygon") {
				
				feature = _convertPolygonToLine(feature);
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
		
		//Reset room names if no levels found
		if(Object.keys(_roomNames).length == 0) {
			_roomNames = null;
		}
		
		//Call this method to notify controller that download is done
		_ctrl.endMapUpdate();
	};
	
	/**
	 * Handles OAPI response for cluster data.
	 * @param data The OAPI data
	 */
	this.handleOapiClusterResponse = function(data) {
		_ctrl.getView().addLoadingInfo("Process received data");
		
		//Parse data
		_geojsonCluster = _parseOsmData(data);
		
		//Call this method to notify controller that download is done
		_ctrl.endMapClusterUpdate();
	};
	
	/**
	 * Adds a feature in _roomNames
	 * @param feature The feature name
	 */
	function _addName(feature) {
		//Look if the feature has a name
		if(feature.properties.tags.name != undefined) {
			name = feature.properties.tags.name;
			//Add object for each level
			for(var i in feature.properties.levels) {
				//Check if _roomNames as already an array for the given level
				if(_roomNames[feature.properties.levels[i]] == undefined) {
					_roomNames[feature.properties.levels[i]] = new Object();
				}
				
				//Add this feature
				_roomNames[feature.properties.levels[i]][name] = feature;
			}
		}
	};

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
			
			//Add each value in list
			if(feature.properties.levels != null) {
				for(var i=0; i < feature.properties.levels.length; i++) {
					if(isFloat(feature.properties.levels[i])) {
						var lvl = parseFloat(feature.properties.levels[i]);
						if(levelsAsArray.indexOf(lvl) < 0) {
							levelsAsArray[levelsAsArray.length] = lvl;
						}
					}
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
	
	/**
	 * Converts a GeoJSON Polygon into a GeoJSON LineString.
	 * @param f The GeoJSON polygon
	 * @return The corresponding linestring
	 */
	function _convertPolygonToLine(f) {
		f.geometry.type = "LineString";
		f.geometry.coordinates = f.geometry.coordinates[0];
		return f;
	}
},

/**
 * This class represents a feature style, defined from JSON rules
 */
FeatureStyle: function(feature, jsonStyle) {
//ATTRIBUTES
	/** The feature tags **/
	var _tags = feature.properties.tags;
	
	/** The style **/
	var _style = new Object();
	
	/** The feature icon **/
	var _icon = undefined;
	
	/** The current object **/
	var _self = this;

//CONSTRUCTOR
	var name = "Object";
	
	//Find potential styles depending on tags
	for(var i in jsonStyle.styles) {
		var style = jsonStyle.styles[i];
		
		//If applyable, we update the result style
		if(_isStyleApplyable(feature, style)) {
			name = style.name;
			for(var param in style.style) {
				_style[param] = style.style[param];
			}
		}
	}
	
	//Change icon=no into undefined
	if(_style.icon == "no") { _style.icon = undefined; }
	
	feature.properties.name = name;
//--CONSTRUCTOR

//ACCESSORS
	/**
	 * @return The style which is applyable on the feature
	 */
	this.getStyle = function() {
		return _style;
	};

	/**
	 * Get the complete icon name, in particular when style contains a tag variable.
	 * @return The icon URL
	 */
	this.getIconUrl = function() {
		if(_icon == undefined) {
			_icon = _style.icon;
			
			var regex = /\$\{(\w+)\}/;
			if(regex.test(_icon)) {
				//Replace tag name with actual tag value
				var tagName = regex.exec(_icon)[1];
				_icon = _icon.replace(regex, _tags[tagName]);
				
				//Check if icon file exists (to avoid exotic values)
				if(jsonStyle.images.indexOf(_icon) < 0) {
					_icon = null;
				}
			}
		}
		
		return _icon;
	};

//OTHER METHODS
	/**
	 * Checks if a given style is applyable on a given feature
	 * @param feature The feature to test
	 * @param style The JSON style to test
	 * @return True if the style is applyable
	 */
	function _isStyleApplyable(feature, style) {
		var applyable = false;
		
		for(var j in style.onTags) {
			var tagList = style.onTags[j];
			applyable = true;
			for(var key in tagList) {
				var val = tagList[key];
				var featureVal = feature.properties.tags[key];
				
				//If this rule is not applyable, stop
				if(featureVal == undefined
					|| (val != "*" && val != featureVal && val.split("|").indexOf(featureVal) < 0)) {
					
					applyable = false;
					break;
				}
			}
			//If style still applyable after looking for all tags in a taglist, then it's applyable
			if(applyable) { break; }
		}
		
		return applyable;
	}
}
};

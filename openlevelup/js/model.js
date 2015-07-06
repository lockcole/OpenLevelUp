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
 * The OSM global data container.
 * It contains the parsed object from Overpass call.
 */
OSMData: function(bbox, styleDef) {
//ATTRIBUTES
	/** The feature objects **/
	var _features = null;
	
	/** The available levels **/
	var _levels = [];
	
	/** The bounding box of the data **/
	var _bbox = bbox;
	
	/** The names of objects, by level **/
	var _names = new Object();

//CONSTRUCTOR
	/**
	 * Class constructor, initializes this object with received data.
	 */
	this.init = function(data) {
		//Parse OSM data
		var geojson = parseOsmData(data);
		
		//Create features
		_features = new Object();

		for(var i in geojson.features) {
			var f = geojson.features[i];
			var id = f.id;
			var currentFeature = new OLvlUp.model.Feature(f, styleDef);
			
			if(_features[id] == undefined) {
				_features[id] = currentFeature;
			}
//			else {
//				console.log("Duplicate: "+id);
//				console.log(currentFeature.getTags());
//			}
			
			//Add levels to list
			var ftLevels = currentFeature.onLevels();
			_levels = mergeArrays(_levels, ftLevels);
			
			//Add name to list
			var name = currentFeature.getTag("name");
			if(name != undefined) {
				for(var lvlId in ftLevels) {
					var lvl = ftLevels[lvlId];
					
					//Create given level in names if needed
					if(_names[lvl] == undefined) {
						_names[lvl] = new Array();
					}
					
					_names[lvl][name] = currentFeature;
				}
			}
		}
		
		_levels.sort(function (a,b) { return a-b;});
	};

//ACCESSORS
	/**
	 * @return The data bounding box
	 */
	this.getBBox = function() {
		return _bbox;
	};
	
	/**
	 * @return True if the object was initialized
	 */
	this.isInitialized = function() {
		return _features != null;
	};
	
	/**
	 * @return The levels contained in data
	 */
	this.getLevels = function() {
		return _levels;
	};
	
	/**
	 * @return The read names
	 */
	this.getNames = function() {
		return _names;
	};
	
	/**
	 * @param id The feature OSM ID
	 * @return The feature object
	 */
	this.getFeature = function(id) {
		return _features[id];
	};
	
	/**
	 * @return The features as an array
	 */
	this.getFeatures = function() {
		return _features;
	};
},



/**
 * The OSM cluster data container.
 * It contains the parsed object from Overpass call.
 */
OSMClusterData: function(bbox) {
	//ATTRIBUTES
	/** The feature objects **/
	var _data = null;

	/** The bounding box of the data **/
	var _bbox = bbox;
	
//CONSTRUCTOR
	/**
	 * Class constructor, initializes this object with received data.
	 */
	this.init = function(data) {
		//Parse OSM data
		_data = parseOsmData(data);
	};

//ACCESSORS
	/**
	 * @return The OSM cluster data
	 */
	this.get = function() {
		return _data;
	};
	
	/**
	 * @return The data bounding box
	 */
	this.getBBox = function() {
		return _bbox;
	};
	
	/**
	 * @return True if the object was initialized
	 */
	this.isInitialized = function() {
		return _data != null;
	};
},



/**
 * A feature is a geolocated object with properties, style, geometry, ...
 */
Feature: function(f, styleDef) {
//ATTRIBUTES
	/** The human readable name of the object **/
	var _name = null;

	/** The OSM ID (for example "node/123456") **/
	var _id = f.id;
	
	/** The levels in which this object is present **/
	var _onLevels = null;
	
	/** The OSM object tags **/
	var _tags = null;
	
	/** The feature geometry **/
	var _geometry = null;
	
	/** The feature style **/
	var _style = null;
	
	/** The feature images (if any) **/
	var _images = undefined;
	
	/** This object **/
	var _self = this;
	
//CONSTRUCTOR
	/**
	 * Class constructor
	 * @param feature The OSM feature
	 */
	function _init(feature) {
		/*
		 * Init some vars
		 */
		_tags = feature.properties.tags;
		_style = new OLvlUp.model.FeatureStyle(_self, styleDef);
		_geometry = new OLvlUp.model.FeatureGeometry(feature.geometry);
		
		/*
		 * Find a name for this object
		 */
		if(_tags.name != undefined) {
			_name = _tags.name;
		}
		else if(_tags.ref != undefined) {
			_name = _tags.ref;
		}
		else {
			_name = _style.getName();
		}
		
		/*
		 * Parse levels
		 */
		//try to find levels for this feature
		var currentLevel = null;
		var relations = feature.properties.relations;
		
		//Tag level
		if(_tags.level != undefined) {
			currentLevel = parseLevelsFloat(_tags.level);
		}
		//Tag repeat_on
		else if(_tags.repeat_on != undefined) {
			currentLevel = parseLevelsFloat(_tags.repeat_on);
		}
		//Tag min_level and max_level
		else if(_tags.min_level != undefined && _tags.max_level != undefined) {
			currentLevel = parseLevelsFloat(_tags.min_level+"-"+_tags.max_level);
		}
		//Tag buildingpart:verticalpassage:floorrange
		else if(_tags["buildingpart:verticalpassage:floorrange"] != undefined) {
			currentLevel = parseLevelsFloat(_tags["buildingpart:verticalpassage:floorrange"]);
		}
		//Relations type=level
		else if(relations != undefined && relations.length > 0) {
			currentLevel = new Array();
			
			//Try to find type=level relations, and add level value in level array
			for(var i in relations) {
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
			currentLevel.sort(function(a,b) { return a - b; });
			_onLevels = currentLevel;
		} else {
			//console.log("No valid level found for "+_id);
			_onLevels = [];
		}
		
		/*
		 * Check if the feature could have images
		 */
		_images = (_self.hasImages()) ? new OLvlUp.model.FeatureImages(_self) : null;
		
		/*
		 * Change geometry type if needed
		 */
		//Edit indoor areas to set them as polygons instead of linestrings
		if(_geometry.getType() == "LineString" && (
			(_tags.indoor != undefined && _tags.indoor != "yes" && _tags.indoor != "wall")
			|| (_tags.buildingpart != undefined && _tags.buildingpart != "wall")
			|| _tags.highway == "elevator"
			|| _tags.room != undefined
		)) {
			_geometry.convertToPolygon();
		}
			
		//Edit some polygons that should be linestrings
		if(_geometry.getType() == "Polygon" && (
			_tags.barrier != undefined
		)) {
			_geometry.convertToLine();
		}
	};

//ACCESSORS
	/**
	 * @return The human readable name
	 */
	this.getName = function() {
		return _name;
	};
	
	/**
	 * @return The OSM Id
	 */
	this.getId = function() {
		return _id;
	};
	
	/**
	 * @return True if the feature has related images
	 */
	this.hasImages = function() {
		return (_images == undefined && (_tags.image != undefined || _tags.mapillary != undefined)) || (_images != undefined && _images != null);
	};
	
	/**
	 * @return The array of levels where the feature is available
	 */
	this.onLevels = function() {
		return _onLevels;
	};
	
	/**
	 * @param lvl The level to look for
	 * @return True if the feature is present in the given level
	 */
	this.isOnLevel = function(lvl) {
		return _onLevels.indexOf(lvl) != -1;
	};
	
	/**
	 * @return The OSM tags
	 */
	this.getTags = function() {
		return _tags;
	};
	
	/**
	 * @param key The OSM key
	 * @return The corresponding OSM value, or undefined if not found
	 */
	this.getTag = function(key) {
		return _tags[key];
	};
	
	/**
	 * @return The feature images object or null if no available images
	 */
	this.getImages = function() {
		return _images;
	};
	
	/**
	 * @return The feature style
	 */
	this.getStyle = function() {
		return _style;
	};
	
	/**
	 * @return The feature geometry
	 */
	this.getGeometry = function() {
		return _geometry;
	};
	
//INIT
	_init(f);
},



/**
 * This class handles a feature geometry, and allows to do some processing on it.
 */
FeatureGeometry: function(fGeometry) {
//ATTRIBUTES
	/** The feature geometry, in GeoJSON **/
	var _geom = fGeometry;
	
	/** The current object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The geometry in GeoJSON
	 */
	this.get = function() {
		return _geom;
	};
	
	/**
	 * @return The centroid, as [longitude, latitude]
	 */
	this.getCentroid = function() {
		var result = null;
		
		if(_geom.type == "Point") {
			result = _geom.coordinates;
		}
		else if(_geom.type == "LineString") {
			result = [0, 0];
			
			for(var i in _geom.coordinates) {
				if(i < _geom.coordinates.length) {
					result[0] += _geom.coordinates[i][0];
					result[1] += _geom.coordinates[i][1];
				}
			}
			
			result[0] = result[0] / (_geom.coordinates.length);
			result[1] = result[1] / (_geom.coordinates.length);
		}
		else if(_geom.type == "Polygon") {
			result = [0, 0];
			
			for(var i in _geom.coordinates[0]) {
				if(i < _geom.coordinates[0].length - 1) {
					result[0] += _geom.coordinates[0][i][0];
					result[1] += _geom.coordinates[0][i][1];
				}
			}
			
			result[0] = result[0] / (_geom.coordinates[0].length -1);
			result[1] = result[1] / (_geom.coordinates[0].length -1);
		}
		else {
			console.log("Unknown type: "+_geom.type);
		}
		
		return result;
	};
	
	/**
	 * Get this object centroid as a string
	 * @return "lat, lon"
	 */
	this.getCentroidAsString = function() {
		var c = _self.getCentroid();
		return c[1]+", "+c[0];
	};
	
	/**
	 * @return The geometry type (GeoJSON values)
	 */
	this.getType = function() {
		return _geom.type;
	};
	
	/**
	 * @return The geometry as leaflet format (LatLng)
	 */
	this.getLatLng = function() {
		var result = null;
		
		switch(_geom.type) {
			case "Point":
				result = L.latLng(_geom.coordinates[1], _geom.coordinates[0]);
				break;
				
			case "LineString":
				result = [];
				for(var i = 0; i < _geom.coordinates.length; i++) {
					var coords = _geom.coordinates[i];
					result[i] = L.latLng(coords[1], coords[0]);
				}
				break;
				
			case "Polygon":
				result = [];
				for(var i = 0; i < _geom.coordinates.length; i++) {
					result[i] = [];
					for(var j=0; j < _geom.coordinates[i].length; j++) {
						var coords = _geom.coordinates[i][j];
						result[i][j] = L.latLng(coords[1], coords[0]);
					}
				}
				break;
				
			case "MultiPolygon":
				result = [];
				for(var i = 0; i < _geom.coordinates.length; i++) {
					result[i] = [];
					for(var j=0; j < _geom.coordinates[i].length; j++) {
						result[i][j] = [];
						for(var k=0; k < _geom.coordinates[i][j]; k++) {
							var coords = _geom.coordinates[i][j][k];
							result[i][j][k] = L.latLng(coords[1], coords[0]);
						}
					}
				}
				break;
				
			default:
				console.log("Unknown type: "+_geom.type);
		}
		
		return result;
	};
	
	/**
	 * Returns the bounding box
	 * @return The bounding box
	 */
	this.getBounds = function() {
		var minlat, maxlat, minlon, maxlon;

		switch(_geom.type) {
			case "Point":
				minlat = _geom.coordinates[1];
				maxlat = _geom.coordinates[1];
				minlon = _geom.coordinates[0];
				maxlon = _geom.coordinates[0];
				break;
				
			case "LineString":
				minlat = _geom.coordinates[0][1];
				maxlat = _geom.coordinates[0][1];
				minlon = _geom.coordinates[0][0];
				maxlon = _geom.coordinates[0][0];
				
				for(var i = 1; i < _geom.coordinates.length; i++) {
					var coords = _geom.coordinates[i];
					if(coords[0] < minlon) { minlon = coords[0]; }
					else if(coords[0] > maxlon) { maxlon = coords[0]; }
					if(coords[1] < minlat) { minlat = coords[1]; }
					else if(coords[1] > maxlat) { maxlat = coords[1]; }
				}
				break;
				
			case "Polygon":
				minlat = _geom.coordinates[0][0][1];
				maxlat = _geom.coordinates[0][0][1];
				minlon = _geom.coordinates[0][0][0];
				maxlon = _geom.coordinates[0][0][0];
				
				for(var i = 0; i < _geom.coordinates.length; i++) {
					for(var j=0; j < _geom.coordinates[i].length; j++) {
						var coords = _geom.coordinates[i][j];
						if(coords[0] < minlon) { minlon = coords[0]; }
						else if(coords[0] > maxlon) { maxlon = coords[0]; }
						if(coords[1] < minlat) { minlat = coords[1]; }
						else if(coords[1] > maxlat) { maxlat = coords[1]; }
					}
				}
				break;
				
			case "MultiPolygon":
				minlat = _geom.coordinates[0][0][1];
				maxlat = _geom.coordinates[0][0][1];
				minlon = _geom.coordinates[0][0][0];
				maxlon = _geom.coordinates[0][0][0];
				
				for(var i = 0; i < _geom.coordinates.length; i++) {
					for(var j=0; j < _geom.coordinates[i].length; j++) {
						for(var k=0; k < _geom.coordinates[i][j]; k++) {
							var coords = _geom.coordinates[i][j][k];
							if(coords[0] < minlon) { minlon = coords[0]; }
							else if(coords[0] > maxlon) { maxlon = coords[0]; }
							if(coords[1] < minlat) { minlat = coords[1]; }
							else if(coords[1] > maxlat) { maxlat = coords[1]; }
						}
					}
				}
				break;
				
			default:
				console.log("Unknown type: "+_geom.type);
		}
		
		return L.latLngBounds(L.latLng(minlat, minlon), L.latLng(maxlat, maxlon));
	};

//MODIFIERS
	/**
	 * Converts this into a polygon.
	 */
	this.convertToPolygon = function() {
		if(_geom.type == "LineString") {
			_geom.type = "Polygon";
			_geom.coordinates = [ _geom.coordinates ];
		}
		else {
			console.log("Unhandled geometry change to polygon");
		}
	}
	
	/**
	 * Converts this into a LineString.
	 */
	this.convertToLine = function() {
		if(_geom.type == "Polygon") {
			_geom.type = "LineString";
			_geom.coordinates = _geom.coordinates[0];
		}
		else {
			console.log("Unhandled geometry change to linestring");
		}
	}
},



/**
 * This class represents a feature style, defined from JSON rules
 */
FeatureStyle: function(feature, jsonStyle) {
//ATTRIBUTES
	/** The feature tags **/
	var _tags = feature.getTags();
	
	/** The style **/
	var _style = new Object();
	
	/** The feature icon **/
	var _icon = undefined;
	
	/** The style name **/
	var _name = "Object";
	
	/** The current object **/
	var _self = this;

//CONSTRUCTOR

	//Find potential styles depending on tags
	for(var i in jsonStyle.styles) {
		var style = jsonStyle.styles[i];
		
		//If applyable, we update the result style
		if(_isStyleApplyable(feature, style)) {
			_name = style.name;
			for(var param in style.style) {
				_style[param] = style.style[param];
			}
		}
	}
	
	//Change icon=no into undefined
	if(_style.icon == "no") { _style.icon = undefined; }
//--CONSTRUCTOR

//ACCESSORS
	/**
	 * @return The style which is applyable on the feature
	 */
	this.get = function() {
		return _style;
	};
	
	/**
	 * @return True if this style has an associated icon
	 */
	this.hasIcon = function() {
		return _icon != undefined;
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
	
	/**
	 * @return The style name
	 */
	this.getName = function() {
		return _name;
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
				var featureVal = feature.getTag(key);
				
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
},



/**
 * FeatureImages represents the picture related to a given feature
 * They can be from various sources (Web URL, Mapillary, Flickr, ...)
 */
FeatureImages: function(feature) {
//ATTRIBUTES
	/** The image from image=* tag **/
	var _img = null;
	
	/** The image from mapillary=* tag **/
	var _mapillary = feature.getTag("mapillary");

//CONSTRUCTOR
	function _init() {
		var imageTag = feature.getTag("image");
		if(imageTag != undefined) {
			_img = _parseImageTag(imageTag);
		}
	};

//ACCESSORS
	/**
	 * @return All the simple pictures (as an array)
	 */
	this.get = function() {
		var result = [];
		
		if(_img != null) {
			result.push({
				url: _img,
				source: "Web",
				tag: "image = "+feature.getTag("image")
			});
		}
		
		if(_mapillary != undefined) {
			result.push({
				url: 'https://d1cuyjsrcm0gby.cloudfront.net/'+_mapillary+'/thumb-2048.jpg',
				source: "Mapillary",
				tag: "mapillary = "+_mapillary
			});
		}

		return result;
	};

//OTHER METHODS
	function _parseImageTag(image) {
		var result = null;
		
		var regexUrl = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
		var regexUrlNoProtocol = /^(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
		var regexWiki = /^(File):.+$/;
		
		if(image.match(regexUrl)) {
			result = image;
		}
		else if(image.match(regexUrlNoProtocol) && !image.match(regexWiki)) {
			result = 'http://'+image;
		}
		else if(image.match(regexWiki)) {
			var file = image.substring(5);
			var imageUtf8 = file.replace(/ /g, '_');
			var digest = md5(imageUtf8);
			var folder = digest[0] + '/' + digest[0] + digest[1] + '/' + encodeURIComponent(imageUtf8);
			result = 'http://upload.wikimedia.org/wikipedia/commons/' + folder;
		}
		else {
			console.log("Invalid image key: "+image);
		}
		
		return result;
	};

//INIT
	_init();
}

};

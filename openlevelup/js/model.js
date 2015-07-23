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

/**
 * The OSM global data container.
 * It contains the parsed object from Overpass call.
 */
var OSMData = function(bbox, styleDef) {
//ATTRIBUTES
	/** The feature objects **/
	this._features = null;
	
	/** The available levels **/
	this._levels = [];
	
	/** The bounding box of the data **/
	this._bbox = bbox;
	
	/** The names of objects, by level **/
	this._names = new Object();
};

//CONSTRUCTOR
	/**
	 * Class constructor, initializes this object with received data.
	 */
	OSMData.prototype.init = function(data) {
		//Parse OSM data
		var geojson = parseOsmData(data);
		
		//Create features
		this._features = new Object();

		for(var i in geojson.features) {
			var f = geojson.features[i];
			var id = f.id;
			var currentFeature = new Feature(f, styleDef);
			
			if(this._features[id] == undefined) {
				this._features[id] = currentFeature;
			}
//			else {
//				console.log("Duplicate: "+id);
//				console.log(currentFeature.getTags());
//			}
			
			//Add levels to list
			var ftLevels = currentFeature.onLevels();
			this._levels = mergeArrays(this._levels, ftLevels);
			
			//Add name to list
			var name = currentFeature.getTag("name");
			if(name != undefined) {
				for(var lvlId in ftLevels) {
					var lvl = ftLevels[lvlId];
					
					//Create given level in names if needed
					if(this._names[lvl] == undefined) {
						this._names[lvl] = new Array();
					}
					
					this._names[lvl][name] = currentFeature;
				}
			}
		}
		
		this._levels.sort(function (a,b) { return a-b;});
	};

//ACCESSORS
	/**
	 * @return The data bounding box
	 */
	OSMData.prototype.getBBox = function() {
		return this._bbox;
	};
	
	/**
	 * @return True if the object was initialized
	 */
	OSMData.prototype.isInitialized = function() {
		return this._features != null;
	};
	
	/**
	 * @return The levels contained in data
	 */
	OSMData.prototype.getLevels = function() {
		return this._levels;
	};
	
	/**
	 * @return The read names
	 */
	OSMData.prototype.getNames = function() {
		return this._names;
	};
	
	/**
	 * @param id The feature OSM ID
	 * @return The feature object
	 */
	OSMData.prototype.getFeature = function(id) {
		return this._features[id];
	};
	
	/**
	 * @return The features as an array
	 */
	OSMData.prototype.getFeatures = function() {
		return this._features;
	};
	
	/**
	 * @return The mapillary keys in data
	 */
	OSMData.prototype.getMapillaryKeys = function() {
		var keys = [];
		for(var ftId in this._features) {
			var feature = this._features[ftId];
			var mapillary = feature.getTag("mapillary");
			if(mapillary != undefined) {
				keys.push(mapillary);
			}
		}
		return keys;
	};



/**
 * The OSM cluster data container.
 * It contains the parsed object from Overpass call.
 */
var OSMClusterData = function(bbox) {
	//ATTRIBUTES
	/** The feature objects **/
	this._data = null;

	/** The bounding box of the data **/
	this._bbox = bbox;
};

//CONSTRUCTOR
	/**
	 * Class constructor, initializes this object with received data.
	 */
	OSMClusterData.prototype.init = function(data) {
		//Parse OSM data
		this._data = parseOsmData(data);
	};

//ACCESSORS
	/**
	 * @return The OSM cluster data
	 */
	OSMClusterData.prototype.get = function() {
		return this._data;
	};
	
	/**
	 * @return The data bounding box
	 */
	OSMClusterData.prototype.getBBox = function() {
		return this._bbox;
	};
	
	/**
	 * @return True if the object was initialized
	 */
	OSMClusterData.prototype.isInitialized = function() {
		return this._data != null;
	};



/**
 * A container for Mapillary images information
 */
var MapillaryData = function() {
//ATTRIBUTES
	/** The mapillary data, as key => data **/
	this._data = {};
};

//ACCESSORS
	/**
	 * Does it have the given image data ?
	 * @param key The image key
	 * @return True if got data
	 */
	MapillaryData.prototype.has = function(key) {
		return this._data[key] != undefined;
	};
	
	/**
	 * @param key The image key
	 * @return The image data
	 */
	MapillaryData.prototype.get = function(key) {
		return this._data[key];
	};
	
	/**
	 * Is the image spherical ?
	 * @param key The image key
	 * @return True if spherical
	 */
	MapillaryData.prototype.isSpherical = function(key) {
		return this._data[key].special_type == "pano";
	};
	
	/**
	 * @return the picture author
	 */
	MapillaryData.prototype.getAuthor = function(key) {
		return this._data[key].username;
	};
	
	/**
	 * @return The capture date (as Unix timestamp)
	 */
	MapillaryData.prototype.getDate = function(key) {
		return this._data[key].captured_at;
	};
	
//MODIFIERS
	/**
	 * Adds a new information set
	 * @param key The image key
	 * @param data The image data
	 */
	MapillaryData.prototype.add = function(key, data) {
		this._data[key] = data;
	};



/**
 * A feature is a geolocated object with properties, style, geometry, ...
 */
var Feature = function(f, styleDef) {
//ATTRIBUTES
	/** The human readable name of the object **/
	this._name = null;

	/** The OSM ID (for example "node/123456") **/
	this._id = f.id;
	
	/** The levels in which this object is present **/
	this._onLevels = null;
	
	/** The OSM object tags **/
	this._tags = null;
	
	/** The feature geometry **/
	this._geometry = null;
	
	/** The feature style **/
	this._style = null;
	
	/** The feature images (if any) **/
	this._images = undefined;
	
	/** The base feature **/
	this._feature = f;

//ACCESSORS
	/**
	 * @return True if the feature has related images
	 */
	this.hasImages = function() {
		return (this._images == undefined && (this._tags.image != undefined || this._tags.mapillary != undefined))
			|| (this._images != undefined && this._images != null && (this._images.hasValidImages() || this._images.hasValidSpherical()));
	};

//CONSTRUCTOR
	/*
	 * Init some vars
	 */
	this._tags = this._feature.properties.tags;
	this._style = new FeatureStyle(this, styleDef);
	this._geometry = new FeatureGeometry(this._feature.geometry);
	
	/*
	 * Find a name for this object
	 */
	if(this._tags.name != undefined) {
		this._name = this._tags.name;
	}
	else if(this._tags.ref != undefined) {
		this._name = this._tags.ref;
	}
	else {
		this._name = this._style.getName();
	}
	
	/*
	 * Parse levels
	 */
	//try to find levels for this feature
	var currentLevel = null;
	var relations = this._feature.properties.relations;
	
	//Tag level
	if(this._tags.level != undefined) {
		currentLevel = parseLevelsFloat(this._tags.level);
	}
	//Tag repeat_on
	else if(this._tags.repeat_on != undefined) {
		currentLevel = parseLevelsFloat(this._tags.repeat_on);
	}
	//Tag min_level and max_level
	else if(this._tags.min_level != undefined && this._tags.max_level != undefined) {
		currentLevel = parseLevelsFloat(this._tags.min_level+"-"+this._tags.max_level);
	}
	//Tag buildingpart:verticalpassage:floorrange
	else if(this._tags["buildingpart:verticalpassage:floorrange"] != undefined) {
		currentLevel = parseLevelsFloat(this._tags["buildingpart:verticalpassage:floorrange"]);
	}
	//Relations type=level
	else if(relations != undefined && relations.length > 0) {
		currentLevel = [];
		
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
		this._onLevels = currentLevel;
	} else {
		//console.log("No valid level found for "+_id);
		this._onLevels = [];
	}
	
	/*
	 * Check if the feature could have images
	 */
	this._images = (this.hasImages()) ? new FeatureImages(this) : null;
};

//ACCESSORS
	/**
	 * @return The human readable name
	 */
	Feature.prototype.getName = function() {
		return this._name;
	};
	
	/**
	 * @return The OSM Id
	 */
	Feature.prototype.getId = function() {
		return this._id;
	};
	
	/**
	 * @return The array of levels where the feature is available
	 */
	Feature.prototype.onLevels = function() {
		return this._onLevels;
	};
	
	/**
	 * @param lvl The level to look for
	 * @return True if the feature is present in the given level
	 */
	Feature.prototype.isOnLevel = function(lvl) {
		return this._onLevels.indexOf(lvl) != -1;
	};
	
	/**
	 * @return The OSM tags
	 */
	Feature.prototype.getTags = function() {
		return this._tags;
	};
	
	/**
	 * @param key The OSM key
	 * @return The corresponding OSM value, or undefined if not found
	 */
	Feature.prototype.getTag = function(key) {
		return this._tags[key];
	};
	
	/**
	 * @return The feature images object or null if no available images
	 */
	Feature.prototype.getImages = function() {
		if(this._images == null || this._images == undefined) {
			this._images = new FeatureImages(this);
		}
		return this._images;
	};
	
	/**
	 * @return The feature style
	 */
	Feature.prototype.getStyle = function() {
		return this._style;
	};
	
	/**
	 * @return The feature geometry
	 */
	Feature.prototype.getGeometry = function() {
		return this._geometry;
	};



/**
 * This class handles a feature geometry, and allows to do some processing on it.
 */
var FeatureGeometry = function(fGeometry) {
//ATTRIBUTES
	/** The feature geometry, in GeoJSON **/
	this._geom = fGeometry;
};

//ACCESSORS
	/**
	 * @return The geometry in GeoJSON
	 */
	FeatureGeometry.prototype.get = function() {
		return this._geom;
	};
	
	/**
	 * @return The centroid, as [longitude, latitude]
	 */
	FeatureGeometry.prototype.getCentroid = function() {
		var result = null;
		var type = this._geom.type;
		
		if(type == "Point") {
			result = this._geom.coordinates;
		}
		else if(type == "LineString") {
			result = [0, 0];
			
			for(var i in this._geom.coordinates) {
				if(i < this._geom.coordinates.length) {
					result[0] += this._geom.coordinates[i][0];
					result[1] += this._geom.coordinates[i][1];
				}
			}
			
			result[0] = result[0] / (this._geom.coordinates.length);
			result[1] = result[1] / (this._geom.coordinates.length);
		}
		else if(type == "Polygon") {
			result = [0, 0];
			
			for(var i in this._geom.coordinates[0]) {
				if(i < this._geom.coordinates[0].length - 1) {
					result[0] += this._geom.coordinates[0][i][0];
					result[1] += this._geom.coordinates[0][i][1];
				}
			}
			
			result[0] = result[0] / (this._geom.coordinates[0].length -1);
			result[1] = result[1] / (this._geom.coordinates[0].length -1);
		}
		else if(type == "MultiPolygon") {
			result = [0, 0];
			
			for(var i in this._geom.coordinates[0][0]) {
				if(i < this._geom.coordinates[0][0].length - 1) {
					result[0] += this._geom.coordinates[0][0][i][0];
					result[1] += this._geom.coordinates[0][0][i][1];
				}
			}
			
			result[0] = result[0] / (this._geom.coordinates[0][0].length -1);
			result[1] = result[1] / (this._geom.coordinates[0][0].length -1);
		}
		else {
			console.log("Unknown type: "+this._geom.type);
		}
		
		return result;
	};
	
	/**
	 * Get this object centroid as a string
	 * @return "lat, lon"
	 */
	FeatureGeometry.prototype.getCentroidAsString = function() {
		var c = this.getCentroid();
		return c[1]+", "+c[0];
	};
	
	/**
	 * @return The geometry type (GeoJSON values)
	 */
	FeatureGeometry.prototype.getType = function() {
		return this._geom.type;
	};
	
	/**
	 * @return The geometry as leaflet format (LatLng)
	 */
	FeatureGeometry.prototype.getLatLng = function() {
		var result = null;
		
		switch(this._geom.type) {
			case "Point":
				result = L.latLng(this._geom.coordinates[1], this._geom.coordinates[0]);
				break;
				
			case "LineString":
				result = [];
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					var coords = this._geom.coordinates[i];
					result[i] = L.latLng(coords[1], coords[0]);
				}
				break;
				
			case "Polygon":
				result = [];
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					result[i] = [];
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						var coords = this._geom.coordinates[i][j];
						result[i][j] = L.latLng(coords[1], coords[0]);
					}
				}
				break;
				
			case "MultiPolygon":
				result = [];
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					result[i] = [];
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						result[i][j] = [];
						for(var k=0; k < this._geom.coordinates[i][j]; k++) {
							var coords = this._geom.coordinates[i][j][k];
							result[i][j][k] = L.latLng(coords[1], coords[0]);
						}
					}
				}
				break;
				
			default:
				console.log("Unknown type: "+this._geom.type);
		}
		
		return result;
	};
	
	/**
	 * Returns the bounding box
	 * @return The bounding box
	 */
	FeatureGeometry.prototype.getBounds = function() {
		var minlat, maxlat, minlon, maxlon;

		switch(this._geom.type) {
			case "Point":
				minlat = this._geom.coordinates[1];
				maxlat = this._geom.coordinates[1];
				minlon = this._geom.coordinates[0];
				maxlon = this._geom.coordinates[0];
				break;
				
			case "LineString":
				minlat = this._geom.coordinates[0][1];
				maxlat = this._geom.coordinates[0][1];
				minlon = this._geom.coordinates[0][0];
				maxlon = this._geom.coordinates[0][0];
				
				for(var i = 1; i < this._geom.coordinates.length; i++) {
					var coords = this._geom.coordinates[i];
					if(coords[0] < minlon) { minlon = coords[0]; }
					else if(coords[0] > maxlon) { maxlon = coords[0]; }
					if(coords[1] < minlat) { minlat = coords[1]; }
					else if(coords[1] > maxlat) { maxlat = coords[1]; }
				}
				break;
				
			case "Polygon":
				minlat = this._geom.coordinates[0][0][1];
				maxlat = this._geom.coordinates[0][0][1];
				minlon = this._geom.coordinates[0][0][0];
				maxlon = this._geom.coordinates[0][0][0];
				
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						var coords = this._geom.coordinates[i][j];
						if(coords[0] < minlon) { minlon = coords[0]; }
						else if(coords[0] > maxlon) { maxlon = coords[0]; }
						if(coords[1] < minlat) { minlat = coords[1]; }
						else if(coords[1] > maxlat) { maxlat = coords[1]; }
					}
				}
				break;
				
			case "MultiPolygon":
				minlat = this._geom.coordinates[0][0][1];
				maxlat = this._geom.coordinates[0][0][1];
				minlon = this._geom.coordinates[0][0][0];
				maxlon = this._geom.coordinates[0][0][0];
				
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						for(var k=0; k < this._geom.coordinates[i][j]; k++) {
							var coords = this._geom.coordinates[i][j][k];
							if(coords[0] < minlon) { minlon = coords[0]; }
							else if(coords[0] > maxlon) { maxlon = coords[0]; }
							if(coords[1] < minlat) { minlat = coords[1]; }
							else if(coords[1] > maxlat) { maxlat = coords[1]; }
						}
					}
				}
				break;
				
			default:
				console.log("Unknown type: "+this._geom.type);
		}
		
		return L.latLngBounds(L.latLng(minlat, minlon), L.latLng(maxlat, maxlon));
	};



/**
 * This class represents a feature style, defined from JSON rules
 */
var FeatureStyle = function(feature, jsonStyle) {
//ATTRIBUTES
	/** The feature tags **/
	this._tags = feature.getTags();
	
	/** The style **/
	this._style = new Object();
	
	/** The feature icon **/
	this._icon = undefined;
	
	/** The style name **/
	this._name = "Object";
	
	/** The JSON style **/
	this._jsonStyle = jsonStyle;
	
	/** The feature **/
	this._feature = feature;

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
	
//CONSTRUCTOR
	//Find potential styles depending on tags
	for(var i in jsonStyle.styles) {
		var style = jsonStyle.styles[i];
		
		//If applyable, we update the result style
		if(_isStyleApplyable(feature, style)) {
			this._name = style.name;
			for(var param in style.style) {
				this._style[param] = style.style[param];
			}
		}
	}
	
	//Change icon=no into undefined
	if(this._style.icon == "no") { this._style.icon = undefined; }
};

//ACCESSORS
	/**
	 * @return The style which is applyable on the feature
	 */
	FeatureStyle.prototype.get = function() {
		return this._style;
	};
	
	/**
	 * @return True if this style has an associated icon
	 */
	FeatureStyle.prototype.hasIcon = function() {
		return this._icon != undefined;
	};

	/**
	 * Get the complete icon name, in particular when style contains a tag variable.
	 * @return The icon URL
	 */
	FeatureStyle.prototype.getIconUrl = function() {
		if(this._icon == undefined) {
			this._icon = this._style.icon;
			
			var regex = /\$\{(\w+)\}/;
			if(regex.test(this._icon)) {
				//Replace tag name with actual tag value
				var tagName = regex.exec(this._icon)[1];
				this._icon = this._icon.replace(regex, this._tags[tagName]);
				
				//Check if icon file exists (to avoid exotic values)
				if(this._jsonStyle.images.indexOf(this._icon) < 0) {
					this._icon = null;
				}
			}
		}
		
		return this._icon;
	};
	
	/**
	 * @return The style name
	 */
	FeatureStyle.prototype.getName = function() {
		return this._name;
	};



/**
 * FeatureImages represents the picture related to a given feature
 * They can be from various sources (Web URL, Mapillary, Flickr, ...)
 */
var FeatureImages = function(feature) {
//ATTRIBUTES
	/** The image from image=* tag **/
	this._img = undefined;
	
	/** The image from mapillary=* tag **/
	this._mapillary = feature.getTag("mapillary");
	
	/** The Flickr images **/
	this._flickr = [];
	
	/** The feature */
	this._feature = feature;

//OTHER METHODS
	function _parseImageTag(image) {
		var result = undefined;
		
		var regexUrl = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?\/[\w#!:.?+=&%@!\-\/]+\.(png|PNG|gif|GIF|jpg|JPG|jpeg|JPEG|bmp|BMP)$/;
		var regexUrlNoProtocol = /^(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?\/[\w#!:.?+=&%@!\-\/]+\.(png|PNG|gif|GIF|jpg|JPG|jpeg|JPEG|bmp|BMP)$/;
		var regexWiki = /^(File):.+\.(png|gif|jpg|jpeg|bmp)$/i;
		
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
			console.warn("[Images] Invalid key: "+image);
			result = null;
		}
		
		return result;
	};
	
//CONSTRUCTOR
	//function _init() {
		var imageTag = feature.getTag("image");
		if(imageTag != undefined) {
			this._img = _parseImageTag(imageTag);
		}
	//};
};

//ACCESSORS
	/**
	 * @return All the simple pictures (as an array)
	 */
	FeatureImages.prototype.get = function() {
		var result = [];
		
		if(this._img != null && this._img != undefined) {
			result.push({
				url: this._img,
				source: "Web",
				tag: "image = "+this._feature.getTag("image"),
				date: 0
			});
		}
		
		var mapillaryData = controller.getMapillaryData();
		if(
			this._mapillary != undefined
			&& mapillaryData.has(this._mapillary)
			&& !mapillaryData.isSpherical(this._mapillary)
		) {
			result.push({
				url: 'https://d1cuyjsrcm0gby.cloudfront.net/'+this._mapillary+'/thumb-2048.jpg',
				source: "Mapillary",
				tag: "mapillary = "+this._mapillary,
				author: mapillaryData.getAuthor(this._mapillary),
				date: mapillaryData.getDate(this._mapillary)
			});
		}
		
		if(this._flickr.length > 0) {
			result = mergeArrays(result, this._flickr);
		}
		
		result.sort(this._sortByDate);

		return result;
	};
	
	/**
	 * @return A spherical image of the feature or null if no one associated
	 */
	FeatureImages.prototype.getSpherical = function() {
		var result = null;
		
		var mapillaryData = controller.getMapillaryData();
		if(
			this._mapillary != undefined
			&& mapillaryData.has(this._mapillary)
			&& mapillaryData.isSpherical(this._mapillary)
		) {
			result = {
				url: 'https://d1cuyjsrcm0gby.cloudfront.net/'+this._mapillary+'/thumb-2048.jpg',
				source: "Mapillary",
				tag: "mapillary = "+this._mapillary,
				author: mapillaryData.getAuthor(this._mapillary),
				date: mapillaryData.getDate(this._mapillary)
			};
		}
		
		return result;
	};
	
	/**
	 * @return The images status as an object { source => status }
	 */
	FeatureImages.prototype.getStatus = function() {
		var status = {};
		
		//Web image
		if(this._img === null) {
			status.web = "bad";
		}
		else if(this._img === undefined) {
			status.web = "missing";
		}
		else {
			status.web = "ok";
		}
		
		//Mapillary
		var mapillaryData = controller.getMapillaryData();
		if(this._mapillary == undefined) {
			status.mapillary = "missing";
		}
		else if(mapillaryData.has(this._mapillary)) {
			status.mapillary = "ok";
		}
		else {
			status.mapillary = "bad";
		}
		
		//Flickr
		status.flickr = (this._flickr.length > 0) ? "ok" : "missing";
		
		return status;
	};
	
	/**
	 * @return True if it has at least one valid image
	 */
	FeatureImages.prototype.hasValidImages = function() {
		return this.get().length > 0;
	};
	
	/**
	 * @return True if it has a valid spherical image
	 */
	FeatureImages.prototype.hasValidSpherical = function() {
		return this.getSpherical() != null;
	};
	
	/**
	 * @return The amount of valid images
	 */
	FeatureImages.prototype.countImages = function() {
		var size = this.get().length;
		if(this.hasValidSpherical()) { size++; }
		return size;
	};

//MODIFIERS
	/**
	 * Adds a Flickr image to this object
	 * @param title The image title
	 * @param url The image URL
	 * @param date The capture timestamp
	 * @param author The picture author
	 */
	FeatureImages.prototype.addFlickrImage = function(title, url, date, author) {
		this._flickr.push({
			url: url,
			source: "Flickr",
			tag: title,
			author: author,
			date: date
		});
	};

//OTHER METHODS
	FeatureImages.prototype._sortByDate = function(a, b) {
		return b.date - a.date;
	};


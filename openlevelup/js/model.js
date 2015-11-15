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
 * Model JS classes
 */

/**
 * The OSM global data container.
 * It contains the parsed object from Overpass call.
 */
var OSMData = function(bbox, data) {
//ATTRIBUTES
	/** The feature objects **/
	this._features = null;
	
	/** The available levels **/
	this._levels = [];
	
	/** The bounding box of the data **/
	this._bbox = bbox;
	
	/** The names of objects, by level **/
	this._names = new Object();

//CONSTRUCTOR
	var timeStart = new Date().getTime();
	
	//Parse OSM data
	var geojson = parseOsmData(data);
	
	//Create features
	this._features = new Object();

	var id, f, i, currentFeature, ftLevels, lvlId, lvl;
	for(i=0; i < geojson.features.length; i++) {
		f = geojson.features[i];
		id = f.id;
		currentFeature = new Feature(f);
		
		if(this._features[id] == undefined) {
			this._features[id] = currentFeature;
			
			//Add levels to list
			ftLevels = currentFeature.onLevels();
			$.merge(this._levels, ftLevels);
			
			//Add name to list
			if(currentFeature.hasTag("name")) {
				for(var lvlId=0; lvlId < ftLevels.length; lvlId++) {
					lvl = ftLevels[lvlId];
					
					//Create given level in names if needed
					if(this._names[lvl] == undefined) {
						this._names[lvl] = [];
					}
					
					this._names[lvl][currentFeature.getTag("name")] = currentFeature;
				}
			}
		}
		// else {
			// console.log("Duplicate: "+id);
			// console.log(currentFeature.getTags());
		// }
	}
	
	//Sort and remove duplicates in levels array
	this._levels = this._levels.sort(sortNumberArray).filter(rmDuplicatesSortedArray);

	//Clear tmp objects
	geojson = null;
	id = null;
	f = null;
	i = null;
	currentFeature = null;
	ftLevels = null;
	lvlId = null;
	lvl = null;
	
	//console.log("[Time] Model parsing: "+((new Date().getTime()) - timeStart));
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
		var ftId, feature, i, k, ftTags, mapillaryVal;
		var mapillaryRegex = /^mapillary.*$/;
		var mapillaryValRegex = /^[\w\-]+$/;
		
		for(ftId in this._features) {
			feature = this._features[ftId];
			ftTags = feature.getTags();
			
			for(k in ftTags) {
				if(k.match(mapillaryRegex)) {
					mapillaryVal = ftTags[k];
					if(mapillaryVal.match(mapillaryValRegex)) {
						keys.push(mapillaryVal);
					}
					else {
						console.warn("[Mapillary] Invalid key: "+mapillaryVal+" for "+ftId);
					}
				}
			}
		}
		return keys.sort().filter(rmDuplicatesSortedArray);
	};



/**
 * The OSM cluster data container.
 * It contains the parsed object from Overpass call.
 */
var OSMClusterData = function(bbox, data) {
//ATTRIBUTES
	/** The feature objects **/
	this._data = parseOsmData(data);

	/** The bounding box of the data **/
	this._bbox = bbox;
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
	
	/**
	 * @return The capture angle (in degrees, North = 0°)
	 */
	MapillaryData.prototype.getAngle = function(key) {
		return this._data[key].ca;
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
 * The container for OSM notes
 */
var NotesData = function(d) {
//ATTRIBUTES
	this._notes = [];

//CONSTRUCTOR
	//Parse XML
	this.parse(d);
};

//ACCESSORS
	/**
	 * @return All the notes, as an array of objects
	 */
	NotesData.prototype.get = function() {
		return this._notes;
	};
	
//MODIFIERS
	/**
	 * Parses the given XML and adds extracted data
	 * @param xml The XML data
	 */
	NotesData.prototype.parse = function(xml) {
		var _self = this;
		$(xml).find('note').each(function() {
			//Create note
			var id = _self.add(
				$(this).find('id').text(),
				$(this).attr('lat'),
				$(this).attr('lon'),
				$(this).find('date_created').text(),
				$(this).find('status').text()
			);
			
			//Add comments
			$(this).find('comment').each(function() {
				_self.addComment(
					id,
					$(this).find('date').text(),
					$(this).find('uid').text(),
					$(this).find('user').text(),
					$(this).find('action').text(),
					$(this).find('text').text()
				);
			});
		});
	};
	
	/**
	 * Adds a new note in data
	 * @param id The note ID in OSM
	 * @param lat The latitude in WGS84
	 * @param lon The longitude in WGS84
	 * @param dateCreated The note creation date
	 * @param status The status in OSM
	 * @return The note ID in OpenLevelUp
	 */
	NotesData.prototype.add = function(id, lat, lon, dateCreated, status) {
		return this._notes.push({ id: id, lat: lat, lon: lon, date: dateCreated, status: status, comments: [] }) - 1;
	};
	
	/**
	 * Adds a new comment in a note
	 * @param id The note ID in OpenLevelUp
	 * @param date The comment date
	 * @param uid The user ID
	 * @param user The user name
	 * @param action The action done with this comment
	 * @param text The text of the comment
	 */
	NotesData.prototype.addComment = function(id, date, uid, user, action, text) {
		this._notes[id].comments.push({ date: date, uid: uid, user: user, action: action, text: text });
	};



/**
 * A feature is a geolocated object with properties, style, geometry, ...
 */
var Feature = function(f) {
//ATTRIBUTES
	/** The human readable name of the object **/
	this._name = null;

	/** The OSM ID (for example "node/123456") **/
	this._id = f.id;
	
	/** The levels in which this object is present **/
	this._onLevels = null;
	
	/** The OSM keys **/
	this._keys = null;
	
	/** The OSM object tags **/
	this._tags = f.properties.tags;
	
	/** The feature geometry **/
	this._geometry = null;
	
	/** The feature style **/
	this._style = null;
	
	/** The feature images (if any) **/
	this._images = undefined;

//CONSTRUCTOR
	/*
	 * Init some vars
	 */
	this._keys = Object.keys(this._tags);
	this._style = new FeatureStyle(this);
	this._geometry = new FeatureGeometry(f.geometry);
	
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
	var relations = f.properties.relations;
	
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
		this._onLevels = currentLevel;
	} else {
		//console.log("No valid level found for "+_id);
		this._onLevels = [];
	}
	
	/*
	 * Check if the feature could have images
	 */
	this._images = (this._tags.image != undefined || this._tags.mapillary != undefined) ? new FeatureImages(this) : null;
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
	 * @return True if the feature has related images
	 */
	Feature.prototype.hasImages = function() {
		return this._images != null && (this._images.hasValidImages() || this._images.hasValidSpherical());
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
		return contains(this._onLevels, lvl);
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
	 * @param key The OSM key
	 * @return True if this key is defined in this object
	 */
	Feature.prototype.hasTag = function(key) {
		return contains(this._keys, key);
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
	 * @return The centroid, as LatLng
	 */
	FeatureGeometry.prototype.getCentroid = function() {
		var result = null;
		var type = this._geom.type;
		
		if(type == "Point") {
			result = this._geom.coordinates;
		}
		else if(type == "LineString") {
			var minlon = this._geom.coordinates[0][0];
			var minlat = this._geom.coordinates[0][1];
			var maxlon = minlon;
			var maxlat = minlat;
			var length = this._geom.coordinates.length;
			var coord;
			
			for(var i=1; i < length; i++) {
				coord = this._geom.coordinates[i];
				if(minlon > coord[0]) { minlon = coord[0]; }
				else if(maxlon < coord[0]) { maxlon = coord[0]; }
				if(minlat > coord[1]) { minlat = coord[1]; }
				else if(maxlat < coord[1]) { maxlat = coord[1]; }
			}
			
			result = [ minlon + (maxlon-minlon)/2, minlat + (maxlat-minlat)/2 ];
		}
		else if(type == "Polygon") {
			var minlon = this._geom.coordinates[0][0][0];
			var minlat = this._geom.coordinates[0][0][1];
			var maxlon = minlon;
			var maxlat = minlat;
			var length = this._geom.coordinates[0].length;
			var coord;
			
			for(var i=1; i < length-1; i++) {
				coord = this._geom.coordinates[0][i];
				if(minlon > coord[0]) { minlon = coord[0]; }
				else if(maxlon < coord[0]) { maxlon = coord[0]; }
				if(minlat > coord[1]) { minlat = coord[1]; }
				else if(maxlat < coord[1]) { maxlat = coord[1]; }
			}
			
			result = [ minlon + (maxlon-minlon)/2, minlat + (maxlat-minlat)/2 ];
		}
		else if(type == "MultiPolygon") {
			var minlon = this._geom.coordinates[0][0][0][0];
			var minlat = this._geom.coordinates[0][0][0][1];
			var maxlon = minlon;
			var maxlat = minlat;
			var length = this._geom.coordinates[0][0].length;
			var coord;
			
			for(var i=1; i < length-1; i++) {
				coord = this._geom.coordinates[0][0][i];
				if(minlon > coord[0]) { minlon = coord[0]; }
				else if(maxlon < coord[0]) { maxlon = coord[0]; }
				if(minlat > coord[1]) { minlat = coord[1]; }
				else if(maxlat < coord[1]) { maxlat = coord[1]; }
			}
			
			result = [ minlon + (maxlon-minlon)/2, minlat + (maxlat-minlat)/2 ];
		}
		else {
			console.log("Unknown type: "+this._geom.type);
		}
		
		return L.latLng(result[1], result[0]);
	};
	
	/**
	 * Get this object centroid as a string
	 * @return "lat, lon"
	 */
	FeatureGeometry.prototype.getCentroidAsString = function() {
		var c = this.getCentroid();
		return c.lat+", "+c.lng;
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
				var coords;
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					coords = this._geom.coordinates[i];
					result[i] = L.latLng(coords[1], coords[0]);
				}
				break;
				
			case "Polygon":
				result = [];
				var coords;
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					result[i] = [];
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						coords = this._geom.coordinates[i][j];
						result[i][j] = L.latLng(coords[1], coords[0]);
					}
				}
				break;
				
			case "MultiPolygon":
				result = [];
				var coords;
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					result[i] = [];
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						result[i][j] = [];
						for(var k=0; k < this._geom.coordinates[i][j].length; k++) {
							coords = this._geom.coordinates[i][j][k];
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
				
				var coords;
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						coords = this._geom.coordinates[i][j];
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
				
				var coords;
				for(var i = 0; i < this._geom.coordinates.length; i++) {
					for(var j=0; j < this._geom.coordinates[i].length; j++) {
						for(var k=0; k < this._geom.coordinates[i][j].length; k++) {
							coords = this._geom.coordinates[i][j][k];
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
var FeatureStyle = function(feature) {
//ATTRIBUTES
	/** The style **/
	this._style = new Object();
	
	/** The feature icon **/
	this._icon = undefined;
	
	/** The style name **/
	this._name = "Object";

	/** Is this style describing a detailed object ? **/
	this._isDetail = false;
	
	/** The feature **/
	this._feature = feature;
	
	this._init();
};

//CONSTRUCTOR
	FeatureStyle.prototype._init = function() {
		var applyable, tagList, val, featureVal, style, key, param;
		//Find potential styles depending on tags
		for(var mainKey in STYLE.styles) {
			if(this._hasKey(mainKey)) {
				for(var i=0, until=STYLE.styles[mainKey].length; i < until; i++) {
					style = STYLE.styles[mainKey][i];
					
					/*
					 * Check if style is applyable
					 */
					applyable = false;
					
					for(var j=0, until2 = style.onTags.length; j < until2; j++) {
						tagList = style.onTags[j];
						applyable = true;
						
						for(key in tagList) {
							val = tagList[key];
							
							//If this rule is not applyable, stop
							if(!this._feature.hasTag(key)) {
								applyable = false;
								break;
							}
							else {
								featureVal = this._feature.getTag(key);
								if(val != featureVal && val != "*" && !contains(val.split("|"), featureVal)) {
									applyable = false;
									break;
								}
							}
						}
						//If style still applyable after looking for all tags in a taglist, then it's applyable
						if(applyable) { break; }
					}
					
					//If applyable, we update the result style
					if(applyable) {
						if(style.name != undefined) {
							this._name = style.name;
						}
						if(style.isDetail != undefined) {
							this._isDetail = style.isDetail;
						}
						
						for(param in style.style) {
							if(style.style[param] != undefined && (param != "icon" || this._createIconUrl(style.style) != null)) {
								this._style[param] = style.style[param];
							}
						}
					}
				}
			}
		}
		
		//Change icon=no into undefined
		if(this._style.icon == "none") { this._style.icon = undefined; }
		
		//Clean tmp objects
		applyable = null;
		tagList = null;
		val = null;
		featureVal = null;
		style = null;
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
	 * Is this style applied to detailed objects ?
	 */
	FeatureStyle.prototype.isDetail = function() {
		return this._isDetail;
	};
	
	/**
	 * Get the complete icon name, in particular when style contains a tag variable.
	 * @return The icon URL
	 */
	FeatureStyle.prototype.getIconUrl = function() {
		if(this._icon == undefined) {
			this._icon = this._createIconUrl(this._style);
		}
		
		return this._icon;
	};
	
	/**
	 * Replaces if needed the variable tag in an icon URL
	 */
	FeatureStyle.prototype._createIconUrl = function(style) {
		var regex = /\$\{(\w+)\}/;
		var icon = style.icon;
		
		//Replace all tags in icon name
		while(regex.test(icon)) {
			//Replace tag name with actual tag value
			var tagName = regex.exec(icon)[1];
			var tagValue = this._feature.getTag(tagName);
			
			//If an alias exists for the given value, replace
			if(style.iconAlias != undefined && style.iconAlias[tagValue] != undefined) {
				tagValue = style.iconAlias[tagValue];
			}
			
			icon = icon.replace(regex, tagValue);
		}
		
		//Check if icon file exists (to avoid exotic values)
		if(!contains(STYLE.images, icon)) {
			icon = null;
		}
		
		return icon;
	};
	
	/**
	 * Checks if the feature has one of the given key defined
	 */
	FeatureStyle.prototype._hasKey = function(keys) {
		keys = keys.split("|");
		for(var i=0; i < keys.length; i++) {
			if(this._feature.hasTag(keys[i])) {
				return true;
			}
		}
		return false;
	};
	
	/**
	 * @return The style name
	 */
	FeatureStyle.prototype.getName = function() {
		//Replace tag var in name
		var regex = /\$\{(\w+)\}/;
		if(regex.test(this._name)) {
			//Replace tag name with actual tag value
			var tagName = regex.exec(this._name)[1];
			this._name = removeUscore(this._name.replace(regex, this._feature.getTag(tagName)));
			this._name = this._name.charAt(0).toUpperCase() + this._name.substr(1);
		}
		
		return this._name;
	};



/**
 * FeatureImages represents the picture related to a given feature
 * They can be from various sources (Web URL, Mapillary, Flickr, ...)
 */
var FeatureImages = function(feature) {
//ATTRIBUTES
	/** The image retrieved from image=* tag **/
	this._img = undefined;
	
	/** The original image tag **/
	this._imgTag = feature.getTag("image");
	
	/** The image from mapillary=* tag **/
	this._mapillary = [];

	/** The Flickr images **/
	this._flickr = [];
	
//CONSTRUCTOR
	if(this._imgTag != undefined) {
		/*
		 * Parse image tag
		 */
		var regexUrl = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?\/[\w#!:.?+=&%@!\-\/]+\.(png|PNG|gif|GIF|jpg|JPG|jpeg|JPEG|bmp|BMP)$/;
		var regexUrlNoProtocol = /^(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?\/[\w#!:.?+=&%@!\-\/]+\.(png|PNG|gif|GIF|jpg|JPG|jpeg|JPEG|bmp|BMP)$/;
		var regexWiki = /^(File):.+\.(png|gif|jpg|jpeg|bmp)$/i;
		
		if(this._imgTag.match(regexUrl)) {
			this._img = this._imgTag;
		}
		else if(this._imgTag.match(regexUrlNoProtocol) && !this._imgTag.match(regexWiki)) {
			this._img = 'http://'+this._imgTag;
		}
		else if(this._imgTag.match(regexWiki)) {
			var file = this._imgTag.substring(5);
			var imageUtf8 = file.replace(/ /g, '_');
			var digest = md5(imageUtf8);
			var folder = digest[0] + '/' + digest[0] + digest[1] + '/' + encodeURIComponent(imageUtf8);
			this._img = 'http://upload.wikimedia.org/wikipedia/commons/' + folder;
		}
		else {
			console.warn("[Images] Invalid key: "+this._imgTag+ " for "+feature.getId());
			this._img = null;
		}
	}
	
	/*
	 * Read mapillary images
	 */
	var ftTags = feature.getTags();
	var mapillaryRegex = /^mapillary.*$/;
	var k;

	for(k in ftTags) {
		if(k.match(mapillaryRegex)) {
			this._mapillary.push({ key: k, val: ftTags[k] });
		}
	}
	
	//Clean tmp objects
	ftTags = null;
	k = null;
	mapillaryRegex = null;
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
				tag: "image = "+this._imgTag,
				page: this._img,
				date: 0
			});
		}
		
		var mapillaryData = controller.getMapillaryData();
		var mapillaryImg = null;
		for(var i=0; i < this._mapillary.length; i++) {
			mapillaryImg = this._mapillary[i];
			
			if(mapillaryData.has(mapillaryImg.val) && !mapillaryData.isSpherical(mapillaryImg.val)) {
				result.push({
					url: 'https://d1cuyjsrcm0gby.cloudfront.net/'+mapillaryImg.val+'/thumb-2048.jpg',
					source: "Mapillary",
					tag: mapillaryImg.key+" = "+mapillaryImg.val,
					author: mapillaryData.getAuthor(mapillaryImg.val),
					page: 'http://www.mapillary.com/map/im/'+mapillaryImg.val,
					date: mapillaryData.getDate(mapillaryImg.val)
				});
			}
		}
		
		if(this._flickr.length > 0) {
			result = mergeArrays(result, this._flickr);
		}
		
		result.sort(this._sortByDate);

		return result;
	};
	
	/**
	 * @return Spherical images of the feature (as an array)
	 */
	FeatureImages.prototype.getSpherical = function() {
		var result = [];
		
		var mapillaryData = controller.getMapillaryData();
		var mapillaryImg, mapillaryMetadata, initDir, dir;
		var directions = { "N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315 };
		
		for(var i=0; i < this._mapillary.length; i++) {
			mapillaryImg = this._mapillary[i];
			
			if(mapillaryData.has(mapillaryImg.val) && mapillaryData.isSpherical(mapillaryImg.val)) {
				mapillaryMetadata = mapillaryImg.key.split(':');
				initDir = undefined;
				if(mapillaryMetadata.length >= 2) {
					dir = directions[mapillaryMetadata[1]];
					if(dir != undefined) {
						initDir = dir;
					}
				}
				
				result.push({
					url: 'https://d1cuyjsrcm0gby.cloudfront.net/'+mapillaryImg.val+'/thumb-2048.jpg',
					source: "Mapillary",
					tag: mapillaryImg.key+" = "+mapillaryImg.val,
					author: mapillaryData.getAuthor(mapillaryImg.val),
					page: 'http://www.mapillary.com/map/im/'+mapillaryImg.val,
					date: mapillaryData.getDate(mapillaryImg.val),
					angle: mapillaryData.getAngle(mapillaryImg.val),
					relativeDirection: initDir
				});
			}
		}
		
		result.sort(this._sortByDate);
		
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
		if(this._mapillary.length == 0) {
			status.mapillary = "missing";
		}
		else {
			var isMapillaryOK = true;
			var i = 0;
			
			while(isMapillaryOK && i < this._mapillary.length) {
				if(!mapillaryData.has(this._mapillary[i].val)) {
					isMapillaryOK = false;
				}
				i++;
			}
			
			status.mapillary = (isMapillaryOK) ? "ok" : "bad";
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
		return this.getSpherical().length > 0;
	};
	
	/**
	 * @return The amount of valid images
	 */
	FeatureImages.prototype.countImages = function() {
		return this.get().length + this.getSpherical().length;
	};

//MODIFIERS
	/**
	 * Adds a Flickr image to this object
	 * @param title The image title
	 * @param url The image URL
	 * @param date The capture timestamp
	 * @param author The picture author
	 */
	FeatureImages.prototype.addFlickrImage = function(title, url, date, author, authorId, imgId) {
		this._flickr.push({
			url: url,
			source: "Flickr",
			tag: title,
			author: author,
			page: 'https://www.flickr.com/photos/'+authorId+'/'+imgId,
			date: date
		});
	};

//OTHER METHODS
	FeatureImages.prototype._sortByDate = function(a, b) {
		return b.date - a.date;
	};


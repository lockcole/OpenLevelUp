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
 * View JS classes
 */

OLvlUp.view = {
// ====== CONSTANTS ======
/** The minimal zoom to display cluster data on map, should be less than DATA_MIN_ZOOM **/
CLUSTER_MIN_ZOOM: 5,

/** The maximal zoom to display building general information (minimal zoom is DATA_MIN_ZOOM) **/
BUILDING_MAX_ZOOM: 0,

/** The minimal zoom to display actual data on map **/
DATA_MIN_ZOOM: 17,

/** The minimal tiles opacity (between 0 and 1) **/
TILES_MIN_OPACITY: 0.1,

/** The maximal tiles opacity (between 0 and 1) **/
TILES_MAX_OPACITY: 0.3,

/** The icon size for objects **/
ICON_SIZE: 24,

/** The available tile layers **/
TILE_LAYERS:
	{
		OSM: {
			name: "OpenStreetMap",
			URL: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			attribution: 'Tiles <a href="http://openstreetmap.org/">OSM</a>',
			minZoom: 1,
			maxZoom: 19
		},
		OSMFR: {
			name: "OpenStreetMap FR",
			URL: "http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
			attribution: 'Tiles <a href="http://tile.openstreetmap.fr/">OSMFR</a>',
			minZoom: 1,
			maxZoom: 20
		},
		TONER: {
			name: "Stamen Toner",
			URL: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png',
			attribution: 'Tiles <a href="http://maps.stamen.com/">Stamen Toner</a>',
			minZoom: 1,
			maxZoom: 20
		},
		CADASTRE: {
			name: "Cadastre FR",
			URL: "http://tms.cadastre.openstreetmap.fr/*/tout/{z}/{x}/{y}.png",
			attribution: 'Cadastre (DGFiP)',
			minZoom: 1,
			maxZoom: 20
		}
	},

/** The default attribution, refering to OSM data **/
ATTRIBUTION: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',


// ======= CLASSES =======
/**
 * This class handles current HTML view (as defined in MVC pattern).
 */
Web: function(ctrl) {
//ATTRIBUTES
	/** How many messages are currently shown **/
	var _nbMessages = 0;
	
	/** The leaflet map object **/
	var _map;
	
	/** The array which contains markers for polygon icons **/
	var _markersPolygons = null;
	
	/** The layer group that contains all overlay markers **/
	var _markersLayer = null;
	
	/** The current GeoJSON data layer on map **/
	var _dataLayer = null;
	
	/** The object that should be put in back of others **/
	var _objectLayered = null;
	
	/** Already checked icons URL **/
	var _checkedUrl = new Object();
	
	/** Level parameter in URL **/
	var _urlLevel = null;
	
	/** The application controller **/
	var _ctrl = ctrl;
	
	/** The current object **/
	var _self = this;

//ACCESSORS
	/**
	 * Get an URL parameter
	 * @param sParam The wanted parameter
	 * @return The associated value
	 */
	this.getUrlParameter = function(sParam) {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		for (var i = 0; i < sURLVariables.length; i++) 
		{
			var sParameterName = sURLVariables[i].split('=');
			if (sParameterName[0] == sParam) 
			{
				return sParameterName[1];
			}
		}
	}
	
	/**
	 * @return The leaflet map object
	 */
	this.getMap = function() {
		return _map;
	}
	
	/**
	 * @return The level parameter in URL
	 */
	this.getUrlLevel = function() {
		return _urlLevel;
	}
	
	/**
	 * @return The current map latitude
	 */
	this.getLatitude = function() {
		return normLat(_map.getCenter().lat);
	}
	
	/**
	 * @return The current map longitude
	 */
	this.getLongitude = function() {
		return normLon(_map.getCenter().lng);
	}
	
	/**
	 * @return The currently shown level
	 */
	this.getCurrentLevel = function() {
		var level = parseFloat($("#level").val());
		return (isNaN(level)) ? null : level;
	}
	
	/**
	 * @return The map bounds as string for Overpass API
	 */
	this.getMapBounds = function() {
		return normLat(_map.getBounds().getSouth())+","+normLon(_map.getBounds().getWest())+","+normLat(_map.getBounds().getNorth())+","+normLon(_map.getBounds().getEast());
	}
	
	/**
	 * @return The current data layer
	 */
	this.getDataLayer = function() {
		return _dataLayer;
	}
	
	/**
	 * @return Must we show transcendent objects ?
	 */
	this.showTranscendent = function() {
		return $("#show-transcendent").prop("checked");
	}
	
	/**
	 * @return Must we show objects with legacy tagging (buildingpart) ?
	 */
	this.showLegacy = function() {
		return $("#show-legacy").prop("checked");
	}
	
	/**
	 * @return Must we show unrendered objects ?
	 */
	this.showUnrendered = function() {
		return $("#show-unrendered").prop("checked");
	}

//MODIFIERS
	/**
	* Clears all messages.
	*/
	this.clearMessages = function() {
		$("#infobox-list li").remove();
		_nbMessages = 0;
	}

	/**
	* Displays a message when the map is loading, and hides it when its done.
	* @param isLoading True if start loading, false if loading is done
	*/
	this.setLoading = function(isLoading) {
		$("#op-loading").toggle(isLoading);
	}
	
	/**
	 * Displays the given level in map and view.
	 * @param lvl The level to display
	 */
	this.setCurrentLevel = function(lvl) {
		$("#level").val(lvl);
	}

//OTHER METHODS
/*
 * Map related methods
 */
	/**
	 * This function initializes the Leaflet map
	 */
	this.mapInit = function() {
		//Init map center and zoom
		_map = L.map('map', {minZoom: 1, maxZoom: 22}).setView([47, 2], 6);
		
		//Create tile layers
		var tileLayers = new Array();
		var firstLayer = true;
		
		for(var l in OLvlUp.view.TILE_LAYERS) {
			var currentLayer = OLvlUp.view.TILE_LAYERS[l];
			tileLayers[currentLayer.name] = new L.TileLayer(
				currentLayer.URL,
				{
					minZoom: currentLayer.minZoom,
					maxZoom: currentLayer.maxZoom,
					attribution: currentLayer.attribution+" | "+OLvlUp.view.ATTRIBUTION
				}
			);
			
			if(firstLayer) {
				_map.addLayer(tileLayers[currentLayer.name]);
				firstLayer = false;
			}
		}
		L.control.layers(tileLayers).addTo(_map);
		
		//If coordinates are given in URL, then make map show the wanted area
		var bbox = _self.getUrlParameter("bbox");
		var lat = _self.getUrlParameter("lat");
		var lon = _self.getUrlParameter("lon");
		var zoom = _self.getUrlParameter("zoom");
		var short = _self.getUrlParameter("s");
		var legacy = parseInt(_self.getUrlParameter("legacy"));
		var transcend = parseInt(_self.getUrlParameter("transcend"));
		var unrendered = parseInt(_self.getUrlParameter("unrendered"));
		var lvl = _self.getUrlParameter("level");
		
		//Read shortlink
		if(short != null) {
			var regex = /^(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+([A-Z])([a-zA-Z0-9]+)\+(?:(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+))?$/;
			if(regex.test(short)) {
				var shortRes = regex.exec(short);
				lat = base62toDec(shortRes[2]) + base62toDec(shortRes[3]) / 100000;
				if(shortRes[1] == "-") { lat = -lat; }
				
				lon = base62toDec(shortRes[5]) + base62toDec(shortRes[6]) / 100000;
				if(shortRes[4] == "-") { lon = -lon; }
				
				zoom = letterToInt(shortRes[7]);
				
				var options = intToBitArray(base62toDec(shortRes[8]));
				while(options.length < 3) { options = "0" + options; }
				unrendered = options[options.length - 1];
				legacy = options[options.length - 2];
				transcend = options[options.length - 3];
				
				//Get level if available
				if(shortRes[10] != undefined && shortRes[11] != undefined) {
					lvl = base62toDec(shortRes[10]) + base62toDec(shortRes[11]) / 100;
					if(shortRes[9] == "-") { lvl = -lvl; }
				}
			}
			else {
				_self.displayMessage("Invalid short link", "alert");
			}
		}
		
		//BBox
		if(bbox != null) {
			//Get latitude and longitude information from BBox string
			var coordinates = bbox.split(',');
			
			if(coordinates.length == 4) {
				var sw = L.latLng(coordinates[1], coordinates[0]);
				var ne = L.latLng(coordinates[3], coordinates[2]);
				var bounds = L.latLngBounds(sw, ne);
				_map.fitBounds(bounds);
			}
			else {
				_self.displayMessage("Invalid bounding box", "alert");
			}
		}
		//Lat, lon, zoom
		else if(lat != null && lon != null && zoom != null) {
			_map.setView(L.latLng(lat, lon), zoom);
		}
		//If missing parameter
		else if(lat != null || lon != null || zoom != null) {
			_self.displayMessage("Missing parameter in permalink", "error");
		}
		
		//Restore settings from URL
		if(legacy != null && (legacy == 0 || legacy == 1)) {
			$("#show-legacy").prop("checked", legacy == 1);
		}
		
		if(transcend != null && (transcend == 0 || transcend == 1)) {
			$("#show-transcendent").prop("checked", transcend == 1);
		}
		
		if(unrendered != null && (unrendered == 0 || unrendered == 1)) {
			$("#show-unrendered").prop("checked", unrendered == 1);
		}
		
		_urlLevel = lvl;
		
		//Add triggers on HTML elements
		$("#level").change(controller.onMapChange);
		$("#levelUp").click(controller.levelUp);
		$("#levelDown").click(controller.levelDown);
		$("#about-link").click(function() { $("#op-about").toggle(); });
		$("#about-close").click(function() { $("#op-about").hide(); });
		$("#show-transcendent").change(controller.onMapChange);
		$("#show-legacy").change(controller.onMapLegacyChange);
		$("#show-unrendered").change(controller.onMapChange);
		$("#export-link").click(controller.onExportLevel);
		$("#export-link-img").click(controller.onExportLevelImage);
		_map.on("baselayerchange", controller.onMapChange);
	}
	
	/**
	 * Refreshes the shown data on map.
	 * @param mapData The map data object
	 */
	this.refreshMap = function(mapData) {
		//Delete old data contained in map
		if(_dataLayer != null) {
			_map.removeLayer(_dataLayer);
			_dataLayer = null;
		}
		if(_markersLayer != null) {
			_map.removeLayer(_markersLayer);
			_markersLayer = null;
		}
		if(_objectLayered != null) {
			_objectLayered = null;
		}
		
		//Recreate data layer and add it to map
		//The shown data depends of current zoom level
		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			_objectLayered = new Object();
			_markersPolygons = new Object();
			_dataLayer = L.geoJson(
				mapData.getData(),
				{
					filter: (_map.getZoom() <= OLvlUp.view.BUILDING_MAX_ZOOM) ? _filterBuildingElements : _filterElements,
					style: _styleElements,
					pointToLayer: _styleNodes,
					onEachFeature: _processElements
				}
			);
			
			//Add eventual polygon icons
			if(_markersPolygons != null && Object.keys(_markersPolygons).length > 0) {
				_markersLayer = L.layerGroup();
				for(var i in _markersPolygons) {
					_markersLayer.addLayer(_markersPolygons[i]);
				}
				_markersLayer.addTo(_map);
			}
		}
		else if(_map.getZoom() >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
			_dataLayer = new L.MarkerClusterGroup({
				singleMarkerMode: true,
				spiderfyOnMaxZoom: false,
				maxClusterRadius: 30
			});
			_dataLayer.addLayer(L.geoJson(mapData.getClusterData()));
		}
		
		//Add data layer to map
		if(_dataLayer != null) {
			_dataLayer.addTo(_map);
			
			//Rearrange object depending of their layer value
			if(_objectLayered != null) {
				//Arrange objects regarding to layers in style
				var objectLayeredKeys = Object.keys(_objectLayered);

				if(objectLayeredKeys.length > 0) {
					objectLayeredKeys.sort(function (a,b) { return parseFloat(b)-parseFloat(a);});

					for(var i in objectLayeredKeys) {
						for(var j in _objectLayered[objectLayeredKeys[i]]) {
							if(_objectLayered[objectLayeredKeys[i]][j] instanceof L.Path) {
								_objectLayered[objectLayeredKeys[i]][j].bringToBack();
							}
						}
					}
				}
			}
		}
		
		_changeTilesOpacity();
		
		//Update permalink
		_self.updatePermalink(_map);
	}
	
	/**
	 * Changes the tiles opacity, depending of shown level
	 */
	function _changeTilesOpacity() {
		var newOpacity = 1;
		var levelsArray = _ctrl.getMapData().getLevels();
		
		 if(levelsArray != null) {
			//Find level 0 index in levels array
			var levelZero = levelsArray.indexOf(0);
			var midLevel = (levelZero >= 0) ? levelZero : Math.floor(levelsArray.length / 2);
			
			//Extract level sub-arrays
			var levelsNegative = levelsArray.slice(0, midLevel);
			var levelsPositive = levelsArray.slice(midLevel+1);
			
			//Calculate new opacity, depending of level position in levels array
			if(_self.getCurrentLevel() != null) {
				var idNeg = levelsNegative.indexOf(_self.getCurrentLevel());
				var idPos = levelsPositive.indexOf(_self.getCurrentLevel());
				if(idNeg >= 0) {
					var coef = idNeg / levelsNegative.length * (OLvlUp.view.TILES_MAX_OPACITY - OLvlUp.view.TILES_MIN_OPACITY);
					newOpacity = OLvlUp.view.TILES_MIN_OPACITY + coef;
				}
				else if(idPos >= 0) {
					var coef = (levelsPositive.length - 1 - idPos) / levelsPositive.length * (OLvlUp.view.TILES_MAX_OPACITY - OLvlUp.view.TILES_MIN_OPACITY);
					newOpacity = OLvlUp.view.TILES_MIN_OPACITY + coef;
				}
				else {
					newOpacity = OLvlUp.view.TILES_MAX_OPACITY;
				}
			}
		}
		
		//Update tiles opacity
		_map.eachLayer(function(layer) {
			if(layer instanceof L.TileLayer) {
				layer.setOpacity(newOpacity);
			}
		} );
	}

/*
 * Data style and filters
 */
	/**
	* This function is run everytime an element is added on the map (see onEachFeature for GeoJSON in Leaflet)
	* @param feature The GeoJSON feature to analyse
	* @param layer The leaflet layer
	*/
	function _processElements(feature, layer) {
		var name = feature.properties.name;
		var styleRules = feature.properties.style;
		
		//Create popup if necessary
		if(styleRules.popup == undefined || styleRules.popup == "yes") {
			var text = '<h1 class="popup">';
			
			//Add icon in title
			if(styleRules.icon != undefined) {
				var iconUrl = _getIconUrl(feature, styleRules.icon);
				if(iconUrl != null) {
					text += '<img class="icon" src="'+iconUrl+'" /> ';
				}
			}
			
			//Object name (its name tag or its type)
			text += (feature.properties.tags.name != undefined) ? feature.properties.tags.name : name;
			
			//Add up and down icons if levelup property == true
			if(styleRules.levelup && feature.properties.levels != undefined) {
				//Able to go up ?
				var levelId = feature.properties.levels.indexOf(_self.getCurrentLevel().toString());
				if(levelId < feature.properties.levels.length -1) {
					text += ' <a onclick="controller.toLevel('+feature.properties.levels[levelId+1]+')" href="#"><img src="img/arrow_up.png" title="Go up" alt="Up!" /></a>';
				}
				//Able to go down ?
				if(levelId > 0) {
					text += ' <a onclick="controller.toLevel('+feature.properties.levels[levelId-1]+')" href="#"><img src="img/arrow_down.png" title="Go down" alt="Down!" /></a>';
				}
			}
			
			//End title
			text += '</h1>';
			
			//Link to osm.org object
			text += '<p class="popup-txt centered"><a href="http://www.openstreetmap.org/'+feature.properties.type+'/'+feature.properties.id+'">See this on OSM.org</a></p>';
			
			//List all tags
			text += '<h2 class="popup">Tags</h2><p class="popup-txt">';
			for(i in feature.properties.tags) {
				//Render specific tags
				//URLs
				var urlTags = ["image", "website", "contact:website", "url"];
				if(urlTags.indexOf(i) >= 0) {
					text += i+' = <a href="'+feature.properties.tags[i]+'">'+feature.properties.tags[i]+'</a>';
				}
				//Wikimedia commons
				else if(i == "wikimedia_commons") {
					text += i+' = <a href="https://commons.wikimedia.org/wiki/'+feature.properties.tags[i]+'">'+feature.properties.tags[i]+'</a>';
				}
				else {
					text += i+" = "+feature.properties.tags[i];
				}
				text += "<br />";
			}
			
			text += "</p>";
			
			//Image rendering
			if(feature.properties.tags.image != undefined) {
				var url = feature.properties.tags.image;
				
				text += '<p class="popup-img"><a href="'+url+'"><img src="'+url+'" alt="Image of this object" /></a></p>';
			}
			
			//And add popup to layer
			layer.bindPopup(text);
			if(_markersPolygons[feature.properties.type+feature.properties.id] != undefined) {
				_markersPolygons[feature.properties.type+feature.properties.id].bindPopup(text);
			}
		}
		
		//Send this object to back of other layers
		if(styleRules.layer != undefined) {
			styleRules.layer = parseFloat(styleRules.layer);
			if(!isNaN(styleRules.layer)) {
				if(_objectLayered[styleRules.layer] == undefined) {
					_objectLayered[styleRules.layer] = new Array();
				}
				_objectLayered[styleRules.layer].push(layer);
			}
		}
	}

	/**
	* Filter GeoJSON elements depending of their level.
	* @param feature The GeoJSON feature to analyse
	* @param layer The leaflet layer
	* @return True if should be shown
	*/
	function _filterElements(feature, layer) {
		var addObject = false;
		
		//Consider level-related tags
		if(feature.properties.levels != undefined) {
			addObject = Object.keys(feature.properties.tags).length > 0
					&& (Object.keys(feature.properties.tags).length > 1 || feature.properties.tags.area == undefined)
					&& feature.properties.levels.indexOf(_self.getCurrentLevel().toString()) >= 0
					&& (_self.showTranscendent() || feature.properties.levels.length == 1)
					&& (_self.showLegacy() || feature.properties.tags.buildingpart == undefined)
					&& (_self.showUnrendered() || Object.keys(_getStyle(feature)).length > 0);
		}
		//Consider objects without levels but connected to door elements
		else {
			//Building with min and max level
			addObject = feature.properties.tags.building != undefined
					&& feature.properties.tags.min_level != undefined
					&& feature.properties.tags.max_level != undefined;
			
			//Elevator
			if(_self.showTranscendent()) {
				addObject = addObject || feature.properties.tags.highway == "elevator";
			}
			
			//Display unrendered objects
			/*if(!addObject) {
				console.log("Unrendered object:");
				console.log(feature);
			}*/
		}

		return addObject;
	}
	
	/**
	 * Filter building contained in GeoJSON elements.
	 * @param feature The GeoJSON feature to analyse
	 * @param layer The leaflet layer
	 * @return True if should be shown
	 */
	function _filterBuildingElements(feature, layer) {
		return feature.properties.tags.building != undefined;
	}

	/**
	* Applies the appropriate style on the given feature.
	* @param feature The GeoJSON element to decorate
	* @return The style
	*/
	function _styleElements(feature) {
		var result = _getStyle(feature);
		
		//This add a marker if a polygon has its "icon" property defined
		if(result.icon != undefined && feature.geometry.type == "Polygon") {
			var centroid = centroidPolygon(feature.geometry);
			var marker = _createMarker(L.latLng(centroid[1], centroid[0]), feature, result);
			_markersPolygons[feature.properties.type+feature.properties.id] = marker;
		}
		
		return result;
	}
	
	/**
	 * Returns the appropriate style for a given OSM element (depending of its tags)
	 * @param feature The GeoJSON feature
	 * @return The appropriate style
	 */
	function _getStyle(feature) {
		var result = new Object();
		
		//Process style
		if(feature.properties.style == undefined) {
			if(STYLE != undefined) {
				var name = "Object";
				
				//Find potential styles depending on tags
				for(var i in STYLE.styles) {
					var style = STYLE.styles[i];
					
					//If applyable, we update the result style
					if(_isStyleApplyable(feature, style)) {
						name = style.name;
						for(var param in style.style) {
							result[param] = style.style[param];
						}
					}
				}
				
				//Change icon=no into undefined
				if(result.icon == "no") { result.icon = undefined; }
				
				feature.properties.style = result;
				feature.properties.name = name;
			}
			else {
				controller.getView().displayMessage("Error while loading style file", "error");
			}
		}
		//If already processed, retrieve style
		else {
			result = feature.properties.style;
		}
		
		return result;
	}

	/**
	* Checks if a given style is applyable on a given feature
	* @param feature The feature to test
	* @param style The JSON style to test
	* @return True if the style is applyable
	*/
	function _isStyleApplyable(feature, style) {
		var applyable;
		
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

	/**
	* Returns the appropriate style for a given OSM node element (depending of its tags)
	* @param feature The GeoJSON element to decorate
	* @param latlng Its coordinates
	* @return The style
	*/
	function _styleNodes(feature, latlng) {
		var result;
		
		//Find the appropriate icon, depending of tags
		var style = (feature.properties.style == undefined) ? _styleElements(feature) : feature.properties.style;
		
		result = _createMarker(latlng, feature, style);
		
		return result;
	}
	
	/**
	 * Creates a marker
	 * @param latlng The latitude and longitude of the marker
	 * @param feature The feature which will be represented
	 * @param style The feature style
	 * @return The leaflet marker, or null
	 */
	function _createMarker(latlng, feature, style) {
		var result = null;
		var iconUrl = null;
		
		if(style.icon != undefined && style.icon != null && style.icon != '') {
			var tmpUrl = _getIconUrl(feature, style.icon);
			
			if(tmpUrl != null) {
				iconUrl = tmpUrl;
			}
			else if(style.showMissingIcon == undefined || style.showMissingIcon) {
				iconUrl = 'img/default.svg';
			}
		}
		else if(style.showMissingIcon == undefined || style.showMissingIcon) {
			result = L.circleMarker(latlng, style);
		}
		
		if(iconUrl != null) {
			var myIcon = L.icon({
				iconUrl: iconUrl,
				iconSize: [OLvlUp.view.ICON_SIZE, OLvlUp.view.ICON_SIZE],
				iconAnchor: [OLvlUp.view.ICON_SIZE/2, OLvlUp.view.ICON_SIZE/2],
				popupAnchor: [0, -OLvlUp.view.ICON_SIZE/2]
			});
			result = L.marker(latlng, {icon: myIcon});
		}
		else {
			result = L.circleMarker(latlng, { opacity: 0, fillOpacity: 0 });
		}
		
		return result;
	}
	
	/**
	 * Get the complete icon name, in particular when style contains a tag variable.
	 * @param feature The GeoJSON feature
	 * @param iconStyle The icon string from JSON style
	 * @return The icon URL
	 */
	function _getIconUrl(feature, iconStyle) {
		var result = iconStyle;
		
		var regex = /\$\{(\w+)\}/;
		if(regex.test(iconStyle)) {
			//Replace tag name with actual tag value
			var tagName = regex.exec(iconStyle)[1];
			result = iconStyle.replace(regex, feature.properties.tags[tagName]);
			
			//Check if icon file exists (to avoid exotic values)
			if(Object.keys(_checkedUrl).indexOf(result) < 0) {
				_checkedUrl[result] = fileExists(result);
			}
			
			if(!_checkedUrl[result]) {
				result = null;
			}
		}
		
		return result;
	}
/*
 * Levels management
 */
	/**
	 * Makes the level increase of one step
	 * @param mapData The current map data object
	 */
	this.levelUp = function(mapData) {
		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			var currentLevelId = mapData.getLevels().indexOf(parseFloat(_self.getCurrentLevel()));
			
			if(currentLevelId == -1) {
				_self.displayMessage("Invalid level", "error");
			}
			else if(currentLevelId + 1 < mapData.getLevels().length) {
				_self.setCurrentLevel(mapData.getLevels()[currentLevelId+1]);
				_self.refreshMap(mapData);
			}
			else {
				_self.displayMessage("You are already at the last available level", "alert");
			}
		}
	}
	
	/**
	 * Makes the level decrease of one step
	 * @param mapData The current map data object
	 */
	this.levelDown = function(mapData) {
		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			var currentLevelId = mapData.getLevels().indexOf(parseFloat(_self.getCurrentLevel()));
			
			if(currentLevelId == -1) {
				_self.displayMessage("Invalid level", "error");
			}
			else if(currentLevelId > 0) {
				_self.setCurrentLevel(mapData.getLevels()[currentLevelId-1]);
				_self.refreshMap(mapData);
			}
			else {
				_self.displayMessage("You are already at the first available level", "alert");
			}
		}
	}
	
	/**
	 * This function updates the select field for levels
	 * @param levelsArray The levels array (must be already sorted)
	 */
	this.populateSelectLevels = function(levelsArray) {
		var option = '';
		
		//Compute level and store them as select options
		for(var i=0; i < levelsArray.length; i++) {
			option += '<option value="'+ levelsArray[i] + '">' + levelsArray[i] + '</option>';
		}
		
		$('#level').empty();
		
		//If levels array isn't empty, we add options
		if(option != '') {
			$('#level').append(option);
			$("#level").prop("disabled", false);
			$("#show-transcendent").prop("disabled", false);
			$("#show-unrendered").prop("disabled", false);
		}
		//If not, we disable the select element
		else {
			$("#level").prop("disabled", true);
			$("#show-transcendent").prop("disabled", true);
			$("#show-unrendered").prop("disabled", true);
		}
	}

/*
 * Other view methods
 */
	/**
	 * Displays a message in the console and in a specific area of the page.
	 * @param msg The string to display
	 * @param type The kind of message (info, alert, error)
	 */
	this.displayMessage = function(msg, type) {
		//Add a new child in list, corresponding to the given message
		var newLi = document.createElement("li");
		if(_nbMessages == 0) {
			$("#infobox-list").append(newLi);
		}
		else {
			$("#infobox-list li:first-child").before(newLi);
		}
		
		//Add classes and text to the added child
		$("#infobox-list li:first-child").addClass(type).html(msg);
		
		_nbMessages++;
		
		//Remove that child after a delay
		setTimeout(function() {
			$("#infobox-list li").last().remove();
			_nbMessages--;
		}, 5000);
	}
	
	/**
	 * Updates the permalink on page.
	 */
	this.updatePermalink = function() {
		var baseURL = $(location).attr('href').split('?')[0]+"?";
		var params = "lat="+_self.getLatitude()+"&lon="+_self.getLongitude()+"&zoom="+_map.getZoom();
		
		if($("#level").val() != null) {
			params += "&level="+$("#level").val();
		}
		
		params += "&transcend="+((_self.showTranscendent()) ? "1" : "0");
		params += "&legacy="+((_self.showLegacy()) ? "1" : "0");
		params += "&unrendered="+((_self.showUnrendered()) ? "1" : "0");
		
		var link = baseURL + params;
		var linkShort = baseURL + "s=" + _shortlink();
		
		$("#permalink").attr('href', link);
		$("#shortlink").attr('href', linkShort);
		
		//Update browser URL
		window.history.replaceState({}, "OpenLevelUp!", link);
		
		//Update OSM link
		$("#osm-link").attr('href', "http://openstreetmap.org/#map="+_map.getZoom()+"/"+_map.getCenter().lat+"/"+_map.getCenter().lng);
	}
	
	/**
	 * Creates short links
	 * Format: lat+lon+zoomoptions
	 * Lat and lon are the latitude and longitude, encoded in base 62
	 * Zoom is the map zoom encoded as a letter (A=1, Z=26)
	 * Options are a bit array, encoded as base 62
	 * Example: 10.AQ3+-2j.64S+E6
	 * @return The short link for current view
	 */
	function _shortlink() {
		var lat = _self.getLatitude();
		var lon = _self.getLongitude();
		
		var shortLat = ((lat < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(lat))) + "." + decToBase62((Math.abs((lat % 1).toFixed(5)) * 100000).toFixed(0)); //Latitude
		var shortLon = ((lon < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(lon))) + "." + decToBase62((Math.abs((lon % 1).toFixed(5)) * 100000).toFixed(0)); //Longitude
		var shortZoom = intToLetter(_map.getZoom()); //Zoom
		
		//Level
		var lvl = _self.getCurrentLevel();
		var shortLvl = "";
		if(lvl != null) {
			if(lvl < 0) {
				shortLvl += "-";
			}
			
			shortLvl += decToBase62(Math.floor(Math.abs(lvl)));
			shortLvl += ".";
			shortLvl += decToBase62((Math.abs((lvl % 1).toFixed(2)) * 100).toFixed(0));
		}
		
		var shortOptions = bitArrayToBase62([
					((_self.showTranscendent()) ? "1" : "0"),
					((_self.showLegacy()) ? "1" : "0"),
					((_self.showUnrendered()) ? "1" : "0")
				]);
		
		var short = shortLat+"+"+shortLon+"+"+shortZoom+shortOptions+"+"+shortLvl;
		
		return short;
	}
}

};
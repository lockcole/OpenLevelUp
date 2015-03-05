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

/** The minimal zoom to display actual data on map **/
DATA_MIN_ZOOM: 17,

/** The minimal tiles opacity (between 0 and 1) **/
TILES_MIN_OPACITY: 0.2,

/** The available tile layers **/
TILE_LAYERS:
	{
		OSM: {
			name: "OpenStreetMap",
			URL: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			attribution: '',
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
	
	/** The current GeoJSON data layer on map **/
	var _dataLayer = null;
	
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
	 * @return The currently shown level
	 */
	this.getCurrentLevel = function() {
		return parseFloat($("#level").val());
	}
	
	/**
	 * @return The map bounds as string for Overpass API
	 */
	this.getMapBounds = function() {
		return _map.getBounds().getSouth()+","+_map.getBounds().getWest()+","+_map.getBounds().getNorth()+","+_map.getBounds().getEast();
	}
	
	/**
	 * @return Must we show transcendent objects ?
	 */
	this.showTranscendent = function() {
		return $("#show-transcendent").prop("checked");
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
		
		//If coordinates are given in URL, then make map show the wanted area
		var bbox = _self.getUrlParameter("bbox");
		var lat = _self.getUrlParameter("lat");
		var lon = _self.getUrlParameter("lon");
		var zoom = _self.getUrlParameter("zoom");
		
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
		
		//Add triggers on HTML elements
		$("#level").change(controller.onMapChange);
		$("#levelUp").click(controller.levelUp);
		$("#levelDown").click(controller.levelDown);
		$("#about-link").click(function() { $("#op-about").toggle(); });
		$("#about-close").click(function() { $("#op-about").hide(); });
		$("#show-transcendent").change(controller.onMapChange);
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
		
		//Recreate data layer and add it to map
		//The shown data depends of current zoom level
		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			_dataLayer = L.geoJson(
				mapData.getData(),
				{ filter: _filterElements, style: _styleElements, pointToLayer: _styleNodes, onEachFeature: _processElements }
			);
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
			var midLevel = (levelZero >= 0) ? midLevel = levelZero : Math.floor(levelsArray.length / 2);
			
			//Extract level sub-arrays
			var levelsNegative = levelsArray.slice(0, midLevel);
			var levelsPositive = levelsArray.slice(midLevel+1);
			
			//Calculate new opacity, depending of level position in levels array
			var idNeg = levelsNegative.indexOf(_self.getCurrentLevel());
			var idPos = levelsPositive.indexOf(_self.getCurrentLevel());
			if(idNeg >= 0) {
				var coef = idNeg / levelsNegative.length * (1 - OLvlUp.view.TILES_MIN_OPACITY);
				newOpacity = OLvlUp.view.TILES_MIN_OPACITY + coef;
			}
			else if(idPos >= 0) {
				var coef = (levelsPositive.length - 1 - idPos) / levelsPositive.length * (1 - OLvlUp.view.TILES_MIN_OPACITY);
				newOpacity = OLvlUp.view.TILES_MIN_OPACITY + coef;
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
		var name = "Object";
		var popup = "yes";
		
		//Find object info, looking in style rules
		for(var i in STYLE.styles) {
			var style = STYLE.styles[i];
			
			//If applyable, we update the result style
			if(_isStyleApplyable(feature, style)) {
				name = style.name;
				if(style.style.popup != undefined) {
					popup = style.style.popup;
				}
			}
		}
		
		//Create popup if necessary
		if(popup == "yes") {
			var text = '<h1 class="popup">'+name+'</h1>';
			
			//List all tags
			text += '<h2 class="popup">Tags</h2>';
			for(i in feature.properties.tags) {
				text += i+" = "+feature.properties.tags[i]+"<br />";
			}
			
			//And add popup to layer
			layer.bindPopup(text);
		}
	}

	/**
	* Filter GeoJSON elements depending of their level.
	* @param feature The GeoJSON feature to analyse
	* @param layer The leaflet layer
	* @return True if should be shown
	*/
	function _filterElements(feature, layer) {
		var onLevels = null;
		var addObject = false;
		
		//Consider repeat_on tags
		if(feature.properties.tags.repeat_on != undefined) {
			onLevels = parseLevels(feature.properties.tags.repeat_on);
		}
		//Consider level tags
		else if(feature.properties.tags.level != undefined) {
			onLevels = parseLevels(feature.properties.tags.level);
		}
		//Consider objects without levels but connected to door elements
		else {
			//Building with min and max level
			//TODO
			addObject = feature.properties.tags.building != undefined
			&& feature.properties.tags.min_level != undefined
			&& feature.properties.tags.max_level != undefined;
			
			//addObject = Object.keys(feature.properties.tags).length > 0;
			//Elevator
			addObject = addObject || feature.properties.tags.highway == "elevator";
			
			//Display unrendered objects
			/*if(!addObject) {
			*	console.log("Unrendered object:");
			*	console.log(feature);
			}*/
		}

		return addObject || (onLevels != null && onLevels.indexOf($("#level").val()) >= 0 && (_self.showTranscendent() || onLevels.length == 1));
	}

	/**
	* Returns the appropriate style for a given OSM element (depending of its tags)
	* @param feature The GeoJSON element to decorate
	* @return The style
	*/
	function _styleElements(feature) {
		var result = new Array();
		
		if(STYLE != undefined) {
			//Find potential styles depending on tags
			for(var i in STYLE.styles) {
				var style = STYLE.styles[i];
				
				//If applyable, we update the result style
				if(_isStyleApplyable(feature, style)) {
					for(var param in style.style) {
						result[param] = style.style[param];
					}
				}
			}
		}
		else {
			controller.getView().displayMessage("Error while loading style file", "error");
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
		var style = _styleElements(feature);
		
		//If defined style, we use it
		if(Object.keys(style).length > 0) {
			//Custom icon
			if(style.icon != undefined) {
				var myIcon = L.icon({
					iconUrl: style.icon,
					iconSize: [24, 24],
					iconAnchor: [12, 12],
					popupAnchor: [0, -12]
				});
				result = L.marker(latlng, {icon: myIcon})
			}
			else {
				result = L.circleMarker(latlng, style);
			}
		}
		//Else, default style
		else {
			//Icon definition
			var myIcon = L.icon({
				iconUrl: 'img/default.svg',
				iconSize: [24, 24],
				iconAnchor: [12, 12],
				popupAnchor: [0, -12]
			});
			result = L.marker(latlng, {icon: myIcon})
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
		}
		//If not, we disable the select element
		else {
			$("#level").prop("disabled", true);
			$("#show-transcendent").prop("disabled", true);
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
		//var link = $(location).attr('href').split('?')[0]+"?bbox="+_map.getBounds().toBBoxString();
		var link = $(location).attr('href').split('?')[0]+"?lat="+_map.getCenter().lat+"&lon="+_map.getCenter().lng+"&zoom="+_map.getZoom();
		
		if($("#level").val() != null) {
			link += "&level="+$("#level").val();
		}
		
		$("#permalink").attr('href', link);
		
		//Update browser URL
		window.history.replaceState({}, "OpenLevelUp!", link);
	}
}

};
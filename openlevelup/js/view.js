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
DATA_MIN_ZOOM: 18,

/** The maximal zoom of map **/
MAX_ZOOM: 24,

/** The minimal tiles opacity (between 0 and 1) **/
TILES_MIN_OPACITY: 0.1,

/** The maximal tiles opacity (between 0 and 1) **/
TILES_MAX_OPACITY: 0.3,

/** The icon size for objects **/
ICON_SIZE: 24,

/** The folder containing icons **/
ICON_FOLDER: "img",

/** The available tile layers (IDs must be integers and constant in time) **/
TILE_LAYERS:
	{
		0: {
			name: "OpenStreetMap",
			URL: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			attribution: 'Tiles <a href="http://openstreetmap.org/">OSM</a>',
			minZoom: 1,
			maxZoom: 19
		},
		1: {
			name: "OpenStreetMap FR",
			URL: "http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
			attribution: 'Tiles <a href="http://tile.openstreetmap.fr/">OSMFR</a>',
			minZoom: 1,
			maxZoom: 20
		},
		2: {
			name: "Stamen Toner",
			URL: 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png',
			attribution: 'Tiles <a href="http://maps.stamen.com/">Stamen Toner</a>',
			minZoom: 1,
			maxZoom: 20
		},
		3: {
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
 * The main view class.
 * It handles the index page, and contains links to sub-components.
 */
MainView: function(ctrl, mobile) {
//ATTRIBUTES
	/** The main controller **/
	var _ctrl = ctrl;
	
	/** Is the user using a mobile device ? **/
	var _isMobile = mobile || false;
	
	/** The current object **/
	var _self = this;
	
	/*
	 * The view components
	 */
	/** The loading component **/
	var _cLoading = new OLvlUp.view.LoadingView();
	
	/** The about component **/
	var _cAbout = new OLvlUp.view.AboutView();
	
	/** The messages stack component **/
	var _cMessages = new OLvlUp.view.MessagesView();
	
	/** The URL component **/
	var _cUrl = null;
	
	/** The options component **/
	var _cOptions = new OLvlUp.view.OptionsView();
	
	/** The map component **/
	var _cMap = null;

//CONSTRUCTOR
	function _init() {
		_cUrl = new OLvlUp.view.URLView(_self);
		_cMap = new OLvlUp.view.MapView(_self);
	};

//ACCESSORS
	/**
	 * @return True if the application is viewed in a mobile device
	 */
	this.isMobile = function() {
		return _isMobile;
	};
	
	/**
	 * @return The URL component
	 */
	this.getUrlView = function() {
		return _cUrl;
	};
	
	/**
	 * @return The map component
	 */
	this.getMapView = function() {
		return _cMap;
	};
	
	/**
	 * @return The messages stack component
	 */
	this.getMessagesView = function() {
		return _cMessages;
	};
	
	/**
	 * @return The options component
	 */
	this.getOptionsView = function() {
		return _cOptions;
	};

//INIT
	_init();
},



/**
 * The map component, based on Leaflet library
 */
MapView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;
	
	/** The map object **/
	var _map = null;
	
	/** The current tile layer **/
	var _tileLayer = null;
	
	/** The current level (or null if in cluster mode) **/
	var _level = null;
	
	/** The current object **/
	var _self = this;

//CONSTRUCTOR
	function _init() {
		var isMobile = _mainView.isMobile();
		
		//Init map center and zoom
		_map = L.map('map', {minZoom: 1, maxZoom: OLvlUp.view.MAX_ZOOM, zoomControl: false}).setView([47, 2], 6);
		if(!isMobile) {
			L.control.zoom({ position: "topright" }).addTo(_map);
		}
		
		//Add search bar
		//TODO Remove mobile condition, only to get to time to solve search bar bug
		if(!isMobile) {
			var search = L.Control.geocoder({ position: "topright" });
			//Limit max zoom in order to avoid having no tiles in background for small objects
			var minimalMaxZoom = OLvlUp.view.TILE_LAYERS[0].maxZoom;
			for(var i in OLvlUp.view.TILE_LAYERS) {
				if(OLvlUp.view.TILE_LAYERS[i].maxZoom < minimalMaxZoom) {
					minimalMaxZoom = OLvlUp.view.TILE_LAYERS[i].maxZoom;
				}
			}
			//Redefine markGeocode to avoid having an icon for the result
			search.markGeocode = function (result) {
				controller.getView().getMap().fitBounds(result.bbox, { maxZoom: minimalMaxZoom });
				return this;
			};
			search.addTo(_map);
		}
		
		if(isMobile) {
			L.control.zoom({ position: "topright" }).addTo(_map);
		}
		
		//Create tile layers
		var tiles = _mainView.getUrlView().getTiles();
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
			
			if(firstLayer && tiles == undefined) {
				_map.addLayer(tileLayers[currentLayer.name]);
				firstLayer = false;
				_tileLayer = l;
			}
			else if(l == tiles) {
				_map.addLayer(tileLayers[currentLayer.name]);
				_tileLayer = l;
			}
		}
		L.control.layers(tileLayers).addTo(_map);
		
		//Trigger for map movement event
		_map.on('moveend', function(e) { _self.update(); });
	};

//ACCESSORS
	/**
	 * @return The map object
	 */
	this.get = function() {
		return _map;
	};
	
	/**
	 * @return The currently shown tile layer
	 */
	this.getTileLayer = function() {
		return _tileLayer;
	};

//OTHER METHODS
	/**
	 * Event handler for map movement
	 */
	this.update = function() {
	};

//INIT
	_init();
},



/**
 * The options component
 */
OptionsView: function() {
//ATTRIBUTES
	/** Show legacy tag elements **/
	var _legacy = true;
	
	/** Show transcendent elements **/
	var _transcend = true;
	
	/** Show unrendered elements **/
	var _unrendered = false;
	
	/** Show only buildings **/
	var _buildings = false;
	
	/** This object **/
	var _self = this;

//CONSTRUCTOR
	function _init() {
		//Init checkboxes
		$("#show-transcendent").prop("checked", _transcend);
		$("#show-legacy").prop("checked", _legacy);
		$("#show-unrendered").prop("checked", _unrendered);
		$("#show-buildings-only").prop("checked", _buildings);
		
		//Add triggers
		$("#show-transcendent").change(_self.changeTranscendent);
		$("#show-legacy").change(_self.changeLegacy);
		$("#show-unrendered").change(_self.changeUnrendered);
		$("#show-buildings-only").change(_self.changeBuildingsOnly);
	};

//ACCESSORS
	/**
	 * @return Must we show transcendent objects ?
	 */
	this.showTranscendent = function() {
		return _transcend;
	};
	
	/**
	 * @return Must we show objects with legacy tagging (buildingpart) ?
	 */
	this.showLegacy = function() {
		return _legacy;
	};
	
	/**
	 * @return Must we show unrendered objects ?
	 */
	this.showUnrendered = function() {
		return _unrendered;
	};
	
	/**
	 * @return Must we show only building objects ?
	 */
	this.showBuildingsOnly = function() {
		return _buildings;
	};

//MODIFIERS
	/**
	 * Must we set transcendent objects ?
	 */
	this.changeTranscendent = function() {
		_transcend = !_transcend;
	};
	
	/**
	 * Must we set objects with legacy tagging (buildingpart) ?
	 */
	this.changeLegacy = function() {
		_legacy = !_legacy;
	};
	
	/**
	 * Must we set unrendered objects ?
	 */
	this.changeUnrendered = function() {
		_unrendered = !_unrendered;
	};
	
	/**
	 * Must we set only building objects ?
	 */
	this.changeBuildingsOnly = function() {
		_buildings = !_buildings;
	};
	
	/**
	 * Must we set transcendent objects ?
	 */
	this.setTranscendent = function(p) {
		_transcend = p;
		$("#show-transcendent").prop("checked", _transcend);
	};
	
	/**
	 * Must we set objects with legacy tagging (buildingpart) ?
	 */
	this.setLegacy = function(p) {
		_legacy = p;
		$("#show-legacy").prop("checked", _legacy);
	};
	
	/**
	 * Must we set unrendered objects ?
	 */
	this.setUnrendered = function(p) {
		_unrendered = p;
		$("#show-unrendered").prop("checked", _unrendered);
	};
	
	/**
	 * Must we set only building objects ?
	 */
	this.setBuildingsOnly = function(p) {
		_buildings = p;
		$("#show-buildings-only").prop("checked", _buildings);
	};

//INIT
	_init();
},



/**
 * The export component
 */
ExportView: function() {
},



/**
 * The permalink and browser URL component
 */
URLView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;
	
	/** This object **/
	var _self = this;
	
	/*
	 * URL parameters
	 */
	var _bbox = null;
	var _lat = null;
	var _lon = null;
	var _zoom = null;
	var _level = null;
	var _tiles = null;

//ACCESSORS
	/**
	 * @return The tile layer to display
	 */
	this.getTiles = function() {
		return _tiles;
	};

//CONSTRUCTOR
	/**
	 * Constructor
	 */
	function _init() {
		_readUrl();
		_setShortlink();
	};

//OTHER METHODS
	/**
	 * Updates the component when map moves
	 */
	this.mapUpdated = function() {
		//Update fields
		var map = _mainView.getMapView().get();
		_zoom = map.getZoom();
		_lat = map.getCenter().lat;
		_lon = map.getCenter().lng;
		_tiles = _mainView.getMapView().getTileLayer();
		
		//Update DOM
		_updateUrl();
		_setShortlink();
	};
	
	/**
	 * @return The page base URL
	 */
	function _getUrl() {
		return $(location).attr('href').split('?')[0];
	};
	
	/**
	 * @return The URL hash
	 */
	function _getUrlHash() {
		return $(location).attr('href').split('#')[1];
	};
	
	/**
	 * Reads the browser URL and updates this object fields
	 */
	function _readUrl() {
		var parameters = _getParameters();
		var optionsView = _mainView.getOptionsView();
		
		//Read shortlink
		var short = parameters.s;
		if(short != undefined) {
			var regex = /^(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+([A-Z])([a-zA-Z0-9]+)\+(?:(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+))?(?:\+([a-zA-Z0-9]+))?$/;
			if(regex.test(short)) {
				var shortRes = regex.exec(short);
				_lat = base62toDec(shortRes[2]) + base62toDec(shortRes[3]) / 100000;
				if(shortRes[1] == "-") { _lat = -_lat; }
				
				_lon = base62toDec(shortRes[5]) + base62toDec(shortRes[6]) / 100000;
				if(shortRes[4] == "-") { _lon = -_lon; }
				
				_zoom = letterToInt(shortRes[7]);
				
				var options = intToBitArray(base62toDec(shortRes[8]));
				while(options.length < 4) { options = "0" + options; }
				optionsView.setUnrendered(options[options.length - 1]);
				optionsView.setLegacy(options[options.length - 2]);
				optionsView.setTranscendent(options[options.length - 3]);
				optionsView.setBuildingsOnly(options[options.length - 4]);
				
				//Get level if available
				if(shortRes[10] != undefined && shortRes[11] != undefined) {
					_level = base62toDec(shortRes[10]) + base62toDec(shortRes[11]) / 100;
					if(shortRes[9] == "-") { _level = -_level; }
				}
				
				//Get tiles if available
				if(shortRes[12] != undefined) {
					_tiles = base62toDec(shortRes[12]);
				}
			}
			else {
				_mainView.getMessagesView().displayMessage("Invalid short link", "alert");
			}
		}
		//Read parameters directly
		else {
			_bbox = parameters.bbox;
			_lat = parameters.lat;
			_lon = parameters.lon;
			_zoom = parameters.zoom;
			optionsView.setLegacy(parameters.legacy);
			optionsView.setTranscendent(parameters.transcend);
			optionsView.setUnrendered(parameters.unrendered);
			optionsView.setBuildingsOnly(parameters.buildings);
			_level = parameters.level;
			_tiles = parameters.tiles;
		}
	};
	
	function _updateUrl() {
		var optionsView = _mainView.getOptionsView();
		var params = "lat="+_lat+"&lon="+_lon+"&zoom="+_zoom+"&tiles="+_tiles;
		
		if(_level != null) {
			params += "&level="+_level;
		}
		
		params += "&transcend="+((optionsView.showTranscendent()) ? "1" : "0");
		params += "&legacy="+((optionsView.showLegacy()) ? "1" : "0");
		params += "&unrendered="+((optionsView.showUnrendered()) ? "1" : "0");
		params += "&buildings="+((optionsView.showBuildingsOnly()) ? "1" : "0");
		
		var link = _getUrl() + "?" + params + '#' + _getUrlHash();
		
		$("#permalink").attr('href', link);
		
		//Update browser URL
		window.history.replaceState({}, "OpenLevelUp!", link);
		
		//Update OSM link
		$("#osm-link").attr('href', "http://openstreetmap.org/#map="+_zoom+"/"+_lat+"/"+_lon);
	};
	
	/**
	 * Updates short links
	 * Format: lat+lon+zoomoptions+level+tiles
	 * Lat and lon are the latitude and longitude, encoded in base 62
	 * Zoom is the map zoom encoded as a letter (A=1, Z=26)
	 * Options are a bit array, encoded as base 62
	 * Example: 10.AQ3+-2j.64S+E6+F+2
	 */
	function _setShortlink() {
		var optionsView = _mainView.getOptionsView();
		var shortLat = ((_lat < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(_lat))) + "." + decToBase62((Math.abs((_lat % 1).toFixed(5)) * 100000).toFixed(0)); //Latitude
		var shortLon = ((_lon < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(_lon))) + "." + decToBase62((Math.abs((_lon % 1).toFixed(5)) * 100000).toFixed(0)); //Longitude
		var shortZoom = intToLetter(_zoom); //Zoom
		var shortTiles = decToBase62(_tiles);
		
		//Level
		var shortLvl = "";
		if(_level != null) {
			if(_level < 0) {
				shortLvl += "-";
			}
			
			shortLvl += decToBase62(Math.floor(Math.abs(_level)));
			shortLvl += ".";
			shortLvl += decToBase62((Math.abs((_level % 1).toFixed(2)) * 100).toFixed(0));
		}
		
		var shortOptions = bitArrayToBase62([
					((optionsView.showBuildingsOnly()) ? "1" : "0"),
					((optionsView.showTranscendent()) ? "1" : "0"),
					((optionsView.showLegacy()) ? "1" : "0"),
					((optionsView.showUnrendered()) ? "1" : "0")
				]);
		
		//Update link
		$("#shortlink").attr('href', _getUrl() + "?s=" + shortLat+"+"+shortLon+"+"+shortZoom+shortOptions+"+"+shortLvl+"+"+shortTiles);
	}
	
	/**
	 * Get URL parameters
	 * @return The parameters
	 */
	function _getParameters() {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		var params = new Object();
		
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			params[sParameterName[0]] = sParameterName[1];
		}
		
		return params;
	};

//INIT
	_init();
},



/**
 * The room names component
 */
NamesView: function() {
},



/**
 * The images overlay panel component
 */
ImagesView: function() {
},



/**
 * The loading overlay panel component
 */
LoadingView: function() {
//OTHER METHODS
	/**
	 * Shows or hides the loading component
	 * @param loading True if the application is loading something
	 */
	this.setLoading = function(loading) {
		if(loading) {
			$("#op-loading-info li").remove();
			$("#op-loading").show();
		}
		else {
			$("#op-loading").hide();
		}
	};
	
	/**
	 * Adds an information about the loading progress
	 * @param info The loading information to add
	 */
	this.addLoadingInfo = function(info) {
		//Add a new child in list, corresponding to the given message
		var newLi = document.createElement("li");
		$("#op-loading-info").append(newLi);
		
		//Add text to the added child
		$("#op-loading-info li:last-child").html(msg);
	};
},



/**
 * The about view
 */
AboutView: function() {
//CONSTRUCTOR
	$("#about-link").click(function() { $("#op-about").toggle(); });
	$("#about-close").click(function() { $("#op-about").hide(); });
},



/**
 * The messages stack component
 */
MessagesView: function() {
//ATTRIBUTES
	/** The amount of currently shown messages **/
	var _nbMessages = 0;
	
	/** The current object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The amount of currently shown messages
	 */
	this.getNbMessages = function() {
		return _nbMessages;
	};
	
//MODIFIERS
	/**
	 * Decreases the amount of currently shown messages
	 */
	this.decreaseNbMessages = function() {
		_nbMessages--;
	};
	
//OTHER METHODS
	/**
	 * Displays a message in the console and in a specific area of the page.
	 * @param msg The string to display
	 * @param type The kind of message (info, alert, error)
	 */
	this.displayMessage = function(msg, type) {
		//Add a new child in list, corresponding to the given message
		var line = '<li class="'+type+'">'+msg+'</li>';
		
		if(_nbMessages == 0) {
			$("#infobox").show();
			$("#infobox-list").append(line);
		}
		else {
			$("#infobox-list li:first-child").before(line);
		}
		
		_nbMessages++;
		
		//Remove that child after a delay
		setTimeout(function() {
			$("#infobox-list li").last().remove();
			_self.decreaseNbMessages();
			if(_self.getNbMessages() == 0) {
				$("#infobox").hide();
			}
		}, 5000);
	};
}

};

/**
 * This class handles current HTML view (as defined in MVC pattern).
 */
// Web: function(ctrl) {
// //ATTRIBUTES
// 	/** How many messages are currently shown **/
// 	var _nbMessages = 0;
// 	
// 	/** The leaflet map object **/
// 	var _map = null;
// 	
// 	/** The array which contains markers for polygon icons **/
// 	var _markersPolygons = null;
// 	
// 	/** The array which contains all polyline decorators **/
// 	var _markersLinestrings = null;
// 	
// 	/** The array which contains all labels **/
// 	var _markersLabels = null;
// 	
// 	/** The layer group that contains all overlay markers **/
// 	var _markersLayer = null;
// 	
// 	/** The current GeoJSON data layer on map **/
// 	var _dataLayer = null;
// 	
// 	/** The object that should be put in back of others **/
// 	var _objectLayered = null;
// 	
// 	/** Level parameter in URL **/
// 	var _urlLevel = null;
// 	
// 	/** Currently shown tile layer ID **/
// 	var _tileLayer = null;
// 	
// 	/** The pop-ups content array **/
// 	var _popups = null;
// 	
// 	/** Is the view in mobile device ? **/
// 	var _isMobile = false;
// 	
// 	/** The application controller **/
// 	var _ctrl = ctrl;
// 	
// 	/** The current object **/
// 	var _self = this;
// 
// //ACCESSORS
// 	/**
// 	 * Get an URL parameter
// 	 * @param sParam The wanted parameter
// 	 * @return The associated value
// 	 */
// 	this.getUrlParameter = function(sParam) {
// 		var sPageURL = window.location.search.substring(1);
// 		var sURLVariables = sPageURL.split('&');
// 		for (var i = 0; i < sURLVariables.length; i++) 
// 		{
// 			var sParameterName = sURLVariables[i].split('=');
// 			if (sParameterName[0] == sParam) 
// 			{
// 				return sParameterName[1];
// 			}
// 		}
// 	};
// 	
// 	/**
// 	 * @return The leaflet map object
// 	 */
// 	this.getMap = function() {
// 		return _map;
// 	};
// 	
// 	/**
// 	 * @return The level parameter in URL
// 	 */
// 	this.getUrlLevel = function() {
// 		return _urlLevel;
// 	};
// 	
// 	/**
// 	 * @return The current map latitude
// 	 */
// 	this.getLatitude = function() {
// 		return normLat(_map.getCenter().lat);
// 	};
// 	
// 	/**
// 	 * @return The current map longitude
// 	 */
// 	this.getLongitude = function() {
// 		return normLon(_map.getCenter().lng);
// 	};
// 	
// 	/**
// 	 * @return The currently shown level
// 	 */
// 	this.getCurrentLevel = function() {
// 		var level = parseFloat($("#level").val());
// 		return (isNaN(level)) ? null : level;
// 	};
// 	
// 	/**
// 	 * @return The map bounds as string for Overpass API
// 	 * @deprecated Use boundsString(bounds) in utils.js instead
// 	 */
// 	this.getMapBounds = function() {
// 		return normLat(_map.getBounds().getSouth())+","+normLon(_map.getBounds().getWest())+","+normLat(_map.getBounds().getNorth())+","+normLon(_map.getBounds().getEast());
// 	};
// 	
// 	/**
// 	 * @return The current data layer
// 	 */
// 	this.getDataLayer = function() {
// 		return _dataLayer;
// 	};
// 	
// 	/**
// 	 * @return Must we show transcendent objects ?
// 	 */
// 	this.showTranscendent = function() {
// 		return !_elementExists("#show-transcendent") || $("#show-transcendent").prop("checked");
// 	};
// 	
// 	/**
// 	 * @return Must we show objects with legacy tagging (buildingpart) ?
// 	 */
// 	this.showLegacy = function() {
// 		return !_elementExists("#show-legacy") || $("#show-legacy").prop("checked");
// 	};
// 	
// 	/**
// 	 * @return Must we show unrendered objects ?
// 	 */
// 	this.showUnrendered = function() {
// 		return _elementExists("#show-unrendered") && $("#show-unrendered").prop("checked");
// 	};
// 	
// 	/**
// 	 * @return Must we show only building objects ?
// 	 */
// 	this.showBuildingsOnly = function() {
// 		return _elementExists("#show-buildings-only") && $("#show-buildings-only").prop("checked");
// 	};
// 	
// 	/**
// 	 * @return True if something is loading
// 	 */
// 	this.isLoading = function() {
// 		return $("#op-loading").is(":visible");
// 	};
// 	
// 	/**
// 	 * @return True if the searched string for filtering rooms is long enough
// 	 */
// 	this.isSearchRoomLongEnough = function() {
// 		return _elementExists("#search-room") && $("#search-room").val() != "Search" && $("#search-room").val().length >= 3;
// 	};
// 	
// 	/**
// 	 * @return The search room string
// 	 */
// 	this.getSearchRoom = function() {
// 		return ($("#search-room").val() != "Search") ? $("#search-room").val() : "";
// 	};
// 	
// 	/**
// 	 * @return True if the given HTML element exists
// 	 */
// 	function _elementExists(html) {
// 		return $(html).length > 0;
// 	};
// 
// //MODIFIERS
// 	/**
// 	* Clears all messages.
// 	*/
// 	this.clearMessages = function() {
// 		$("#infobox-list li").remove();
// 		_nbMessages = 0;
// 	};
// 
// 	/**
// 	* Displays a message when the map is loading, and hides it when its done.
// 	* @param isLoading True if start loading, false if loading is done
// 	*/
// 	this.setLoading = function(isLoading) {
// 		$("#op-loading").toggle(isLoading);
// 		$("#op-loading-info li").remove();
// 	};
// 	
// 	/**
// 	 * Displays the given level in map and view.
// 	 * @param lvl The level to display
// 	 */
// 	this.setCurrentLevel = function(lvl) {
// 		$("#level").val(lvl);
// 	};
// 	
// 	/**
// 	 * Changes the currently shown tile layer
// 	 * @param name The tile layer name
// 	 */
// 	this.setTileLayer = function(name) {
// 		for(var i in OLvlUp.view.TILE_LAYERS) {
// 			if(OLvlUp.view.TILE_LAYERS[i].name == name) {
// 				_tileLayer = i;
// 				break;
// 			}
// 		}
// 	};
// 	
// 	/**
// 	 * Resets search room field
// 	 */
// 	this.resetSearchRoom = function() {
// 		if($("#search-room").val() == "Search" && $("#search-room").is(":focus")) {
// 			$("#search-room").val("");
// 		}
// 		else if(!$("#search-room").is(":focus")) {
// 			$("#search-room").val("Search");
// 		}
// 	};
// 
// //OTHER METHODS
// /*
//  * Map related methods
//  */
// 	/**
// 	 * This function initializes the Leaflet map
// 	 */
// 	this.mapInit = function(mobile) {
// 		_isMobile = mobile || false;
// 		
// 		//Init map center and zoom
// 		_map = L.map('map', {minZoom: 1, maxZoom: OLvlUp.view.MAX_ZOOM, zoomControl: false}).setView([47, 2], 6);
// 		if(!_isMobile) {
// 			L.control.zoom({ position: "topright" }).addTo(_map);
// 		}
// 		
// 		//Add search bar
// 		//TODO Remove mobile condition, only to get to time to solve search bar bug
// 		if(!_isMobile) {
// 			var search = L.Control.geocoder({ position: "topright" });
// 			//Limit max zoom in order to avoid having no tiles in background for small objects
// 			var minimalMaxZoom = OLvlUp.view.TILE_LAYERS[0].maxZoom;
// 			for(var i in OLvlUp.view.TILE_LAYERS) {
// 				if(OLvlUp.view.TILE_LAYERS[i].maxZoom < minimalMaxZoom) {
// 					minimalMaxZoom = OLvlUp.view.TILE_LAYERS[i].maxZoom;
// 				}
// 			}
// 			//Redefine markGeocode to avoid having an icon for the result
// 			search.markGeocode = function (result) {
// 				controller.getView().getMap().fitBounds(result.bbox, { maxZoom: minimalMaxZoom });
// 				return this;
// 			};
// 			search.addTo(_map);
// 		}
// 		
// 		if(_isMobile) {
// 			L.control.zoom({ position: "topright" }).addTo(_map);
// 		}
// 		
// 		//If coordinates are given in URL, then make map show the wanted area
// 		var bbox = _self.getUrlParameter("bbox");
// 		var lat = _self.getUrlParameter("lat");
// 		var lon = _self.getUrlParameter("lon");
// 		var zoom = _self.getUrlParameter("zoom");
// 		var short = _self.getUrlParameter("s");
// 		var legacy = parseInt(_self.getUrlParameter("legacy"));
// 		var transcend = parseInt(_self.getUrlParameter("transcend"));
// 		var unrendered = parseInt(_self.getUrlParameter("unrendered"));
// 		var buildingsOnly = parseInt(_self.getUrlParameter("buildings"));
// 		var lvl = _self.getUrlParameter("level");
// 		var tiles = _self.getUrlParameter("tiles");
// 		
// 		//Read shortlink
// 		if(short != null) {
// 			var regex = /^(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+([A-Z])([a-zA-Z0-9]+)\+(?:(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+))?(?:\+([a-zA-Z0-9]+))?$/;
// 			if(regex.test(short)) {
// 				var shortRes = regex.exec(short);
// 				lat = base62toDec(shortRes[2]) + base62toDec(shortRes[3]) / 100000;
// 				if(shortRes[1] == "-") { lat = -lat; }
// 				
// 				lon = base62toDec(shortRes[5]) + base62toDec(shortRes[6]) / 100000;
// 				if(shortRes[4] == "-") { lon = -lon; }
// 				
// 				zoom = letterToInt(shortRes[7]);
// 				
// 				var options = intToBitArray(base62toDec(shortRes[8]));
// 				while(options.length < 4) { options = "0" + options; }
// 				unrendered = options[options.length - 1];
// 				legacy = options[options.length - 2];
// 				transcend = options[options.length - 3];
// 				buildingsOnly = options[options.length - 4];
// 				
// 				//Get level if available
// 				if(shortRes[10] != undefined && shortRes[11] != undefined) {
// 					lvl = base62toDec(shortRes[10]) + base62toDec(shortRes[11]) / 100;
// 					if(shortRes[9] == "-") { lvl = -lvl; }
// 				}
// 				
// 				//Get tiles if available
// 				if(shortRes[12] != undefined) {
// 					tiles = base62toDec(shortRes[12]);
// 				}
// 			}
// 			else {
// 				_self.displayMessage("Invalid short link", "alert");
// 			}
// 		}
// 		
// 		//BBox
// 		if(bbox != null) {
// 			//Get latitude and longitude information from BBox string
// 			var coordinates = bbox.split(',');
// 			
// 			if(coordinates.length == 4) {
// 				var sw = L.latLng(coordinates[1], coordinates[0]);
// 				var ne = L.latLng(coordinates[3], coordinates[2]);
// 				var bounds = L.latLngBounds(sw, ne);
// 				_map.fitBounds(bounds);
// 			}
// 			else {
// 				_self.displayMessage("Invalid bounding box", "alert");
// 			}
// 		}
// 		//Lat, lon, zoom
// 		else if(lat != null && lon != null && zoom != null) {
// 			_map.setView(L.latLng(lat, lon), zoom);
// 		}
// 		//If missing parameter
// 		else if(lat != null || lon != null || zoom != null) {
// 			_self.displayMessage("Missing parameter in permalink", "error");
// 		}
// 		
// 		//Restore settings from URL
// 		if(legacy != null && (legacy == 0 || legacy == 1)) {
// 			$("#show-legacy").prop("checked", legacy == 1);
// 		}
// 		
// 		if(transcend != null && (transcend == 0 || transcend == 1)) {
// 			$("#show-transcendent").prop("checked", transcend == 1);
// 		}
// 		
// 		if(unrendered != null && (unrendered == 0 || unrendered == 1)) {
// 			$("#show-unrendered").prop("checked", unrendered == 1);
// 		}
// 		
// 		if(buildingsOnly != null && (buildingsOnly == 0 || buildingsOnly == 1)) {
// 			$("#show-buildings-only").prop("checked", buildingsOnly == 1);
// 		}
// 		
// 		_urlLevel = lvl;
// 		
// 		//Create tile layers
// 		var tileLayers = new Array();
// 		var firstLayer = true;
// 		
// 		for(var l in OLvlUp.view.TILE_LAYERS) {
// 			var currentLayer = OLvlUp.view.TILE_LAYERS[l];
// 			tileLayers[currentLayer.name] = new L.TileLayer(
// 				currentLayer.URL,
// 				{
// 					minZoom: currentLayer.minZoom,
// 					maxZoom: currentLayer.maxZoom,
// 					attribution: currentLayer.attribution+" | "+OLvlUp.view.ATTRIBUTION
// 				}
// 			);
// 			
// 			if(firstLayer && tiles == undefined) {
// 				_map.addLayer(tileLayers[currentLayer.name]);
// 				firstLayer = false;
// 				_tileLayer = l;
// 			}
// 			else if(l == tiles) {
// 				_map.addLayer(tileLayers[currentLayer.name]);
// 				_tileLayer = l;
// 			}
// 		}
// 		L.control.layers(tileLayers).addTo(_map);
// 		
// 		//Add triggers on HTML elements
// 		$("#level").change(controller.onMapChange);
// 		$("#levelUp").click(controller.levelUp);
// 		$("#levelDown").click(controller.levelDown);
// 		$("#about-link").click(function() { $("#op-about").toggle(); });
// 		$("#about-close").click(function() { $("#op-about").hide(); });
// 		$("#images-close").click(function() { $("#op-images").hide(); });
// 		$("#show-transcendent").change(controller.onMapChange);
// 		$("#show-legacy").change(controller.onMapLegacyChange);
// 		$("#show-unrendered").change(controller.onMapChange);
// 		$("#show-buildings-only").change(controller.onMapChange);
// 		$("#export-link").click(controller.onExportLevel);
// 		$("#export-link-img").click(controller.onExportLevelImage);
// 		$("#search-room").click(controller.getView().onSearchRoomFocusChange);
// 		$("#search-room").focus(controller.getView().onSearchRoomFocusChange);
// 		$("#search-room").focusout(controller.getView().onSearchRoomFocusChange);
// 		$("#search-room").bind("input propertychange", controller.onSearchRoomChange);
// 		$("#search-room-reset").click(controller.resetRoomNames);
// 		$("#button-rooms").click(controller.onShowRooms);
// 		$("#button-export").click(controller.onShowExport);
// 		$("#button-settings").click(controller.onShowSettings);
// 		$("#central-close").click(controller.getView().hideCentralPanel);
// 		_map.on("baselayerchange", controller.onMapChange);
// 		_map.on("layeradd", controller.onLayerAdd);
// 		
// 		//Central panel management
// 		$("#button-rooms").hide();
// 		$("#button-export").hide();
// 		_self.hideCentralPanel();
// 		
// 		//Reset search room field
// 		_self.resetSearchRoom();
// 	};
// 	
// 	/**
// 	 * Refreshes the shown data on map.
// 	 * @param mapData The map data object
// 	 */
// 	this.refreshMap = function(mapData) {
// 		//Delete old data contained in map
// 		if(_dataLayer != null) {
// 			_map.removeLayer(_dataLayer);
// 			_dataLayer = null;
// 		}
// 		if(_markersLayer != null) {
// 			_map.removeLayer(_markersLayer);
// 			_markersLayer = null;
// 		}
// 		if(_objectLayered != null) {
// 			_objectLayered = null;
// 		}
// 		
// 		$("#button-export").hide();
// 		$("#button-rooms").hide();
// 
// 		//Recreate data layer and add it to map
// 		//The shown data depends of current zoom level
// 		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
// 			if(mapData.getLevels() != null && mapData.getLevels().length > 0) {
// 				_objectLayered = new Object();
// 				_markersPolygons = new Object();
// 				_markersLinestrings = new Object();
// 				_markersLabels = new Object();
// 				_popups = new Object();
// 				_dataLayer = L.geoJson(
// 					mapData.getAsGeoJSON(),
// 					{
// 						filter: _filterElements,
// 						style: _styleElements,
// 						pointToLayer: _styleNodes,
// 						onEachFeature: _processElements
// 					}
// 				);
// 
// 				_markersLayer = L.layerGroup();
// 				
// 				//Add eventual polygon icons
// 				if(_markersPolygons != null && Object.keys(_markersPolygons).length > 0) {
// 					for(var i in _markersPolygons) {
// 						_markersLayer.addLayer(_markersPolygons[i]);
// 					}
// 				}
// 				
// 				//Add eventual linestring icons
// 				if(_markersLinestrings != null && Object.keys(_markersLinestrings).length > 0) {
// 					for(var i in _markersLinestrings) {
// 						_markersLayer.addLayer(_markersLinestrings[i]);
// 					}
// 				}
// 				
// 				//Add eventual linestring icons
// 				if(_markersLabels != null && Object.keys(_markersLabels).length > 0) {
// 					for(var i in _markersLabels) {
// 						_markersLayer.addLayer(_markersLabels[i]);
// 					}
// 				}
// 				
// 				_markersLayer.addTo(_map);
// 				
// 				$("#button-export").show();
// 				$("#button-rooms").show();
// 			}
// 			else {
// 				_self.displayMessage("There is no available data in this area", "alert");
// 			}
// 		}
// 		else if(_map.getZoom() >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
// 			if(mapData.getData() != null) {
// 				_dataLayer = new L.MarkerClusterGroup({
// 					singleMarkerMode: true,
// 					spiderfyOnMaxZoom: false,
// 					maxClusterRadius: 30
// 				});
// 				_dataLayer.addLayer(L.geoJson(mapData.getData()));
// 			}
// 			else {
// 				_self.displayMessage("There is no available data in this area", "alert");
// 			}
// 		}
// 
// 		//Add data layer to map
// 		if(_dataLayer != null) {
// 			_dataLayer.addTo(_map);
// 			
// 			//Rearrange object depending of their layer value
// 			if(_objectLayered != null) {
// 				//Arrange objects regarding to layers in style
// 				var objectLayeredKeys = Object.keys(_objectLayered);
// 
// 				if(objectLayeredKeys.length > 0) {
// 					objectLayeredKeys.sort(function (a,b) { return parseFloat(b)-parseFloat(a);});
// 
// 					for(var i in objectLayeredKeys) {
// 						for(var j in _objectLayered[objectLayeredKeys[i]]) {
// 							if(_objectLayered[objectLayeredKeys[i]][j] instanceof L.Path) {
// 								_objectLayered[objectLayeredKeys[i]][j].bringToBack();
// 							}
// 						}
// 					}
// 				}
// 			}
// 		}
// 		
// 		_changeTilesOpacity();
// 		
// 		//Update permalink
// 		_self.updatePermalink(_map);
// 		$.event.trigger({ type: "donerefresh" });
// 	};
// 	
// 	/**
// 	 * Opens a pop-up at given coordinates
// 	 * @param id The pop-up ID (for example, "node12345")
// 	 */
// 	this.openPopup = function(id) {
// 		if(_popups[id] == undefined) {
// 			//Search for feature
// 			_dataLayer.eachLayer(function(l) {
// 				if(l.feature != undefined && l.feature.properties.getId() == id) {
// 					_popups[id] = _createPopup(l.feature.properties);
// 				}
// 			});
// 		}
// 		
// 		if(_popups[id] != undefined) {
// 			_map.openPopup(_popups[id]);
// 		}
// 		else {
// 			console.log(id);
// 		}
// 	}
// 	
// 	/**
// 	 * Changes the tiles opacity, depending of shown level
// 	 */
// 	function _changeTilesOpacity() {
// 		var newOpacity = 1;
// 		var levelsArray = _ctrl.getMapData().getLevels();
// 		
// 		 if(levelsArray != null) {
// 			//Find level 0 index in levels array
// 			var levelZero = levelsArray.indexOf(0);
// 			var midLevel = (levelZero >= 0) ? levelZero : Math.floor(levelsArray.length / 2);
// 			
// 			//Extract level sub-arrays
// 			var levelsNegative = levelsArray.slice(0, midLevel);
// 			var levelsPositive = levelsArray.slice(midLevel+1);
// 			
// 			//Calculate new opacity, depending of level position in levels array
// 			if(_self.getCurrentLevel() != null) {
// 				var idNeg = levelsNegative.indexOf(_self.getCurrentLevel());
// 				var idPos = levelsPositive.indexOf(_self.getCurrentLevel());
// 				if(idNeg >= 0) {
// 					var coef = idNeg / levelsNegative.length * (OLvlUp.view.TILES_MAX_OPACITY - OLvlUp.view.TILES_MIN_OPACITY);
// 					newOpacity = OLvlUp.view.TILES_MIN_OPACITY + coef;
// 				}
// 				else if(idPos >= 0) {
// 					var coef = (levelsPositive.length - 1 - idPos) / levelsPositive.length * (OLvlUp.view.TILES_MAX_OPACITY - OLvlUp.view.TILES_MIN_OPACITY);
// 					newOpacity = OLvlUp.view.TILES_MIN_OPACITY + coef;
// 				}
// 				else {
// 					newOpacity = OLvlUp.view.TILES_MAX_OPACITY;
// 				}
// 			}
// 		}
// 		
// 		//Update tiles opacity
// 		_map.eachLayer(function(layer) {
// 			if(layer instanceof L.TileLayer) {
// 				layer.setOpacity(newOpacity);
// 			}
// 		} );
// 	}
// 
// /*
//  * Data style and filters
//  */
// 	/**
// 	* This function is run everytime an element is added on the map (see onEachFeature for GeoJSON in Leaflet)
// 	* @param feature The GeoJSON feature to analyse
// 	* @param layer The leaflet layer
// 	*/
// 	function _processElements(feature, layer) {
// 		var ft = feature.properties;
// 		var ftId = ft.getId();
// 		var ftGeomSegments = ft.getGeometry().get().coordinates.length;
// 		var name = ft.getName();
// 		var styleRules = ft.getStyle().get();
// 		
// 		//Create popup if necessary
// 		if(styleRules.popup == undefined || styleRules.popup == "yes") {
// 			//And add popup to layer
// 			var popup = _createPopup(ft);
// 			_popups[ftId] = popup;
// 			layer.bindPopup(popup);
// 			if(_markersPolygons[ftId] != undefined) {
// 				_markersPolygons[ftId].bindPopup(popup);
// 			}
// 
// 			if(_markersLinestrings[ftId+"-0"] != undefined) {
// 				var nbSegments = ftGeomSegments - 1;
// 				
// 				//For each segment, add popup
// 				for(var i=0; i < nbSegments; i++) {
// 					_markersLinestrings[ftId+"-"+i].bindPopup(popup);
// 				}
// 			}
// 			
// 			if(_markersLabels[ftId] != undefined) {
// 				_markersLabels[ftId].bindPopup(popup);
// 			}
// 			else if(_markersLabels[ftId+"-0"] != undefined) {
// 				var nbSegments = ftGeomSegments - 1;
// 				
// 				//For each segment, add popup
// 				for(var i=0; i < nbSegments; i++) {
// 					_markersLabels[ftId+"-"+i].bindPopup(popup);
// 				}
// 			}
// 		}
// 		
// 		//Send this object to back of other layers
// 		if(styleRules.layer != undefined) {
// 			styleRules.layer = parseFloat(styleRules.layer);
// 			if(!isNaN(styleRules.layer)) {
// 				if(_objectLayered[styleRules.layer] == undefined) {
// 					_objectLayered[styleRules.layer] = new Array();
// 				}
// 				_objectLayered[styleRules.layer].push(layer);
// 			}
// 		}
// 	}
// 
// 	/**
// 	* Filter GeoJSON elements depending of their level.
// 	* @param feature The GeoJSON feature to analyse
// 	* @param layer The leaflet layer
// 	* @return True if should be shown
// 	*/
// 	function _filterElements(feature, layer) {
// 		var ft = feature.properties;
// 		var ftGeom = ft.getGeometry();
// 		var ftTags = ft.getTags();
// 		var ftLevels = ft.onLevels();
// 		
// 		var addObject = _map.getBounds().intersects(ftGeom.getBounds());
// 		
// 		//Consider level-related tags
// 		if(ftLevels.length > 0) {
// 			addObject &= Object.keys(ft.getTags()).length > 0
// 			&& (Object.keys(ftTags).length > 1 || ftTags.area == undefined)
// 					&& ftLevels.indexOf(_self.getCurrentLevel()) >= 0
// 					&& (_self.showTranscendent() || ftLevels.length == 1)
// 					&& (_self.showLegacy() || ftTags.buildingpart == undefined)
// 					&& (!_self.showBuildingsOnly() || ftTags.building != undefined)
// 					&& (_self.showUnrendered() || Object.keys(ft.getStyle().get()).length > 0);
// 		}
// 		//Consider objects without levels but connected to door elements
// 		else {
// 			//Building with min and max level
// 			addObject &= ftTags.building != undefined
// 					&& ftTags.min_level != undefined
// 					&& ftTags.max_level != undefined;
// 
// 			//Elevator
// 			if(_self.showTranscendent() && !_self.showBuildingsOnly()) {
// 				addObject = addObject || ftTags.highway == "elevator";
// 			}
// 		}
// 		
// 		//Display unrendered objects
// 		/*if(!addObject) {
// 			console.log("Unrendered object:");
// 			console.log(feature);
// 		}*/
// 
// 		return addObject;
// 	}
// 	
// 	/**
// 	 * Filter building contained in GeoJSON elements.
// 	 * @param feature The GeoJSON feature to analyse
// 	 * @param layer The leaflet layer
// 	 * @return True if should be shown
// 	 */
// 	function _filterBuildingElements(feature, layer) {
// 		return feature.properties.tags.building != undefined;
// 	}
// 
// 	/**
// 	* Applies the appropriate style on the given feature.
// 	* @param feature The GeoJSON element to decorate
// 	* @return The style
// 	*/
// 	function _styleElements(feature) {
// 		var ft = feature.properties;
// 		var result = ft.getStyle().get();
// 		var hasIcon = result.icon != undefined;
// 		var labelizable = _labelizable(ft);
// 		
// 		if(hasIcon || labelizable) {
// 			var ftGeom = ft.getGeometry();
// 			//This add a marker if a polygon has its "icon" property defined
// 			if(ftGeom.getType() == "Polygon") {
// 				var centroid = ftGeom.getCentroid();
// 				var coord = L.latLng(centroid[1], centroid[0]);
// 				
// 				if(hasIcon) {
// 					var marker = _createMarker(coord, ft, result);
// 					_markersPolygons[ft.getId()] = marker;
// 				}
// 				
// 				//Labels
// 				if(labelizable) {
// 					_markersLabels[ft.getId()] = _createLabel(
// 						feature,
// 						coord,
// 						hasIcon);
// 				}
// 			}
// 			else if(ftGeom.getType() == "LineString") {
// 				var ftGeomJSON = ftGeom.get();
// 				var nbSegments = ftGeomJSON.coordinates.length - 1;
// 				
// 				//For each segment, add an icon
// 				for(var i=0; i < nbSegments; i++) {
// 					var coord1 = ftGeomJSON.coordinates[i];
// 					var coord2 = ftGeomJSON.coordinates[i+1];
// 					var coordMid = [ (coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2 ];
// 					var angle = azimuth({lat: coord1[1], lng: coord1[0], elv: 0}, {lat: coord2[1], lng: coord2[0], elv: 0}).azimuth;
// 					var coord = L.latLng(coordMid[1], coordMid[0]);
// 					
// 					if(hasIcon) {
// 						var myIcon = L.icon({
// 							iconUrl: OLvlUp.view.ICON_FOLDER+'/'+result.icon,
// 							iconSize: [OLvlUp.view.ICON_SIZE, OLvlUp.view.ICON_SIZE],
// 							iconAnchor: [OLvlUp.view.ICON_SIZE/2, OLvlUp.view.ICON_SIZE/2],
// 							popupAnchor: [0, -OLvlUp.view.ICON_SIZE/2]
// 						});
// 						
// 						var marker = null;
// 						
// 						if(result.rotateIcon) {
// 							marker = _createMarker(coord, ft, result, angle);
// 						}
// 						else {
// 							marker = _createMarker(coord, ft, result);
// 						}
// 
// 						_markersLinestrings[ft.getId()+"-"+i] = marker;
// 					}
// 					
// 					//Labels
// 					if(labelizable) {
// 						_markersLabels[ft.getId()+"-"+i] = _createLabel(
// 							feature,
// 							coord,
// 							hasIcon,
// 							angle);
// 					}
// 				}
// 			}
// 		}
// 		
// 		return result;
// 	}
// 	
// 	/**
// 	 * Returns the appropriate style for a given OSM element (depending of its tags)
// 	 * @param feature The GeoJSON feature
// 	 * @return The appropriate style
// 	 */
// // 	function _getStyle(feature) {
// // 		if(feature.getStyle() == undefined) {
// // 			if(STYLE != undefined) {
// // 				feature.properties.style = new OLvlUp.model.FeatureStyle(feature, STYLE);
// // 			}
// // 			else {
// // 				controller.getView().displayMessage("Error while loading style file", "error");
// // 			}
// // 		}
// // 		
// // 		return feature.properties.style.getStyle();
// // 	}
// 
// 	/**
// 	* Returns the appropriate style for a given OSM node element (depending of its tags)
// 	* @param feature The GeoJSON element to decorate
// 	* @param latlng Its coordinates
// 	* @return The style
// 	*/
// 	function _styleNodes(feature, latlng) {
// 		var result;
// 		var ft = feature.properties;
// 		
// 		//Find the appropriate icon, depending of tags
// 		var style = _styleElements(feature);
// 		
// 		result = _createMarker(latlng, ft, style);
// 		
// 		//Labels
// 		if(_labelizable(ft)) {
// 			_markersLabels[ft.getId()] = _createLabel(feature, latlng, true);
// 		}
// 		
// 		return result;
// 	}
// 	
// 	/**
// 	 * Creates a marker
// 	 * @param latlng The latitude and longitude of the marker
// 	 * @param ft The feature which will be represented
// 	 * @param style The feature style
// 	 * @param angle The rotation angle (default: 0)
// 	 * @return The leaflet marker, or null
// 	 */
// 	function _createMarker(latlng, ft, style, angle) {
// 		var result = null;
// 		var iconUrl = null;
// 		angle = angle || null;
// 		
// 		if(style.icon != undefined && style.icon != null && style.icon != '') {
// 			var tmpUrl = ft.getStyle().getIconUrl();
// 			
// 			if(tmpUrl != null) {
// 				iconUrl = OLvlUp.view.ICON_FOLDER+'/'+tmpUrl;
// 			}
// 			else if(style.showMissingIcon == undefined || style.showMissingIcon) {
// 				iconUrl = OLvlUp.view.ICON_FOLDER+'/default.svg';
// 			}
// 		}
// 		else if(style.showMissingIcon == undefined || style.showMissingIcon) {
// 			result = L.circleMarker(latlng, style);
// 		}
// 		
// 		if(iconUrl != null) {
// 			var myIcon = L.icon({
// 				iconUrl: iconUrl,
// 				iconSize: [OLvlUp.view.ICON_SIZE, OLvlUp.view.ICON_SIZE],
// 				iconAnchor: [OLvlUp.view.ICON_SIZE/2, OLvlUp.view.ICON_SIZE/2],
// 				popupAnchor: [0, -OLvlUp.view.ICON_SIZE/2]
// 			});
// 			
// 			if(angle != null) {
// 				result = L.rotatedMarker(latlng, {icon: myIcon, angle: angle});
// 			}
// 			else {
// 				result = L.marker(latlng, {icon: myIcon});
// 			}
// 		}
// 		else {
// 			result = L.circleMarker(latlng, { opacity: 0, fillOpacity: 0 });
// 		}
// 		
// 		return result;
// 	}
// 	
// 	/**
// 	 * Creates the label (as a marker) for the given feature
// 	 * @param feature The feature
// 	 * @param coordinates The coordinates of the point where the label will be rendered
// 	 * @param hasMarker Does this feature will also be rendered as a marker (icon/circle) ?
// 	 * @param angle The rotation angle for label (default: 0)
// 	 * @return The label as a leaflet marker
// 	 */
// 	function _createLabel(feature, coordinates, hasMarker, angle) {
// 		var ft = feature.properties;
// 		var styleRules = ft.getStyle().get();
// 		var angle = angle || false;
// 		if(angle != false) {
// 			angle = (angle >= 90) ? angle - 90 : angle + 270;
// 			angle = angle % 180;
// 		}
// 		
// 		var classes = (styleRules.labelStyle != undefined) ? ' '+styleRules.labelStyle : '';
// 		var text = ft.getTag(styleRules.label);
// 		var iconAnchor = (hasMarker) ? [ null, -OLvlUp.view.ICON_SIZE/2] : [ null, OLvlUp.view.ICON_SIZE/2 ];
// 		var rotation = (angle) ? ' style="transform: rotate('+angle+'deg);"' : '';
// 		
// 		var label = L.marker(coordinates, {
// 			icon: L.divIcon({
// 				className: 'tlabel'+classes,   // Set class for CSS styling
// 				html: '<div'+rotation+'>'+text+'</div>',
// 				iconAnchor: iconAnchor,
// 				iconSize: [ 70, null ]
// 			}),
// 			draggable: false,       // Allow label dragging...?
// 			//zIndexOffset: 9000     // Make appear above other map features
// 		});
// 		
// 		return label;
// 	};
// 	
// 	/**
// 	 * Should the feature receive a label ?
// 	 * @param ft The feature
// 	 * @return True if it should have a label
// 	 */
// 	function _labelizable(ft) {
// 		var ftStyle = ft.getStyle().get();
// 		return ftStyle.label != undefined && ftStyle.label != null && ft.getTag(ftStyle.label) != undefined;
// 	};
// 	
// 	/**
// 	 * Creates the popup for a given feature
// 	 * @param feature The feature the popup will be created for
// 	 * @return The text the popup will contain
// 	 */
// 	function _createPopup(ft) {
// 		var name = ft.getName();
// 		var styleRules = ft.getStyle().get();
// 		
// 		/*
// 		 * Title
// 		 */
// 		var text = '<h1 class="popup">';
// 		
// 		//Add icon in title
// 		if(styleRules.icon != undefined) {
// 			var iconUrl = ft.getStyle().getIconUrl();
// 			if(iconUrl != null) {
// 				text += '<img class="icon" src="'+OLvlUp.view.ICON_FOLDER+'/'+iconUrl+'" /> ';
// 			}
// 		}
// 		
// 		//Object name (its name tag or its type)
// 		text += (ft.getTag("name") != undefined) ? ft.getTag("name") : name;
// 		
// 		//Add up and down icons if levelup property == true
// 		var ftLevels = ft.onLevels();
// 		if(styleRules.levelup && ftLevels.length > 0 && !_isMobile) {
// 			//Able to go up ?
// 			var levelId = ftLevels.indexOf(_self.getCurrentLevel());
// 			if(levelId < ftLevels.length -1) {
// 				text += ' <a onclick="controller.toLevel('+ftLevels[levelId+1]+')" href="#"><img src="'+OLvlUp.view.ICON_FOLDER+'/arrow_up.png" title="Go up" alt="Up!" /></a>';
// 			}
// 			//Able to go down ?
// 			if(levelId > 0) {
// 				text += ' <a onclick="controller.toLevel('+ftLevels[levelId-1]+')" href="#"><img src="'+OLvlUp.view.ICON_FOLDER+'/arrow_down.png" title="Go down" alt="Down!" /></a>';
// 			}
// 		}
// 		
// 		//End title
// 		text += '</h1>';
// 		
// 		//Navigation bar
// 		if(!_isMobile) {
// 			text += '<div class="popup-nav"><div class="row">';
// 			text += '<div class="item selected" id="item-general"><a href="#" onclick="controller.changePopupTab(\'general\');">General</a></div>';
// 			text += '<div class="item" id="item-technical"><a href="#" onclick="controller.changePopupTab(\'technical\');">Technical</a></div>';
// 			text += '<div class="item" id="item-tags"><a href="#" onclick="controller.changePopupTab(\'tags\');">Tags</a></div>';
// 			text += '</div></div>';
// 		}
// 		
// 		/*
// 		 * Tab 1 : general information
// 		 */
// 		text += '<div class="popup-tab" id="popup-tab-general">';
// 		generalTxt = '';
// 		generalTxt += _addFormatedTag(ft, "vending", "Selling", removeUscore);
// 		generalTxt += _addFormatedTag(ft, "information", "Type", removeUscore);
// 		generalTxt += _addFormatedTag(ft, "artwork_type", "Type", removeUscore);
// 		generalTxt += _addFormatedTag(ft, "access", "Access");
// 		generalTxt += _addFormatedTag(ft, "artist", "Creator");
// 		generalTxt += _addFormatedTag(ft, "artist_name", "Creator");
// 		generalTxt += _addFormatedTag(ft, "architect", "Architect");
// 		generalTxt += _addFormatedTag(ft, "opening_hours", "Opening hours");
// 		generalTxt += _addFormatedTag(ft, "start_date", "Created in");
// 		generalTxt += _addFormatedTag(ft, "historic:era", "Era", removeUscore);
// 		generalTxt += _addFormatedTag(ft, "historic:period", "Period", removeUscore);
// 		generalTxt += _addFormatedTag(ft, "historic:civilization", "Civilization", removeUscore);
// 		generalTxt += _addFormatedTag(ft, "website", "Website", asWebLink);
// 		generalTxt += _addFormatedTag(ft, "contact:website", "Website", asWebLink);
// 		generalTxt += _addFormatedTag(ft, "phone", "Phone");
// 		generalTxt += _addFormatedTag(ft, "contact:phone", "Phone");
// 		generalTxt += _addFormatedTag(ft, "email", "E-mail");
// 		generalTxt += _addFormatedTag(ft, "contact:email", "E-mail");
// 		generalTxt += _addFormatedTag(ft, "fee", "Fee");
// 		generalTxt += _addFormatedTag(ft, "atm", "With ATM");
// 		generalTxt += _addFormatedTag(ft, "payment:coins", "Pay with coins");
// 		generalTxt += _addFormatedTag(ft, "payment:credit_cards", "Pay with credit cards");
// 		generalTxt += _addFormatedTag(ft, "currency:EUR", "Pay in €");
// 		generalTxt += _addFormatedTag(ft, "currency:USD", "Pay in US $");
// 		generalTxt += _addFormatedTag(ft, "female", "For women");
// 		generalTxt += _addFormatedTag(ft, "male", "For men");
// 		generalTxt += _addFormatedTag(ft, "bicycle", "For bicycle");
// 		generalTxt += _addFormatedTag(ft, "foot", "On foot");
// 		generalTxt += _addFormatedTag(ft, "wheelchair", "For wheelchair");
// 		generalTxt += _addFormatedTag(ft, "seats", "Seats");
// 		generalTxt += _addFormatedTag(ft, "waste", "Waste",removeUscore);
// 		generalTxt += _addFormatedTag(ft, "cuisine", "Cuisine", removeUscore);
// 		
// 		generalTxt += _addFormatedTag(ft, "description", "Details");
// 		
// 		//Image rendering
// 		if(ft.hasImages()) {
// 			generalTxt += '<p class="popup-txt centered"><a href="#" id="images-open" onclick="controller.openImages(\''+ft.getId()+'\')">See related images</a></p>';
// 		}
// 		
// 		if(generalTxt == '' && !_isMobile) { generalTxt = "No general information (look at tags)"; }
// 		text += generalTxt;
// 		
// 		text += '</div>';
// 		
// 		/*
// 		 * Tab 2 : technical information
// 		 */
// 		if(!_isMobile) {
// 			text += '<div class="popup-tab hidden" id="popup-tab-technical">';
// 			
// 			technicalTxt = '';
// 			technicalTxt += _addFormatedTag(ft, "width", "Width", addDimensionUnit);
// 			technicalTxt += _addFormatedTag(ft, "height", "Height", addDimensionUnit);
// 			technicalTxt += _addFormatedTag(ft, "length", "Length", addDimensionUnit);
// 			technicalTxt += _addFormatedTag(ft, "direction", "Direction", orientationValue);
// 			technicalTxt += _addFormatedTag(ft, "camera:direction", "Direction (camera)", orientationValue);
// 			technicalTxt += _addFormatedTag(ft, "operator", "Operator");
// 			technicalTxt += _addFormatedTag(ft, "ref", "Reference");
// 			technicalTxt += _addFormatedTag(ft, "material", "Made of");
// 			
// 			if(technicalTxt == '') { technicalTxt = "No technical information (look at tags)"; }
// 			text += technicalTxt;
// 			
// 			text += '</div>';
// 		}
// 		
// 		/*
// 		 * Tab 3 : tags
// 		 */
// 		if(!_isMobile) {
// 			text += '<div class="popup-tab hidden" id="popup-tab-tags">';
// 			
// 			//List all tags
// 			text += '<p class="popup-txt">';
// 			var ftTags = ft.getTags();
// 			for(i in ftTags) {
// 				//Render specific tags
// 				//URLs
// 				var urlTags = ["image", "website", "contact:website", "url"];
// 				if(urlTags.indexOf(i) >= 0) {
// 					text += i+' = <a href="'+ftTags[i]+'">'+ftTags[i]+'</a>';
// 				}
// 				//Wikimedia commons
// 				else if(i == "wikimedia_commons") {
// 					text += i+' = <a href="https://commons.wikimedia.org/wiki/'+ftTags[i]+'">'+ftTags[i]+'</a>';
// 				}
// 				else {
// 					text += i+" = "+ftTags[i];
// 				}
// 				text += "<br />";
// 			}
// 
// 			//text += ft.properties.style.getStyle().layer;
// 			text += "</p>";
// 			
// 			text += '</div>';
// 		}
// 		
// 		/*
// 		 * Footer
// 		 */
// 		//Link to osm.org object
// 		text += '<p class="popup-txt centered"><a href="http://www.openstreetmap.org/'+ft.getId()+'">See this on OSM.org</a></p>';
// 		
// 		coords = ft.getGeometry().getCentroid();
// 		
// 		var options = (_isMobile) ? { autoPan: false } : {};
// 		
// 		return L.popup(options).setContent(text).setLatLng(L.latLng(coords[1], coords[0]));
// 	}
// 	
// 	/**
// 	 * Creates a formated tag display
// 	 * @param feature The concerned feature
// 	 * @param key The OSM key to display
// 	 * @param cleanName The clean name to display
// 	 * @param tagCleaner The function that will clean the tag value (for example, add proper unit for dimensions), optional
// 	 * @return The formated tag, or empty string if not found
// 	 */
// 	function _addFormatedTag(feature, key, cleanName, tagCleaner) {
// 		var text = '';
// 		if(tagCleaner == undefined) { tagCleaner = function(v) { return v; }; }
// 		
// 		if(feature.getTag(key) != undefined) {
// 			text = '<b>'+cleanName+':</b> '+tagCleaner(feature.getTag(key))+'<br />';
// 		}
// 		
// 		return text;
// 	}
// 	
// /*
//  * Levels management
//  */
// 	/**
// 	 * Makes the level increase of one step
// 	 * @param mapData The current map data object
// 	 */
// 	this.levelUp = function(mapData) {
// 		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
// 			var currentLevelId = mapData.getLevels().indexOf(_self.getCurrentLevel());
// 			
// 			if(currentLevelId == -1) {
// 				_self.displayMessage("Invalid level", "error");
// 			}
// 			else if(currentLevelId + 1 < mapData.getLevels().length) {
// 				_self.setCurrentLevel(mapData.getLevels()[currentLevelId+1]);
// 				_self.refreshMap(mapData);
// 			}
// 			else {
// 				_self.displayMessage("You are already at the last available level", "alert");
// 			}
// 		}
// 	};
// 	
// 	/**
// 	 * Makes the level decrease of one step
// 	 * @param mapData The current map data object
// 	 */
// 	this.levelDown = function(mapData) {
// 		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
// 			var currentLevelId = mapData.getLevels().indexOf(_self.getCurrentLevel());
// 			
// 			if(currentLevelId == -1) {
// 				_self.displayMessage("Invalid level", "error");
// 			}
// 			else if(currentLevelId > 0) {
// 				_self.setCurrentLevel(mapData.getLevels()[currentLevelId-1]);
// 				_self.refreshMap(mapData);
// 			}
// 			else {
// 				_self.displayMessage("You are already at the first available level", "alert");
// 			}
// 		}
// 	};
// 	
// 	/**
// 	 * This function updates the select field for levels
// 	 * @param levelsArray The levels array (must be already sorted)
// 	 */
// 	this.populateSelectLevels = function(levelsArray) {
// 		var option = '';
// 		
// 		//Compute level and store them as select options
// 		for(var i=0; i < levelsArray.length; i++) {
// 			option += '<option value="'+ levelsArray[i] + '">' + levelsArray[i] + '</option>';
// 		}
// 		
// 		$('#level').empty();
// 		
// 		//If levels array isn't empty, we add options
// 		if(option != '') {
// 			$('#level').append(option);
// 			$("#level").prop("disabled", false);
// 			$("#show-transcendent").prop("disabled", false);
// 			$("#show-unrendered").prop("disabled", false);
// 			$("#show-buildings-only").prop("disabled", false);
// 		}
// 		//If not, we disable the select element
// 		else {
// 			$("#level").prop("disabled", true);
// 			$("#show-transcendent").prop("disabled", true);
// 			$("#show-unrendered").prop("disabled", true);
// 			$("#show-buildings-only").prop("disabled", true);
// 		}
// 	};
// 
// /*
//  * Images
//  */
// 	/**
// 	 * Opens the images panel
// 	 * @param tags The feature tags
// 	 */
// 	this.openImages = function(tags) {
// 		//Open popup
// 		$("#op-images").show();
// 		$("#op-images .tabs div").removeClass();
// 		
// 		/*
// 		 * Fill tabs
// 		 */
// 		//Simple URL
// 		if(hasUrlImage(tags)) {
// 			$("#tab-url a").show();
// 			$("#tab-url div").html(_imageHtml(tags.image));
// 			$("#tab-url").click(function() { controller.getView().changeImageTab("tab-url"); });
// 		}
// 		else {
// 			$("#tab-url").addClass("hide");
// 		}
// 		
// 		//Mapillary image
// 		//tags.mapillary = 'Rv1w8WC8fpgBjJO7L5S9NQ'; //For debug purposes only
// 		if(hasMapillaryImage(tags)) {
// 			$("#tab-mapillary a").show();
// 			$("#tab-mapillary div").html(_imageMapillaryHtml(tags.mapillary));
// 			//Mapillary.init('mapillary', { image: tags.mapillary, width: $("#mapillary").width()-20, editor: false, showMap: false, showThumbs: false, showPlayControls: false });
// 			$("#tab-mapillary").click(function() { controller.getView().changeImageTab("tab-mapillary"); });
// 		}
// 		else {
// 			$("#tab-mapillary").addClass("hide");
// 		}
// 		$("#tab-flickr").addClass("hide");
// 		
// 		//Set default tab
// 		$("#op-images .tabs > div:not(.hide):first").addClass("selected");
// 	};
// 	
// 	/**
// 	 * @param url The image URL
// 	 * @return The image HTML markup
// 	 */
// 	function _imageHtml(url) {
// 		return '<a href="'+url+'" target="_blank"><img src="'+url+'" /></a>';
// 	};
// 	
// 	/**
// 	 * @param id The mapillary image ID
// 	 * @return The image HTML markup
// 	 */
// 	function _imageMapillaryHtml(id) {
// 		return '<a href="http://www.mapillary.com/map/im/'+id+'" target="_blank"><img src="https://d1cuyjsrcm0gby.cloudfront.net/'+id+'/thumb-2048.jpg" /></a>';
// 	};
// 	
// 	/**
// 	 * Changes the currently opened tab in images popup
// 	 * @param tab The tab name
// 	 */
// 	this.changeImageTab = function(tab) {
// 		$("#op-images .tabs div").removeClass("selected");
// 		$("#"+tab).addClass("selected");
// 	};
// 
// /*
//  * Other view methods
//  */
// 	/**
// 	 * Displays a message in the console and in a specific area of the page.
// 	 * @param msg The string to display
// 	 * @param type The kind of message (info, alert, error)
// 	 */
// 	this.displayMessage = function(msg, type) {
// 		//Add a new child in list, corresponding to the given message
// 		var newLi = document.createElement("li");
// 		if(_nbMessages == 0) {
// 			$("#infobox").show();
// 			$("#infobox-list").append(newLi);
// 		}
// 		else {
// 			$("#infobox-list li:first-child").before(newLi);
// 		}
// 		
// 		//Add classes and text to the added child
// 		$("#infobox-list li:first-child").addClass(type).html(msg);
// 		
// 		_nbMessages++;
// 		
// 		//Remove that child after a delay
// 		setTimeout(function() {
// 			$("#infobox-list li").last().remove();
// 			_nbMessages--;
// 			if(_nbMessages == 0) {
// 				$("#infobox").hide();
// 			}
// 		}, 5000);
// 	};
// 	
// 	/**
// 	 * Displays a message in the loading info box, to know the current step.
// 	 * @param msg The string to display
// 	 */
// 	this.addLoadingInfo = function(msg) {
// 		//Add a new child in list, corresponding to the given message
// 		var newLi = document.createElement("li");
// 		$("#op-loading-info").append(newLi);
// 		
// 		//Add text to the added child
// 		$("#op-loading-info li:last-child").html(msg);
// 	};
// 	
// 	/**
// 	 * Updates the permalink on page.
// 	 */
// 	this.updatePermalink = function() {
// 		var baseURL = myUrl()+"?";
// 		var params = "lat="+_self.getLatitude()+"&lon="+_self.getLongitude()+"&zoom="+_map.getZoom()+"&tiles="+_tileLayer;
// 		
// 		if($("#level").val() != null) {
// 			params += "&level="+$("#level").val();
// 		}
// 		
// 		params += "&transcend="+((_self.showTranscendent()) ? "1" : "0");
// 		params += "&legacy="+((_self.showLegacy()) ? "1" : "0");
// 		params += "&unrendered="+((_self.showUnrendered()) ? "1" : "0");
// 		params += "&buildings="+((_self.showBuildingsOnly()) ? "1" : "0");
// 		
// 		var link = baseURL + params + '#' + myUrlHash();
// 		var linkShort = baseURL + "s=" + _shortlink();
// 		
// 		$("#permalink").attr('href', link);
// 		$("#shortlink").attr('href', linkShort);
// 		
// 		//Update browser URL
// 		window.history.replaceState({}, "OpenLevelUp!", link);
// 		
// 		//Update OSM link
// 		$("#osm-link").attr('href', "http://openstreetmap.org/#map="+_map.getZoom()+"/"+_map.getCenter().lat+"/"+_map.getCenter().lng);
// 	};
// 	
// 	/**
// 	 * Updates the room names list
// 	 * @param roomNames The room names (from model), or null to hide
// 	 */
// 	this.populateRoomNames = function(roomNames) {
// 		var filter = (_self.isSearchRoomLongEnough()) ? $("#search-room").val() : null;
// 		
// 		//Filter room names
// 		var roomNamesFiltered = null;
// 		
// 		if(roomNames != null) {
// 			roomNamesFiltered = new Object();
// 			
// 			for(var lvl in roomNames) {
// 				roomNamesFiltered[lvl] = new Object();
// 				
// 				for(var room in roomNames[lvl]) {
// 					var ftGeomRoom = roomNames[lvl][room].getGeometry();
// 					
// 					if((filter == null || room.toLowerCase().indexOf(filter.toLowerCase()) >= 0)
// 						&& (roomNames[lvl][room].getStyle().popup == undefined
// 						|| roomNames[lvl][room].getStyle().popup == "yes")
// 						&& _ctrl.getMapData().getBBox().intersects(ftGeomRoom.getBounds())) {
// 
// 						roomNamesFiltered[lvl][room] = roomNames[lvl][room];
// 					}
// 				}
// 				
// 				//Remove level if empty
// 				if(Object.keys(roomNamesFiltered[lvl]).length == 0) {
// 					delete roomNamesFiltered[lvl];
// 				}
// 			}
// 		}
// 		
// 		if(roomNames != null && roomNamesFiltered != null) {
// 			$("#rooms").empty();
// 			
// 			var levelsKeys = Object.keys(roomNamesFiltered);
// 			levelsKeys.sort(function (a,b) { return parseFloat(a)-parseFloat(b);});
// 			
// 			for(var i in levelsKeys) {
// 				var lvl = levelsKeys[i];
// 				//Create new level row
// 				var newRow = document.createElement("div");
// 				
// 				//Add class
// 				$("#rooms").append(newRow);
// 				$("#rooms div:last").addClass("lvl-row").attr("id", "lvl"+lvl);
// 				
// 				//Create cell for level name
// 				var newLvlName = document.createElement("div");
// 				$("#lvl"+lvl).append(newLvlName);
// 				$("#lvl"+lvl+" div").addClass("lvl-name").html(lvl);
// 				
// 				//Create cell for level rooms
// 				var newLvlRooms = document.createElement("div");
// 				$("#lvl"+lvl).append(newLvlRooms);
// 				$("#lvl"+lvl+" div:last").addClass("lvl-rooms").attr("id", "lvl"+lvl+"-rooms");
// 				
// 				//Init room list
// 				var newRoomList = document.createElement("ul");
// 				$("#lvl"+lvl+"-rooms").append(newRoomList);
// 				
// 				//Add each room
// 				for(var room in roomNamesFiltered[lvl]) {
// 					var newRoom = document.createElement("li");
// 					$("#lvl"+lvl+"-rooms ul").append(newRoom);
// 					$("#lvl"+lvl+"-rooms ul li:last").addClass("ref");
// 					
// 					var roomIcon = document.createElement("img");
// 					var roomLink = document.createElement("a");
// 					$("#lvl"+lvl+"-rooms ul li:last").append(roomLink);
// 					
// 					if(STYLE != undefined) {
// 						var addImg = STYLE.images.indexOf(roomNamesFiltered[lvl][room].getStyle().getIconUrl()) >= 0;
// 						$("#lvl"+lvl+"-rooms ul li:last a").append(roomIcon);
// 					}
// 					
// 					var ftGeom = roomNamesFiltered[lvl][room].getGeometry();
// 					
// 					$("#lvl"+lvl+"-rooms ul li:last a")
// 						.append(document.createTextNode(" "+room))
// 						.attr("href", "#")
// 						.attr("onclick", "controller.goTo('"+lvl+"', "+ftGeom.getCentroidAsString()+",'"+roomNamesFiltered[lvl][room].getId()+"')");
// 					
// 					if(STYLE != undefined) {
// 						$("#lvl"+lvl+"-rooms ul li:last a img")
// 							.attr("src", OLvlUp.view.ICON_FOLDER+'/'+
// 								((addImg) ? roomNamesFiltered[lvl][room].getStyle().getIconUrl() : 'default.svg')
// 							)
// 							.attr("width", OLvlUp.view.ICON_SIZE+"px");
// 					}
// 				}
// 			}
// 		}
// 	};
// 	
// 	/**
// 	 * When search room input is changed
// 	 */
// 	this.onSearchRoomFocusChange = function() {
// 		if($("#search-room").val() == "Search" && $("#search-room").is(":focus")) {
// 			$("#search-room").val("");
// 		}
// 		else if($("#search-room").val() == "" && !$("#search-room").is(":focus")) {
// 			_ctrl.resetRoomNames();
// 		}
// 	};
// 	
// 	/**
// 	 * Displays the given central panel
// 	 * @param id The panel ID
// 	 */
// 	this.showCentralPanel = function(id) {
// 		if(!$("#"+id).is(":visible")) {
// 			$("#central .part").hide();
// 			$("#"+id).show();
// 			$("#main-buttons").addClass("opened");
// 			$("#central-close").show();
// 		}
// 		else {
// 			_self.hideCentralPanel();
// 		}
// 	};
// 	
// 	/**
// 	 * Hides the central panel
// 	 */
// 	this.hideCentralPanel = function() {
// 		$("#central .part").hide();
// 		$("#central-close").hide();
// 		$("#main-buttons").removeClass("opened");
// 	};
// 	
// 	/**
// 	 * Shows the rooms overlay panel
// 	 */
// 	this.showRoomsPanel = function() {
// 		$("#op-rooms").show();
// 	}
// 	
// 	/**
// 	 * Changes the currently shown popup tab
// 	 * @param id The ID of the tab to show (for exemple "general")
// 	 */
// 	this.changePopupTab = function(id) {
// 		$(".popup-nav .item:visible").removeClass("selected");
// 		$(".popup-tab:visible").hide();
// 		$(".leaflet-popup:visible #popup-tab-"+id).show();
// 		$("#item-"+id).addClass("selected");
// 	}
// 	
// 	/**
// 	 * Creates short links
// 	 * Format: lat+lon+zoomoptions+level+tiles
// 	 * Lat and lon are the latitude and longitude, encoded in base 62
// 	 * Zoom is the map zoom encoded as a letter (A=1, Z=26)
// 	 * Options are a bit array, encoded as base 62
// 	 * Example: 10.AQ3+-2j.64S+E6+F+2
// 	 * @return The short link for current view
// 	 */
// 	function _shortlink() {
// 		var lat = _self.getLatitude();
// 		var lon = _self.getLongitude();
// 		
// 		var shortLat = ((lat < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(lat))) + "." + decToBase62((Math.abs((lat % 1).toFixed(5)) * 100000).toFixed(0)); //Latitude
// 		var shortLon = ((lon < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(lon))) + "." + decToBase62((Math.abs((lon % 1).toFixed(5)) * 100000).toFixed(0)); //Longitude
// 		var shortZoom = intToLetter(_map.getZoom()); //Zoom
// 		var shortTiles = decToBase62(_tileLayer);
// 		
// 		//Level
// 		var lvl = _self.getCurrentLevel();
// 		var shortLvl = "";
// 		if(lvl != null) {
// 			if(lvl < 0) {
// 				shortLvl += "-";
// 			}
// 			
// 			shortLvl += decToBase62(Math.floor(Math.abs(lvl)));
// 			shortLvl += ".";
// 			shortLvl += decToBase62((Math.abs((lvl % 1).toFixed(2)) * 100).toFixed(0));
// 		}
// 		
// 		var shortOptions = bitArrayToBase62([
// 					((_self.showBuildingsOnly()) ? "1" : "0"),
// 					((_self.showTranscendent()) ? "1" : "0"),
// 					((_self.showLegacy()) ? "1" : "0"),
// 					((_self.showUnrendered()) ? "1" : "0")
// 				]);
// 		
// 		var short = shortLat+"+"+shortLon+"+"+shortZoom+shortOptions+"+"+shortLvl+"+"+shortTiles;
// 		
// 		return short;
// 	}
// }
// };
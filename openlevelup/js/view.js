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
	
	/** The export component **/
	var _cExport = new OLvlUp.view.ExportView();
	
	/** The names component **/
	var _cNames = null;
	
	/** The images component **/
	var _cImages = null;
	
	/** The levels component **/
	var _cLevel = null;
	
	/** The map component **/
	var _cMap = null;

//CONSTRUCTOR
	function _init() {
		_cUrl = new OLvlUp.view.URLView(_self);
		_cMap = new OLvlUp.view.MapView(_self);
		_cNames = new OLvlUp.view.NamesView(_self);
		_cImages = new OLvlUp.view.ImagesView(_self);
		_cLevel = new OLvlUp.view.LevelView(_self);
		
		_cExport.hideButton();
		_cNames.hideButton();
		_cLevel.disable();
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
	
	/**
	 * @return The loading component
	 */
	this.getLoadingView = function() {
		return _cLoading;
	};
	
	/**
	 * @return The images component
	 */
	this.getImagesView = function() {
		return _cImages;
	};
	
	/**
	 * @return The level component
	 */
	this.getLevelView = function() {
		return _cLevel;
	};
	
	/**
	 * @return The map data from the controller
	 */
	this.getData = function() {
		return _ctrl.getData();
	};
	
	/**
	 * @return The cluster data from the controller
	 */
	this.getClusterData = function() {
		return _ctrl.getClusterData();
	};

//OTHER METHODS
	/**
	 * Updates the view when map moves or zoom changes
	 */
	this.updateMapMoved = function() {
		var zoom = _cMap.get().getZoom();
		var oldZoom = _cMap.getOldZoom();
		
		//Check new zoom value
		if(zoom >= OLvlUp.view.DATA_MIN_ZOOM) {
			//Add names and export buttons if needed
			if(oldZoom == null || oldZoom < OLvlUp.view.DATA_MIN_ZOOM) {
				_cExport.showButton();
				_cNames.showButton();
				_cLevel.enable();
				_cOptions.enable();
			}
			
			//Update levels
			_cLevel.update();
		}
		else {
			//Remove names and export buttons if needed
			if(oldZoom == null || oldZoom >= OLvlUp.view.DATA_MIN_ZOOM) {
				_cExport.hideButton();
				_cNames.hideButton();
				_cLevel.disable();
				_cOptions.disable();
			}
			
			//Clear view if lower zoom than cluster
			if(zoom < OLvlUp.view.CLUSTER_MIN_ZOOM) {
				_cMessages.displayMessage("Zoom in to see more information", "info");
			}
		}
		
		_cMap.update();
		_cUrl.mapUpdated();
		_cNames.update();
	};
	
	/**
	 * Updates the view when level changes
	 */
	this.updateLevelChanged = function() {
		_cMap.update();
		_cUrl.levelChanged();
	};
	
	/**
	 * Updates the view when an option changes
	 */
	this.updateOptionChanged = function() {
		_cMap.update();
		_cUrl.optionsChanged();
	};
	
	/**
	 * Displays the given central panel
	 * @param id The panel ID
	 */
	this.showCentralPanel = function(id) {
		if(!$("#"+id).is(":visible")) {
			$("#central .part").hide();
			$("#"+id).show();
			$("#main-buttons").addClass("opened");
			$("#central-close").show();
			$("#central-close").click(controller.getView().hideCentralPanel);
		}
		else {
			_self.hideCentralPanel();
		}
	};
	
	/**
	 * Hides the central panel
	 */
	this.hideCentralPanel = function() {
		$("#central .part").hide();
		$("#central-close").hide();
		$("#central-close").off("click");
		$("#main-buttons").removeClass("opened");
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
	
	/** The current data layer **/
	var _dataLayer = null;
	
	/** The feature popups **/
	var _dataPopups = {};
	
	/** The previous zoom value **/
	var _oldZoom = null;
	
	/** The current object **/
	var _self = this;

//CONSTRUCTOR
	function _init() {
		var isMobile = _mainView.isMobile();
		
		//Get URL values to restore
		var url = _mainView.getUrlView();
		var lat = (url.getLatitude() != undefined) ? url.getLatitude() : 47;
		var lon = (url.getLongitude() != undefined) ? url.getLongitude() : 2;
		var zoom = (url.getZoom() != undefined) ? url.getZoom() : 6;
		var bbox = url.getBBox();
		var tiles = url.getTiles();
		
		//Init map center and zoom
		_map = L.map('map', {minZoom: 1, maxZoom: OLvlUp.view.MAX_ZOOM, zoomControl: false});
		if(bbox != undefined) {
			//Get latitude and longitude information from BBox string
			var coordinates = bbox.split(',');
			
			if(coordinates.length == 4) {
				var sw = L.latLng(coordinates[1], coordinates[0]);
				var ne = L.latLng(coordinates[3], coordinates[2]);
				var bounds = L.latLngBounds(sw, ne);
				_map.fitBounds(bounds);
			}
			else {
				_mainView.getMessagesView().displayMessage("Invalid bounding box", "alert");
				_map.setView([lat, lon], zoom);
			}
		}
		else {
			_map.setView([lat, lon], zoom);
		}
		
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
				_map.fitBounds(result.bbox, { maxZoom: minimalMaxZoom });
				return this;
			};
			search.addTo(_map);
		}
		
		if(isMobile) {
			L.control.zoom({ position: "topright" }).addTo(_map);
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
		
		//Trigger for map events
		_map.on('moveend', function(e) { controller.onMapUpdate(); });
		_map.on("baselayerchange", controller.onMapChange);
		_map.on("layeradd", controller.onLayerAdd);
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
	
	/**
	 * @return The previous zoom value
	 */
	this.getOldZoom = function() {
		return _oldZoom;
	};

//OTHER METHODS
	/**
	 * Event handler for map movement or level change
	 * Refreshes data on map
	 */
	this.update = function() {
		//Delete previous data
		if(_dataLayer != null) {
			_map.removeLayer(_dataLayer);
			_dataLayer = null;
			_dataPopups = {};
		}
		
		//Create data (specific to level)
		var zoom = _map.getZoom();
		
		if(zoom >= OLvlUp.view.DATA_MIN_ZOOM) {
			var fullData = _createFullData();
			
			//Add data to map
			if(fullData != null) {
				//Create data layer
				_dataLayer = L.layerGroup();
				_dataLayer.addTo(_map);
				
				//Order layers
				var featureLayersKeys = Object.keys(fullData).sort(function(a,b) { return parseInt(a) - parseInt(b); });
				for(var i in featureLayersKeys) {
					var featureLayerGroup = fullData[featureLayersKeys[i]];
					_dataLayer.addLayer(featureLayerGroup);
				}
			}
			else {
				_mainView.getMessagesView().displayMessage("There is no available data in this area", "alert");
			}
		}
		else if(zoom >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
			_dataLayer = _createClusterData();
			
			//Add data to map
			if(_dataLayer != null) {
				_dataLayer.addTo(_map);
			}
			else {
				_mainView.getMessagesView().displayMessage("There is no available data in this area", "alert");
			}
		}
		
		//Change old zoom value
		_oldZoom = _map.getZoom();
		
		_self.changeTilesOpacity();
	};
	
	/**
	 * Changes the currently shown tile layer
	 * @param name The tile layer name
	 */
	this.setTileLayer = function(name) {
		for(var i in OLvlUp.view.TILE_LAYERS) {
			if(OLvlUp.view.TILE_LAYERS[i].name == name) {
				_tileLayer = i;
				break;
			}
		}
		_mainView.getUrlView().tilesChanged();
	};

	/**
	 * Create data for detailled levels
	 * @return The data layers for leaflet
	 */
	function _createFullData() {
		var features = _mainView.getData().getFeatures();
		var result = null;
		
		if(features != null) {
			var dispayableFeatures = 0;
			var featureLayers = {};
			
			//Analyze each feature
			for(var featureId in features) {
				var feature = features[featureId];
				var featureView = new OLvlUp.view.FeatureView(_mainView, feature);
				
				if(featureView.getLayer() != null) {
					var relLayer = featureView.getRelativeLayer().toString();
					
					//Create feature layer if needed
					if(featureLayers[relLayer] == undefined) {
						featureLayers[relLayer] = L.featureGroup();
					}
					
					//Add to feature layers
					featureLayers[relLayer].addLayer(featureView.getLayer());
					if(featureView.hasPopup()) {
						_dataPopups[featureId] = featureView.getLayer();
					}
					
					dispayableFeatures++;
				}
			}
			
			if(dispayableFeatures > 0) {
				result = featureLayers;
			}
		}
		
		return result;
	};
	
	/**
	 * Create data for cluster levels
	 * @return The data layer for leaflet
	 */
	function _createClusterData() {
		var data = _mainView.getClusterData().get();
		var result = null;
		
		if(data != null) {
			result = new L.MarkerClusterGroup({
				singleMarkerMode: true,
				spiderfyOnMaxZoom: false,
				maxClusterRadius: 30
			});
			result.addLayer(L.geoJson(data));
		}
		
		return result;
	};
	
	/**
	 * Changes the tiles opacity, depending of shown level
	 */
	this.changeTilesOpacity = function() {
		var newOpacity = 1;
		var levelsArray = _mainView.getData().getLevels();
		
		if(_map.getZoom() >= OLvlUp.view.DATA_MIN_ZOOM && levelsArray != null) {
			//Find level 0 index in levels array
			var levelZero = levelsArray.indexOf(0);
			var midLevel = (levelZero >= 0) ? levelZero : Math.floor(levelsArray.length / 2);
			
			//Extract level sub-arrays
			var levelsNegative = levelsArray.slice(0, midLevel);
			var levelsPositive = levelsArray.slice(midLevel+1);
			
			//Calculate new opacity, depending of level position in levels array
			var currentLevel = _mainView.getLevelView().get();
			if(currentLevel != null) {
				var idNeg = levelsNegative.indexOf(currentLevel);
				var idPos = levelsPositive.indexOf(currentLevel);
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
		});
	}
	
	/**
	 * This functions makes map go to given coordinates, at given level
	 * @param ftId The feature ID
	 * @param lvl The level
	 */
	this.goTo = function(ftId, lvl) {
		//Change level
		_mainView.getLevelView().set(lvl);
		_mainView.updateLevelChanged();
		
		//Retrieve feature
		var feature = _mainView.getData().getFeature(ftId);
		
		//Zoom on feature
		var centroid = feature.getGeometry().getCentroid();
		var centroidLatLng = L.latLng(centroid[1], centroid[0]);
		_map.setView(centroidLatLng, 21);
		
		//Open popup
		setTimeout(function() {
			if(_mainView.getLoadingView().isLoading()) {
				$(document).bind("loading_done", function() {
					_dataPopups[ftId].openPopup(centroidLatLng);
					$(document).unbind("loading_done");
				});
			}
			else {
				_dataPopups[ftId].openPopup(centroidLatLng);
			}
		},
		300);
	};

	/**
 	 * Changes the currently shown popup tab
	 * @param id The ID of the tab to show (for exemple "general")
	 */
	this.changePopupTab = function(id) {
		$(".popup-nav .item:visible").removeClass("selected");
		$(".popup-tab:visible").hide();
		$(".leaflet-popup:visible #popup-tab-"+id).show();
		$("#item-"+id).addClass("selected");
	};

//INIT
	_init();
},



/**
 * The component for a single feature
 */
FeatureView: function(main, feature) {
//ATTRIBUTES
	/** The feature layer **/
	var _layer = null;
	
	/** Does this object has a popup ? **/
	var _hasPopup = false;
	
	/** The main view **/
	var _mainView = main;

//CONSTRUCTOR
	/**
	 * Creates the layer for the given feature
	 */
	function _init() {
		if(_isDisplayable(feature)) {
			var style = feature.getStyle().get();
			var geom = feature.getGeometry();
			var geomType = geom.getType();
			_layer = L.featureGroup();
			
			//Init layer object, depending of geometry type
			switch(geomType) {
				case "Point":
					var marker = _createMarker(geom.getLatLng());
					if(marker != null) {
						_layer.addLayer(marker);
					}
					break;
					
				case "LineString":
					_layer.addLayer(L.polyline(geom.getLatLng(), style));
					break;
					
				case "Polygon":
					_layer.addLayer(L.polygon(geom.getLatLng(), style));
					break;
					
				default:
					console.log("Unknown geometry type: "+geomType);
			}
			
			//Look for an icon or a label
			var hasIcon = style.icon != undefined;
			var labelizable = _labelizable();
			
			if(hasIcon || labelizable) {
				switch(geomType) {
					case "Point":
						//Labels
						if(labelizable) {
							_layer.addLayer(_createLabel(geom.getLatLng(), hasIcon));
						}
						break;
						
					case "LineString":
						var ftGeomJSON = geom.get();
						var nbSegments = ftGeomJSON.coordinates.length - 1;
						
						//For each segment, add an icon
						for(var i=0; i < nbSegments; i++) {
							var coord1 = ftGeomJSON.coordinates[i];
							var coord2 = ftGeomJSON.coordinates[i+1];
							var coordMid = [ (coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2 ];
							var angle = azimuth({lat: coord1[1], lng: coord1[0], elv: 0}, {lat: coord2[1], lng: coord2[0], elv: 0}).azimuth;
							var coord = L.latLng(coordMid[1], coordMid[0]);
							
							if(hasIcon) {
								if(style.rotateIcon) {
									var marker = _createMarker(coord, angle);
									if(marker != null) {
										_layer.addLayer(marker);
									}
								}
								else {
									var marker = _createMarker(coord);
									if(marker != null) {
										_layer.addLayer(marker);
									}
								}
							}
							
							//Labels
							if(labelizable) {
								_layer.addLayer(_createLabel(coord, hasIcon, angle));
							}
						}
						break;
						
					case "Polygon":
						var centroid = feature.getGeometry().getCentroid();
						var coord = L.latLng(centroid[1], centroid[0]);
						
						if(hasIcon) {
							var marker = _createMarker(coord);
							if(marker != null) {
								_layer.addLayer(marker);
							}
						}
						
						//Labels
						if(labelizable) {
							_layer.addLayer(_createLabel(coord, hasIcon));
						}
						break;
						
					default:
						console.log("Unknown geometry type: "+geomType);
				}
			}
			
			//Add popup if needed
			if(style.popup == undefined || style.popup == "yes") {
				_layer.bindPopup(_createPopup());
				_hasPopup = true;
			}
		}
	};

//ACCESSORS
	/**
	 * @return The relative layer to overlay object on map
	 */
	this.getRelativeLayer = function() {
		//Determine relative layer
		var relLayer = feature.getStyle().get().layer;
		if(relLayer != undefined) {
			relLayer = parseFloat(relLayer);
			if(!isNaN(relLayer)) {
				_relLayer = relLayer;
			}
		}
		else {
			relLayer = 0;
		}
		return relLayer;
	};
	
	/**
	 * @return The leaflet layer
	 */
	this.getLayer = function() {
		return _layer;
	};
	
	/**
	 * @return True if this view has an associated popup
	 */
	this.hasPopup = function() {
		return _hasPopup;
	};
	
//OTHER METHODS
	/**
	 * Should the given feature be shown, regarding to view context ?
	 * @return True if yes
	 */
	function _isDisplayable() {
		var ftGeom = feature.getGeometry();
		var ftTags = feature.getTags();
		var ftLevels = feature.onLevels();
		var options = _mainView.getOptionsView();
		
		var addObject = false;
		
		//Only process feature in bounds
		if(_mainView.getMapView().get().getBounds().intersects(ftGeom.getBounds())) {
			//Object with levels defined
			if(ftLevels.length > 0) {
				var nbTags = Object.keys(ftTags).length;
				addObject = nbTags > 0
						&& (nbTags > 1 || ftTags.area == undefined)
						&& feature.isOnLevel(_mainView.getLevelView().get())
						&& (options.showTranscendent() || ftLevels.length == 1)
						&& (!options.showBuildingsOnly() || ftTags.building != undefined)
						&& (options.showUnrendered() || Object.keys(feature.getStyle().get()).length > 0);
			}
			//Objects without levels
			else {
				//Building with min and max level
				addObject = ftTags.building != undefined
						&& ftTags.min_level != undefined
						&& ftTags.max_level != undefined;
				
				//Elevator
				if(options.showTranscendent() && !options.showBuildingsOnly()) {
					addObject = addObject || ftTags.highway == "elevator";
				}
			}
		}

//		if(!addObject) {
//			console.log("Unrendered object: "+feature.getId());
//			console.log(ftTags);
//		}
		
		return addObject;
	};
	
	/**
	 * Creates a marker
	 * @param latlng The latitude and longitude of the marker
	 * @param angle The rotation angle (default: 0)
	 * @return The leaflet marker, or null
	 */
	function _createMarker(latlng, angle) {
		var result = null;
		var iconUrl = null;
		var style = feature.getStyle().get();
		angle = angle || null;
		
		if(style.icon != undefined && style.icon != null && style.icon != '') {
			var tmpUrl = feature.getStyle().getIconUrl();
			
			if(tmpUrl != null) {
				iconUrl = OLvlUp.view.ICON_FOLDER+'/'+tmpUrl;
			}
			else if(style.showMissingIcon == undefined || style.showMissingIcon) {
				iconUrl = OLvlUp.view.ICON_FOLDER+'/default.svg';
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
			
			if(angle != null) {
				result = L.rotatedMarker(latlng, {icon: myIcon, angle: angle});
			}
			else {
				result = L.marker(latlng, {icon: myIcon});
			}
		}
//		else {
//			result = L.circleMarker(latlng, { opacity: 0, fillOpacity: 0 });
//		}
			
		return result;
	}
	
	/**
	 * Creates the popup for a given feature
	 * @param feature The feature the popup will be created for
	 * @return The text the popup will contain
	 */
	function _createPopup() {
		var name = feature.getName();
		var style = feature.getStyle().get();
		var isMobile = _mainView.isMobile();
		
		/*
		 * Title
		 */
		var text = '<h1 class="popup">';
		
		//Add icon in title
		if(style.icon != undefined) {
			var iconUrl = feature.getStyle().getIconUrl();
			if(iconUrl != null) {
				text += '<img class="icon" src="'+OLvlUp.view.ICON_FOLDER+'/'+iconUrl+'" /> ';
			}
		}
		
		//Object name (its name tag or its type)
		text += (feature.getTag("name") != undefined) ? feature.getTag("name") : name;
		
		//Add up and down icons if levelup property == true
		var ftLevels = feature.onLevels();
		if(style.levelup && ftLevels.length > 0 && !isMobile) {
			//Able to go up ?
			var levelId = ftLevels.indexOf(_mainView.getLevelView().get());
			if(levelId < ftLevels.length -1) {
				text += ' <a onclick="controller.toLevel('+ftLevels[levelId+1]+')" href="#"><img src="'+OLvlUp.view.ICON_FOLDER+'/arrow_up.png" title="Go up" alt="Up!" /></a>';
			}
			//Able to go down ?
			if(levelId > 0) {
				text += ' <a onclick="controller.toLevel('+ftLevels[levelId-1]+')" href="#"><img src="'+OLvlUp.view.ICON_FOLDER+'/arrow_down.png" title="Go down" alt="Down!" /></a>';
			}
		}
		
		//End title
		text += '</h1>';
		
		//Navigation bar
		if(!isMobile) {
			text += '<div class="popup-nav"><div class="row">';
			text += '<div class="item selected" id="item-general"><a href="#" onclick="controller.getView().getMapView().changePopupTab(\'general\');">General</a></div>';
			text += '<div class="item" id="item-technical"><a href="#" onclick="controller.getView().getMapView().changePopupTab(\'technical\');">Technical</a></div>';
			text += '<div class="item" id="item-tags"><a href="#" onclick="controller.getView().getMapView().changePopupTab(\'tags\');">Tags</a></div>';
			text += '</div></div>';
		}
		
		/*
		 * Tab 1 : general information
		 */
		text += '<div class="popup-tab" id="popup-tab-general">';
		generalTxt = '';
		generalTxt += _addFormatedTag("vending", "Selling", removeUscore);
		generalTxt += _addFormatedTag("information", "Type", removeUscore);
		generalTxt += _addFormatedTag("artwork_type", "Type", removeUscore);
		generalTxt += _addFormatedTag("access", "Access");
		generalTxt += _addFormatedTag("artist", "Creator");
		generalTxt += _addFormatedTag("artist_name", "Creator");
		generalTxt += _addFormatedTag("architect", "Architect");
		generalTxt += _addFormatedTag("opening_hours", "Opening hours");
		generalTxt += _addFormatedTag("start_date", "Created in");
		generalTxt += _addFormatedTag("historic:era", "Era", removeUscore);
		generalTxt += _addFormatedTag("historic:period", "Period", removeUscore);
		generalTxt += _addFormatedTag("historic:civilization", "Civilization", removeUscore);
		generalTxt += _addFormatedTag("website", "Website", asWebLink);
		generalTxt += _addFormatedTag("contact:website", "Website", asWebLink);
		generalTxt += _addFormatedTag("phone", "Phone");
		generalTxt += _addFormatedTag("contact:phone", "Phone");
		generalTxt += _addFormatedTag("email", "E-mail");
		generalTxt += _addFormatedTag("contact:email", "E-mail");
		generalTxt += _addFormatedTag("fee", "Fee");
		generalTxt += _addFormatedTag("atm", "With ATM");
		generalTxt += _addFormatedTag("payment:coins", "Pay with coins");
		generalTxt += _addFormatedTag("payment:credit_cards", "Pay with credit cards");
		generalTxt += _addFormatedTag("currency:EUR", "Pay in €");
		generalTxt += _addFormatedTag("currency:USD", "Pay in US $");
		generalTxt += _addFormatedTag("female", "For women");
		generalTxt += _addFormatedTag("male", "For men");
		generalTxt += _addFormatedTag("bicycle", "For bicycle");
		generalTxt += _addFormatedTag("foot", "On foot");
		generalTxt += _addFormatedTag("wheelchair", "For wheelchair");
		generalTxt += _addFormatedTag("seats", "Seats");
		generalTxt += _addFormatedTag("waste", "Waste",removeUscore);
		generalTxt += _addFormatedTag("cuisine", "Cuisine", removeUscore);
		
		generalTxt += _addFormatedTag("description", "Details");
		
		//Image rendering
		if(feature.hasImages()) {
			generalTxt += '<p class="popup-txt centered"><a href="#" id="images-open" onclick="controller.getView().getImagesView().open(\''+feature.getId()+'\')">See related images</a></p>';
		}
		
		if(generalTxt == '' && !isMobile) { generalTxt = "No general information (look at tags)"; }
		text += generalTxt;
		
		text += '</div>';
		
		/*
		 * Tab 2 : technical information
		 */
		if(!isMobile) {
			text += '<div class="popup-tab hidden" id="popup-tab-technical">';
			
			technicalTxt = '';
			technicalTxt += _addFormatedTag("width", "Width", addDimensionUnit);
			technicalTxt += _addFormatedTag("height", "Height", addDimensionUnit);
			technicalTxt += _addFormatedTag("length", "Length", addDimensionUnit);
			technicalTxt += _addFormatedTag("direction", "Direction", orientationValue);
			technicalTxt += _addFormatedTag("camera:direction", "Direction (camera)", orientationValue);
			technicalTxt += _addFormatedTag("operator", "Operator");
			technicalTxt += _addFormatedTag("ref", "Reference");
			technicalTxt += _addFormatedTag("material", "Made of");
			
			if(technicalTxt == '') { technicalTxt = "No technical information (look at tags)"; }
			text += technicalTxt;
			
			text += '</div>';
		}
		
		/*
		 * Tab 3 : tags
		 */
		if(!isMobile) {
			text += '<div class="popup-tab hidden" id="popup-tab-tags">';
			
			//List all tags
			text += '<p class="popup-txt">';
			var ftTags = feature.getTags();
			for(i in ftTags) {
				//Render specific tags
				//URLs
				var urlTags = ["image", "website", "contact:website", "url"];
				if(urlTags.indexOf(i) >= 0) {
					text += i+' = <a href="'+ftTags[i]+'">'+ftTags[i]+'</a>';
				}
				//Wikimedia commons
				else if(i == "wikimedia_commons") {
					text += i+' = <a href="https://commons.wikimedia.org/wiki/'+ftTags[i]+'">'+ftTags[i]+'</a>';
				}
				else {
					text += i+" = "+ftTags[i];
				}
				text += "<br />";
			}

			//text += feature.properties.style.getStyle().layer;
			text += "</p>";
			
			text += '</div>';
		}
		
		/*
		 * Footer
		 */
		//Link to osm.org object
		text += '<p class="popup-txt centered"><a href="http://www.openstreetmap.org/'+feature.getId()+'">See this on OSM.org</a></p>';
		
		coords = feature.getGeometry().getCentroid();
		
		var options = (isMobile) ? { autoPan: false } : {};
		
		return L.popup(options).setContent(text).setLatLng(L.latLng(coords[1], coords[0]));
	}
	
	/**
	 * Creates a formated tag display
	 * @param key The OSM key to display
	 * @param cleanName The clean name to display
	 * @param tagCleaner The function that will clean the tag value (for example, add proper unit for dimensions), optional
	 * @return The formated tag, or empty string if not found
	 */
	function _addFormatedTag(key, cleanName, tagCleaner) {
		var text = '';
		if(tagCleaner == undefined) { tagCleaner = function(v) { return v; }; }
		
		if(feature.getTag(key) != undefined) {
			text = '<b>'+cleanName+':</b> '+tagCleaner(feature.getTag(key))+'<br />';
		}
		
		return text;
	}
	
	/**
	 * Should the feature receive a label ?
	 * @return True if it should have a label
	 */
	function _labelizable() {
		var ftStyle = feature.getStyle().get();
		return ftStyle.label != undefined && ftStyle.label != null && feature.getTag(ftStyle.label) != undefined;
	};
	
	/**
	 * Creates the label (as a marker) for the given feature
	 * @param coordinates The coordinates of the point where the label will be rendered
	 * @param hasMarker Does this feature will also be rendered as a marker (icon/circle) ?
	 * @param angle The rotation angle for label (default: 0)
	 * @return The label as a leaflet marker
	 */
	function _createLabel(coordinates, hasMarker, angle) {
		var styleRules = feature.getStyle().get();
		var angle = angle || false;
		if(angle != false) {
			angle = (angle >= 90) ? angle - 90 : angle + 270;
			angle = angle % 180;
		}
		
		var classes = (styleRules.labelStyle != undefined) ? ' '+styleRules.labelStyle : '';
		var text = feature.getTag(styleRules.label);
		var iconAnchor = (hasMarker) ? [ null, -OLvlUp.view.ICON_SIZE/2] : [ null, OLvlUp.view.ICON_SIZE/2 ];
		var rotation = (angle) ? ' style="transform: rotate('+angle+'deg);"' : '';
		
		var label = L.marker(coordinates, {
			icon: L.divIcon({
				className: 'tlabel'+classes,   // Set class for CSS styling
				html: '<div'+rotation+'>'+text+'</div>',
				iconAnchor: iconAnchor,
				iconSize: [ 70, null ]
			}),
			draggable: false,       // Allow label dragging...?
			//zIndexOffset: 9000     // Make appear above other map features
		});
		
		return label;
	};

//INIT
	_init();
},



/**
 * The levels component
 */
LevelView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;
	
	/** The currently shown level **/
	var _level = parseFloat(_mainView.getUrlView().getLevel());

	/** The available levels **/
	var _levels = null;
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The current level value
	 */
	this.get = function() {
		return _level;
	};

//MODIFIERS
	/**
	 * Changes the current level
	 * @param lvl The new level (if undefined, uses the current select value)
	 */
	this.set = function(lvl) {
		var data = _mainView.getData();
		var lvlOk = (lvl != null) ? parseFloat(lvl) : parseFloat($("#level").val());
		
		if(data != null && data.getLevels() != null) {
			if(data.getLevels().indexOf(lvlOk) >= 0) {
				//Change level
				_level = lvlOk;
				if(lvl != null) { $("#level").val(lvlOk); }
			}
		}
		else {
			throw new Error("Invalid level");
		}
	};
	
	/**
	 * Changes the level values depending of data
	 */
	this.update = function() {
		_levels = _mainView.getData().getLevels();
		
		//Change current level if not available anymore
		if(_level == null || _levels.indexOf(_level) < 0) {
			//Check if 
			//Set to 0 if available
			_level = (_levels.indexOf(0) >= 0) ? 0 : _levels[0];
			_mainView.getUrlView().levelChanged();
		}
		
		/*
		 * Fill level selector
		 */
		var option = '';

		//Compute level and store them as select options
		for(var i=0; i < _levels.length; i++) {
			var lvl = _levels[i];
			
			option += '<option value="'+ lvl + '"';
			if(lvl == _level) { option += ' selected="selected"'; }
			option += '>' + lvl + '</option>';
		}
		
		//If levels array isn't empty, we add options
		if(option != '') {
			$('#level').html(option);
			$("#level").prop("disabled", false);
		}
		//If not, we disable the select element
		else {
			$('#level').empty();
			$("#level").prop("disabled", true);
		}
	};
	
	/**
	 * Goes to the upper level
	 */
	this.up = function() {
		if(_mainView.getMapView().get().getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			var currentLevelId = _levels.indexOf(_level);
			
			if(currentLevelId == -1) {
				_mainView.getMessagesView().displayMessage("Invalid level", "error");
			}
			else if(currentLevelId + 1 < _levels.length) {
				_self.set(_levels[currentLevelId+1]);
			}
			else {
				_mainView.getMessagesView().displayMessage("You are already at the last available level", "alert");
			}
		}
	};
	
	/**
	 * Goes to the lower level
	 */
	this.down = function() {
		if(_mainView.getMapView().get().getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			var currentLevelId = _levels.indexOf(_level);
			
			if(currentLevelId == -1) {
				_mainView.getMessagesView().displayMessage("Invalid level", "error");
			}
			else if(currentLevelId > 0) {
				_self.set(_levels[currentLevelId-1]);
			}
			else {
				_mainView.getMessagesView().displayMessage("You are already at the first available level", "alert");
			}
		}
	};
	
	/**
	 * Disable level buttons
	 */
	this.disable = function() {
		$("#level").prop("disabled", true);
		$("#levelUp").off("click");
		$("#levelDown").off("click");
		$("#level").off("change");
	};
	
	/**
	 * Enable level button
	 */
	this.enable = function() {
		$("#level").prop("disabled", false);
		$("#levelUp").click(controller.onLevelUp);
		$("#levelDown").click(controller.onLevelDown);
		$("#level").change(controller.onLevelChange);
	};
},



/**
 * The options component
 */
OptionsView: function() {
//ATTRIBUTES
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
		$("#show-unrendered").prop("checked", _unrendered);
		$("#show-buildings-only").prop("checked", _buildings);
		
		//Add triggers
		$("#button-settings").click(controller.onShowSettings);
		$("#show-transcendent").change(function() {
			_self.changeTranscendent();
			controller.getView().updateOptionChanged();
		});
		$("#show-unrendered").change(function() {
			_self.changeUnrendered();
			controller.getView().updateOptionChanged();
		});
		$("#show-buildings-only").change(function() {
			_self.changeBuildingsOnly();
			controller.getView().updateOptionChanged();
		});
		_self.enable();
	};

//ACCESSORS
	/**
	 * @return Must we show transcendent objects ?
	 */
	this.showTranscendent = function() {
		return _transcend;
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
	
	/**
	 * Disable options buttons
	 */
	this.disable = function() {
		$("#show-buildings-only").prop("disabled", true);
		$("#show-unrendered").prop("disabled", true);
		$("#show-transcendent").prop("disabled", true);
	};
	
	/**
	 * Enable level button
	 */
	this.enable = function() {
		$("#show-buildings-only").prop("disabled", false);
		$("#show-unrendered").prop("disabled", false);
		$("#show-transcendent").prop("disabled", false);
	};

//INIT
	_init();
},



/**
 * The export component
 */
ExportView: function() {
//CONSTRUCTOR
	function _init() {
		$("#button-export").click(controller.onShowExport);
		//$("#export-link").click(controller.onExportLevel);
		//$("#export-link-img").click(controller.onExportLevelImage);
	};
	
//OTHER METHODS
	/**
	 * Shows the export button
	 */
	this.showButton = function() {
		$("#button-export").show();
	};
	
	/**
	 * Hides the export button
	 */
	this.hideButton = function() {
		$("#button-export").hide();
	};

//INIT
	_init();
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
	
	/**
	 * @return The bounding box
	 */
	this.getBBox = function() {
		return _bbox;
	};
	
	/**
	 * @return The latitude
	 */
	this.getLatitude = function() {
		return _lat;
	};
	
	/**
	 * @return The longitude
	 */
	this.getLongitude = function() {
		return _lon;
	};
	
	/**
	 * @return The zoom
	 */
	this.getZoom = function() {
		return _zoom;
	};
	
	/**
	 * @return The level
	 */
	this.getLevel = function() {
		return _level;
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
	 * Updates the component when options change
	 */
	this.optionsChanged = function() {
		//Update DOM
		_updateUrl();
		_setShortlink();
	};
	
	/**
	 * Updates the component when level changes
	 */
	this.levelChanged = function() {
		_level = _mainView.getLevelView().get();
		
		//Update DOM
		_updateUrl();
		_setShortlink();
	};
	
	/**
	 * Updates the component when tile layer changes
	 */
	this.tilesChanged = function() {
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
		var hash = $(location).attr('href').split('#')[1];
		return (hash != undefined) ? hash : "";
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
				optionsView.setUnrendered(options[options.length - 1] == 1);
				//optionsView.setLegacy(options[options.length - 2] == 1); //Deprecated option
				optionsView.setTranscendent(options[options.length - 3] == 1);
				optionsView.setBuildingsOnly(options[options.length - 4] == 1);
				
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
			if(parameters.transcend != undefined) { optionsView.setTranscendent(parameters.transcend == "1"); }
			if(parameters.unrendered != undefined) { optionsView.setUnrendered(parameters.unrendered == "1"); }
			if(parameters.buildings != undefined) { optionsView.setBuildingsOnly(parameters.buildings == "1"); }
			_level = parameters.level;
			_tiles = parameters.tiles;
		}
	};
	
	function _updateUrl() {
		var optionsView = _mainView.getOptionsView();
		var params = "lat="+_lat+"&lon="+_lon+"&zoom="+_zoom+"&tiles="+_tiles;
		
		if(_zoom >= OLvlUp.view.DATA_MIN_ZOOM) {
			if(_level != null) {
				params += "&level="+_level;
			}
			
			params += "&transcend="+((optionsView.showTranscendent()) ? "1" : "0");
			params += "&unrendered="+((optionsView.showUnrendered()) ? "1" : "0");
			params += "&buildings="+((optionsView.showBuildingsOnly()) ? "1" : "0");
		}
		
		var hash = _getUrlHash();
		var link = _getUrl() + "?" + params + ((hash != "") ? '#' + hash : "");
		
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
					"1", //((optionsView.showLegacy()) ? "1" : "0"),
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
NamesView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;
	
	/** This object **/
	var _self = this;

//CONSTRUCTOR
	function _init() {
		$("#button-rooms").click(controller.onShowRooms);
		$("#search-room").click(_self.searchFocus);
		$("#search-room").focus(_self.searchFocus);
		$("#search-room").focusout(_self.searchFocus);
		$("#search-room").bind("input propertychange", _self.update);
		$("#search-room-reset").click(_self.reset);
		$("#search-room").val("Search");
	};

//OTHER METHODS
	/**
	 * Shows the export button
	 */
	this.showButton = function() {
		$("#button-rooms").show();
	};
	
	/**
	 * Hides the export button
	 */
	this.hideButton = function() {
		$("#button-rooms").hide();
	};
	
	/**
	 * Updates the names list
	 */
	this.update = function() {
		var filter = (_self.searchOK()) ? $("#search-room").val() : null;
		var roomNames = _mainView.getData().getNames();
		
		//Filter room names
		var roomNamesFiltered = null;
		
		if(roomNames != null) {
			roomNamesFiltered = new Object();
			
			for(var lvl in roomNames) {
				roomNamesFiltered[lvl] = new Object();
				
				for(var room in roomNames[lvl]) {
					var ftGeomRoom = roomNames[lvl][room].getGeometry();
					
					if((filter == null || room.toLowerCase().indexOf(filter.toLowerCase()) >= 0)
						&& (roomNames[lvl][room].getStyle().get().popup == undefined
						|| roomNames[lvl][room].getStyle().get().popup == "yes")
						&& _mainView.getData().getBBox().intersects(ftGeomRoom.getBounds())) {

						roomNamesFiltered[lvl][room] = roomNames[lvl][room];
					}
				}
				
				//Remove level if empty
				if(Object.keys(roomNamesFiltered[lvl]).length == 0) {
					delete roomNamesFiltered[lvl];
				}
			}
		}
		
		if(roomNames != null && roomNamesFiltered != null) {
			$("#rooms").empty();
			
			var levelsKeys = Object.keys(roomNamesFiltered);
			levelsKeys.sort(function (a,b) { return parseFloat(a)-parseFloat(b);});
			
			for(var i in levelsKeys) {
				var lvl = levelsKeys[i];
				//Create new level row
				var newRow = document.createElement("div");
				
				//Add class
				$("#rooms").append(newRow);
				$("#rooms div:last").addClass("lvl-row").attr("id", "lvl"+lvl);
				
				//Create cell for level name
				var newLvlName = document.createElement("div");
				$("#lvl"+lvl).append(newLvlName);
				$("#lvl"+lvl+" div").addClass("lvl-name").html(lvl);
				
				//Create cell for level rooms
				var newLvlRooms = document.createElement("div");
				$("#lvl"+lvl).append(newLvlRooms);
				$("#lvl"+lvl+" div:last").addClass("lvl-rooms").attr("id", "lvl"+lvl+"-rooms");
				
				//Init room list
				var newRoomList = document.createElement("ul");
				$("#lvl"+lvl+"-rooms").append(newRoomList);
				
				//Add each room
				for(var room in roomNamesFiltered[lvl]) {
					var newRoom = document.createElement("li");
					$("#lvl"+lvl+"-rooms ul").append(newRoom);
					$("#lvl"+lvl+"-rooms ul li:last").addClass("ref");
					
					var roomIcon = document.createElement("img");
					var roomLink = document.createElement("a");
					$("#lvl"+lvl+"-rooms ul li:last").append(roomLink);
					
					if(STYLE != undefined) {
						var addImg = STYLE.images.indexOf(roomNamesFiltered[lvl][room].getStyle().getIconUrl()) >= 0;
						$("#lvl"+lvl+"-rooms ul li:last a").append(roomIcon);
					}
					
					var ftGeom = roomNamesFiltered[lvl][room].getGeometry();
					
					$("#lvl"+lvl+"-rooms ul li:last a")
						.append(document.createTextNode(" "+room))
						.attr("href", "#")
						.attr("onclick", "controller.getView().getMapView().goTo('"+roomNamesFiltered[lvl][room].getId()+"','"+lvl+"')");
					
					if(STYLE != undefined) {
						$("#lvl"+lvl+"-rooms ul li:last a img")
							.attr("src", OLvlUp.view.ICON_FOLDER+'/'+
								((addImg) ? roomNamesFiltered[lvl][room].getStyle().getIconUrl() : 'default.svg')
							)
							.attr("width", OLvlUp.view.ICON_SIZE+"px");
					}
				}
			}
		}
	};
	
	/**
	 * Resets the room names list
	 */
	this.reset = function() {
		$("#search-room").val("Search");
		_self.update();
	};
	
	/**
	 * @return True if the searched string for filtering names is long enough
	 */
	this.searchOK = function() {
		var search = $("#search-room").val();
		return !_mainView.isMobile() && search != "Search" && search.length >= 3;
	};
	
	/**
	 * When search room input is changed
	 */
	this.searchFocus = function() {
		var search = $("#search-room").val();
		if(search == "Search" && $("#search-room").is(":focus")) {
			$("#search-room").val("");
		}
		else if(search == "" && !$("#search-room").is(":focus")) {
			$("#search-room").val("Search");
		}
	};

//INIT
	_init();
},



/**
 * The images overlay panel component
 */
ImagesView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;

//CONSTRUCTOR
	function _init() {
		$("#images-close").click(function() { $("#op-images").hide(); });
		$("#tab-imgs").click(function() { controller.getView().getImagesView().changeTab("tab-imgs"); });
		$("#tab-status").click(function() { controller.getView().getImagesView().changeTab("tab-status"); });
	};

//OTHER METHODS
	/**
	 * Opens and set images for the given feature
	 * @param ftId The feature ID
	 */
	this.open = function(ftId) {
		//Retrieve feature
		var imagesUrl = _mainView.getData().getFeature(ftId).getImages().get();
		
		//Create HTML
		var markup = '';
		for(var i in imagesUrl) {
			var url = imagesUrl[i];
			markup += '<a href="'+url+'" target="_blank"><img src="'+url+'" /></a><br />';
		}
		
		//Set tabs
		$("#tab-imgs div").html(markup);
		
		
		//Open panel
		$("#tab-imgs").addClass("selected");
		$("#op-images").show();
	};
	
 	/**
 	 * Changes the currently opened tab in images popup
 	 * @param tab The tab name
 	 */
 	this.changeTab = function(tab) {
 		$("#op-images .tabs div").removeClass("selected");
 		$("#"+tab).addClass("selected");
 	};

//INIT
	_init();
},



/**
 * The loading overlay panel component
 */
LoadingView: function() {
//ATTRIBUTES
	/** Is loading ? **/
	var _loading = false;
	
	/** The last timestamp **/
	var _lastTime = 0;

//ACCESSORS
	/**
	 * @return True if loading
	 */
	this.isLoading = function() {
		return _loading;
	};
	
//OTHER METHODS
	/**
	 * Shows or hides the loading component
	 * @param loading True if the application is loading something
	 */
	this.setLoading = function(loading) {
		_loading = loading;
		if(loading) {
			$("#op-loading-info li").remove();
			$("#op-loading").show();
			_lastTime = (new Date()).getTime();
		}
		else {
			$("#op-loading").hide();
			$(document).trigger("loading_done");
		}
	};
	
	/**
	 * Adds an information about the loading progress
	 * @param info The loading information to add
	 */
	this.addLoadingInfo = function(info) {
		//Timestamp
		var currentTime = (new Date()).getTime();
		$("#op-loading-info li:last").append(' <small>'+(currentTime-_lastTime)+' ms</small>');
		
		//Add a new child in list, corresponding to the given message
		var newLi = document.createElement("li");
		$("#op-loading-info").append(newLi);
		
		//Add text to the added child
		$("#op-loading-info li:last-child").html(info);
		
		_lastTime = currentTime;
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
	
	
	/**
	 * Clears all messages.
	 */
	this.clear = function() {
		$("#infobox-list li").remove();
		_nbMessages = 0;
	};
}

};
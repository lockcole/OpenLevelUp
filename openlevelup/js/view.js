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
 * View JS classes
 */

/**
 * The main view class.
 * It handles the index page, and contains links to sub-components.
 */
var MainView = function(ctrl) {
//ATTRIBUTES
	/** The main controller **/
	this._ctrl = ctrl;
	
	/** Is the user using a WebGL capable browser ? **/
	this._hasWebGL = Detector.webgl;
	
	/*
	 * The view components
	 */
	/** The loading component **/
	this._cLoading = new LoadingView();
	
	/** The about component **/
	this._cAbout = new AboutView();
	
	/** The messages stack component **/
	this._cMessages = new MessagesView();
	
	/** The URL component **/
	this._cUrl = null;
	
	/** The options component **/
	this._cOptions = new OptionsView();
	
	/** The export component **/
// 	this._cExport = null;
	
	/** The names component **/
	this._cNames = null;
	
	/** The images component **/
	this._cImages = null;
	
	/** The levels component **/
	this._cLevel = null;
	
	/** The tags component **/
	this._cTags = null;

	/** The notes component **/
	this._cNotes = null;
	
	/** The map component **/
	this._cMap = null;

//CONSTRUCTOR
	this._cUrl = new URLView(this);
	this._cMap = new MapView(this);
	this._cNames = new NamesView(this);
	this._cImages = new ImagesView(this);
	this._cLevel = new LevelView(this);
// 	this._cExport = new ExportView(this);
	this._cTags = new TagsView(this);
	this._cNotes = new NotesView(this);
	
// 	this._cExport.hideButton();
	this._cNames.hideButton();
	this._cLevel.disable();
	
	//Link on logo
	$("#logo-link").click(function() {
		controller.getView().getMapView().resetView();
	});
	
	//Collapse sidebar if is mobile
	if($(window).width() < 768) {
		$("#sidebar").addClass("collapsed");
		$("#sidebar li.active").removeClass("active");
	}
};

//ACCESSORS
	/**
	 * @return True if the application is viewed in a mobile device
	 */
	MainView.prototype.isMobile = function() {
		return $(window).width() < 768;
	};
	
	/**
	 * @return True if the browser is WebGL capable
	 */
	MainView.prototype.hasWebGL = function() {
		return this._hasWebGL;
	};
	
	/**
	 * @return The URL component
	 */
	MainView.prototype.getUrlView = function() {
		return this._cUrl;
	};
	
	/**
	 * @return The map component
	 */
	MainView.prototype.getMapView = function() {
		return this._cMap;
	};
	
	/**
	 * @return The messages stack component
	 */
	MainView.prototype.getMessagesView = function() {
		return this._cMessages;
	};
	
	/**
	 * @return The options component
	 */
	MainView.prototype.getOptionsView = function() {
		return this._cOptions;
	};
	
	/**
	 * @return The loading component
	 */
	MainView.prototype.getLoadingView = function() {
		return this._cLoading;
	};
	
	/**
	 * @return The images component
	 */
	MainView.prototype.getImagesView = function() {
		return this._cImages;
	};
	
	/**
	 * @return The level component
	 */
	MainView.prototype.getLevelView = function() {
		return this._cLevel;
	};
	
	/**
	 * @return The tags component
	 */
	MainView.prototype.getTagsView = function() {
		return this._cTags;
	};
	
	/**
	 * @return The notes component
	 */
	MainView.prototype.getNotesView = function() {
		return this._cNotes;
	};
	
	/**
	 * @return The map data from the controller
	 */
	MainView.prototype.getData = function() {
		return this._ctrl.getData();
	};
	
	/**
	 * @return The cluster data from the controller
	 */
	MainView.prototype.getClusterData = function() {
		return this._ctrl.getClusterData();
	};
	
	/**
	 * @return The notes data from the controller
	 */
	MainView.prototype.getNotesData = function() {
		return (this._ctrl.getNotesData() != null) ? this._ctrl.getNotesData().get() : null;
	};

//OTHER METHODS
	/**
	 * Updates the view when map moves or zoom changes
	 */
	MainView.prototype.updateMapMoved = function() {
		var zoom = this._cMap.get().getZoom();
		var oldZoom = this._cMap.getOldZoom();
		
		//Check new zoom value
		if(zoom >= CONFIG.view.map.full_data_min_zoom) {
			//Update levels
			this._cLevel.update();
			
			//Add names and export buttons if needed
			if(oldZoom == null || oldZoom < CONFIG.view.map.full_data_min_zoom) {
// 				this._cExport.showButton();
				this._cNames.showButton();
				this._cNotes.showButton();
				this._cLevel.enable();
				this._cOptions.enable();
				this._cMap.update();
			}
		}
		else if(zoom >= CONFIG.view.map.data_min_zoom) {
			//Update levels
			this._cLevel.update();
			
			//Add names and export buttons if needed
			if(oldZoom == null || oldZoom < CONFIG.view.map.data_min_zoom) {
// 				this._cExport.showButton();
				this._cNames.showButton();
				this._cNotes.showButton();
				this._cLevel.enable();
				this._cOptions.enable();
				this._cMap.update();
			}
			else if(oldZoom >= CONFIG.view.map.full_data_min_zoom) {
				this._cMap.update();
			}
		}
		else if(zoom >= CONFIG.view.map.cluster_min_zoom) {
			//Remove names and export buttons if needed
			if(oldZoom == null || oldZoom >= CONFIG.view.map.data_min_zoom) {
// 				this._cExport.hideButton();
				this._cNames.hideButton();
				this._cNotes.hideButton();
				this._cLevel.disable();
				this._cOptions.disable();
			}
			
			if(oldZoom == null || oldZoom >= CONFIG.view.map.data_min_zoom || oldZoom < CONFIG.view.map.cluster_min_zoom) {
				this._cMap.update();
			}
		}
		else {
			this._cMessages.displayMessage("Zoom in to see more information", "info");
			
			//Remove names and export buttons if needed
			if(oldZoom == null || oldZoom >= CONFIG.view.map.data_min_zoom) {
// 				this._cExport.hideButton();
				this._cNames.hideButton();
				this._cNotes.hideButton();
				this._cLevel.disable();
				this._cOptions.disable();
			}
			
			//Reset map
			if(oldZoom == null || oldZoom >= CONFIG.view.map.cluster_min_zoom) {
				this._cMap.update();
			}
		}
		
		this._cUrl.mapUpdated();
		this._cNames.update();
	};
	
	/**
	 * Updates the view when level changes
	 */
	MainView.prototype.updateLevelChanged = function() {
		this._cMap.update();
		this._cUrl.levelChanged();
	};
	
	/**
	 * Updates the view when an option changes
	 */
	MainView.prototype.updateOptionChanged = function() {
		this._cMap.update();
		this._cUrl.optionsChanged();
	};
	
	/**
	 * Updates the view when photos are added
	 */
	MainView.prototype.updatePhotosAdded = function() {
		this._cMap.update();
	};
	
	/**
	 * Updates the view when new note is added
	 */
	MainView.prototype.updateNoteAdded = function() {
		this._cMap.update();
	};
	
	/**
	 * Displays the given central panel
	 * @param id The panel ID
	 */
	MainView.prototype.showCentralPanel = function(id) {
		if(!$("#"+id).is(":visible")) {
			//Remove draggable marker if new note panel
			if($("#note-add").is(":visible")) {
				this._cMap.hideDraggableMarker();
			}
			
			$("#central .part").hide();
			$("#"+id).show();
			$("#main-buttons").addClass("opened");
			$("#central-close").show();
			$("#central-close").click(controller.getView().hideCentralPanel.bind(this));
		}
		else {
			this.hideCentralPanel();
		}
	};
	
	/**
	 * Hides the central panel
	 */
	MainView.prototype.hideCentralPanel = function() {
		$("#central .part").hide();
		$("#central-close").hide();
		$("#central-close").off("click");
		$("#main-buttons").removeClass("opened");
		
		this._cMap.hideDraggableMarker();
	};



/**
 * The map component, based on Leaflet library
 */
var MapView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;
	
	/** The map object **/
	this._map = null;
	
	/** The tile layers objects **/
	this._tileLayers = null;
	
	/** The current tile layer **/
	this._tileLayer = null;
	
	/** The opacity for tiles to use **/
	this._tileOpacity = 1;
	
	/** The current data layer **/
	this._dataLayer = null;
	
	/** The feature popups **/
	this._dataPopups = {};
	
	/** The draggable marker **/
	this._draggableMarker = null;
	
	/** The previous zoom value **/
	this._oldZoom = null;

//CONSTRUCTOR
	var isMobile = this._mainView.isMobile();
	
	//Get URL values to restore
	var url = this._mainView.getUrlView();
	var lat = (url.getLatitude() != undefined) ? url.getLatitude() : 47;
	var lon = (url.getLongitude() != undefined) ? url.getLongitude() : 2;
	var zoom = (url.getZoom() != undefined) ? url.getZoom() : 6;
	var bbox = url.getBBox();
	var tiles = url.getTiles();
	
	//Init map center and zoom
	this._map = L.map('map', {minZoom: 1, maxZoom: CONFIG.view.map.max_zoom, zoomControl: false});
	if(bbox != undefined) {
		//Get latitude and longitude information from BBox string
		var coordinates = bbox.split(',');
		
		if(coordinates.length == 4) {
			var sw = L.latLng(coordinates[1], coordinates[0]);
			var ne = L.latLng(coordinates[3], coordinates[2]);
			var bounds = L.latLngBounds(sw, ne);
			this._map.fitBounds(bounds);
		}
		else {
			this._mainView.getMessagesView().displayMessage("Invalid bounding box", "alert");
			this._map.setView([lat, lon], zoom);
		}
	}
	else {
		this._map.setView([lat, lon], zoom);
	}
	
	if(!isMobile) {
		L.control.zoom({ position: "topright" }).addTo(this._map);
	}
	
	//Add search bar
	//TODO Remove mobile condition, only to get to time to solve search bar bug
	if(!isMobile) {
		var search = L.Control.geocoder({ position: "topright" });
		//Limit max zoom in order to avoid having no tiles in background for small objects
		var minimalMaxZoom = CONFIG.tiles[0].maxZoom;
		for(var i=0; i < CONFIG.tiles.length; i++) {
			if(CONFIG.tiles[i].maxZoom < minimalMaxZoom) {
				minimalMaxZoom = CONFIG.tiles[i].maxZoom;
			}
		}
		//Redefine markGeocode to avoid having an icon for the result
		search.markGeocode = function (result) {
			this._map.fitBounds(result.bbox, { maxZoom: minimalMaxZoom });
			return this;
		};
		search.addTo(this._map);
	}
	
	if(isMobile) {
		L.control.zoom({ position: "topright" }).addTo(this._map);
	}
	
	//Create tile layers
	this._tileLayers = [];
	var tileLayers = [];
	var firstLayer = true;
	
	for(var l=0; l < CONFIG.tiles.length; l++) {
		var currentLayer = CONFIG.tiles[l];
		var tileOptions = {
			minZoom: currentLayer.minZoom,
			maxZoom: currentLayer.maxZoom,
			attribution: currentLayer.attribution+" | "+CONFIG.osm.attribution,
		};
		if(currentLayer.subdomains != undefined) {
			tileOptions.subdomains = currentLayer.subdomains;
		}
		
		tileLayers[currentLayer.name] = new L.TileLayer(
			currentLayer.URL,
			tileOptions
		);
		this._tileLayers.push(tileLayers[currentLayer.name]);
		
		if(firstLayer && tiles == undefined) {
			this._map.addLayer(tileLayers[currentLayer.name]);
			firstLayer = false;
			this._tileLayer = l;
		}
		else if(l == tiles) {
			this._map.addLayer(tileLayers[currentLayer.name]);
			this._tileLayer = l;
		}
	}
	L.control.layers(tileLayers).addTo(this._map);
	
	//Init sidebar
	L.control.sidebar("sidebar").addTo(this._map);
	
	//Trigger for map events
	this._map.on('moveend', function(e) { controller.onMapUpdate(); });
	this._map.on("baselayerchange", controller.onMapLayerChange);
	this._map.on("layeradd", controller.onMapLayerAdd);
};

//ACCESSORS
	/**
	 * @return The map object
	 */
	MapView.prototype.get = function() {
		return this._map;
	};
	
	/**
	 * @return The currently shown tile layer
	 */
	MapView.prototype.getTileLayer = function() {
		return this._tileLayer;
	};
	
	/**
	 * @return The previous zoom value
	 */
	MapView.prototype.getOldZoom = function() {
		return this._oldZoom;
	};

//MODIFIERS
	/**
	 * Resets some variables
	 */
	MapView.prototype.resetVars = function() {
		this._oldZoom = null;
	};
	
	/**
	 * Zoom and set center on default position
	 */
	MapView.prototype.resetView = function() {
		this._map.setView(L.latLng(47, 2), 6);
	};

//OTHER METHODS
	/**
	 * Event handler for map movement or level change
	 * Refreshes data on map
	 */
	MapView.prototype.update = function() {
		var timeStart = new Date().getTime();
		
		//Delete previous data
		if(this._dataLayer != null) {
			this._map.removeLayer(this._dataLayer);
			this._dataLayer = null;
			this._dataPopups = {};
		}
		
		//Create data (specific to level)
		var zoom = this._map.getZoom();
		
		if(zoom >= CONFIG.view.map.data_min_zoom) {
			var fullData = this._createFullData();
			
			//Add data to map
			if(fullData != null) {
				//Create data layer
				this._dataLayer = L.layerGroup();
				this._dataLayer.addTo(this._map);
				
				//Order layers
				var featureLayersKeys = Object.keys(fullData).sort(function(a,b) { return parseInt(a) - parseInt(b); });
				for(var i=0; i < featureLayersKeys.length; i++) {
					var featureLayerGroup = fullData[featureLayersKeys[i]];
					this._dataLayer.addLayer(featureLayerGroup);
				}
				
				//Show OSM notes if needed
				if(this._mainView.getOptionsView().showNotes()) {
					var notesLayer = this._createNotesLayer();
					if(notesLayer != null) {
						this._dataLayer.addLayer(notesLayer);
					}
				}
			}
			else {
				this._mainView.getMessagesView().displayMessage("There is no available data in this area", "alert");
			}
		}
		else if(zoom >= CONFIG.view.map.cluster_min_zoom) {
			this._dataLayer = this._createClusterData();
			
			//Add data to map
			if(this._dataLayer != null) {
				this._dataLayer.addTo(this._map);
			}
			else {
				this._mainView.getMessagesView().displayMessage("There is no available data in this area", "alert");
			}
		}
		
		//Change old zoom value
		this._oldZoom = this._map.getZoom();
		
		this.changeTilesOpacity();
		
		//console.log("[Time] View update: "+((new Date().getTime()) - timeStart));
	};
	
	/**
	 * Changes the currently shown tile layer
	 * @param name The tile layer name
	 */
	MapView.prototype.setTileLayer = function(name) {
		for(var i=0; i < CONFIG.tiles.length; i++) {
			if(CONFIG.tiles[i].name == name) {
				this._tileLayer = i;
				break;
			}
		}
		this._tileLayers[this._tileLayer].setOpacity(this._tileOpacity);
		this._mainView.getUrlView().tilesChanged();
	};

	/**
	 * Create data for detailled levels
	 * @return The data layers for leaflet
	 */
	MapView.prototype._createFullData = function() {
		var features = this._mainView.getData().getFeatures();
		var result = null;
		var details = this._map.getZoom() >= CONFIG.view.map.full_data_min_zoom;
		
		if(features != null) {
			var dispayableFeatures = 0;
			var featureLayers = {};
			
			//Analyze each feature
			for(var featureId in features) {
				try {
					var feature = features[featureId];
					var featureView = new FeatureView(this._mainView, feature, details);
					
					if(featureView.getLayer() != null) {
						var relLayer = featureView.getRelativeLayer().toString();
						
						//Create feature layer if needed
						if(featureLayers[relLayer] == undefined) {
							featureLayers[relLayer] = L.featureGroup();
						}
						
						//Add to feature layers
						featureLayers[relLayer].addLayer(featureView.getLayer());
						if(featureView.hasPopup()) {
							this._dataPopups[featureId] = featureView.getLayer();
						}
						
						dispayableFeatures++;
					}
				}
				catch(e) {
					console.error(e);
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
	MapView.prototype._createClusterData = function() {
		var data = this._mainView.getClusterData().get();
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
	 * @return The notes layer, or null if no notes available
	 */
	MapView.prototype._createNotesLayer = function() {
		var result = null;
		var notes = this._mainView.getNotesData();
		
		//Create icons
		var iconOpen = L.icon({
			iconUrl: 'img/icon_note_open.png'
		});
		var iconClosed = L.icon({
			iconUrl: 'img/icon_note_closed.png'
		});
		
		if(notes != null && notes.length > 0) {
			result = L.layerGroup();
			var note, marker;
			
			for(var i=0, l=notes.length; i < l; i++) {
				note = notes[i];
				marker = L.marker(
							[note.lat, note.lon],
							{
								id: i,
								icon: (note.status == "closed") ? iconClosed : iconOpen,
								zIndexOffset: (note.status == "closed") ? 999 : 1000,
							}
						);
				marker.on("click", controller.getView().getNotesView().show.bind(controller.getView().getNotesView()));
				result.addLayer(marker);
			}
		}
		
		return result;
	};
	
	/**
	 * Changes the tiles opacity, depending of shown level
	 */
	MapView.prototype.changeTilesOpacity = function() {
		this._tileOpacity = 1;
		
		if(this._map.getZoom() >= CONFIG.view.map.data_min_zoom && this._mainView.getData() != null) {
			var levelsArray = this._mainView.getData().getLevels();
			
			//Find level 0 index in levels array
			var levelZero = levelsArray.indexOf(0);
			var midLevel = (levelZero >= 0) ? levelZero : Math.floor(levelsArray.length / 2);
			
			//Extract level sub-arrays
			var levelsNegative = levelsArray.slice(0, midLevel);
			var levelsPositive = levelsArray.slice(midLevel+1);
			
			//Calculate new opacity, depending of level position in levels array
			var currentLevel = this._mainView.getLevelView().get();
			if(currentLevel != null) {
				var idNeg = levelsNegative.indexOf(currentLevel);
				var idPos = levelsPositive.indexOf(currentLevel);
				if(idNeg >= 0) {
					var coef = idNeg / levelsNegative.length * (CONFIG.view.map.tiles_max_opacity - CONFIG.view.map.tiles_min_opacity);
					this._tileOpacity = CONFIG.view.map.tiles_min_opacity + coef;
				}
				else if(idPos >= 0) {
					var coef = (levelsPositive.length - 1 - idPos) / levelsPositive.length * (CONFIG.view.map.tiles_max_opacity - CONFIG.view.map.tiles_min_opacity);
					this._tileOpacity = CONFIG.view.map.tiles_min_opacity + coef;
				}
				else {
					this._tileOpacity = CONFIG.view.map.tiles_max_opacity;
				}
			}
		}
		
		//Update tiles opacity
		this._tileLayers[this._tileLayer].setOpacity(this._tileOpacity);
	};
	
	/**
	 * This functions makes map go to given coordinates, at given level
	 * @param ftId The feature ID
	 * @param lvl The level
	 */
	MapView.prototype.goTo = function(ftId, lvl) {
		//Change level
		this._mainView.getLevelView().set(lvl);
		this._mainView.updateLevelChanged();
		
		//Retrieve feature
		var feature = this._mainView.getData().getFeature(ftId);
		
		//Zoom on feature
		var centroidLatLng = feature.getGeometry().getCentroid();
		this._map.setView(centroidLatLng, 21);
		
		//Open popup
		setTimeout(function() {
			if(this._mainView.getLoadingView().isLoading()) {
				$(document).bind("loading_done", function() {
					if(this._dataPopups[ftId] != undefined) {
						this._dataPopups[ftId].openPopup(centroidLatLng);
					}
					else {
						console.error("[Rooms] Undefined popup for "+ftId);
					}
					$(document).unbind("loading_done");
				}.bind(this));
			}
			else {
				if(this._dataPopups[ftId] != undefined) {
					this._dataPopups[ftId].openPopup(centroidLatLng);
				}
				else {
					console.error("[Rooms] Undefined popup for "+ftId);
				}
			}
		}.bind(this),
		300);
	};
	
	/**
	 * Shows a draggable marker on map (mainly for notes)
	 */
	MapView.prototype.showDraggableMarker = function() {
		if(this._draggableMarker == null) {
			var iconAdd = L.icon({
				iconUrl: 'img/icon_note_new.png',
				className: 'note-new-icon'
			});
			this._draggableMarker = new L.marker(this._map.getCenter(), { draggable: true, icon: iconAdd, zIndexOffset: 10000 }).addTo(this._map);
		}
		else {
			this._draggableMarker.setLatLng(this._map.getCenter()).addTo(this._map);
		}
	};
	
	/**
	 * Hides the draggable marker
	 */
	MapView.prototype.hideDraggableMarker = function() {
		if(this._draggableMarker != null) {
			this._map.removeLayer(this._draggableMarker);
		}
	};
	
	/**
	 * Get the draggable marker coordinates
	 * @return The LatLng, or null if draggable isn't visible
	 */
	MapView.prototype.getDraggableMarkerCoords = function() {
		return (this._draggableMarker != null) ? this._draggableMarker.getLatLng() : null;
	};



/**
 * The component for a single feature
 */
var FeatureView = function(main, feature, details) {
//ATTRIBUTES
	/** The feature layer **/
	this._layer = null;
	
	/** Does this object has a popup ? **/
	this._hasPopup = false;
	
	/** The main view **/
	this._mainView = main;
	
	/** The feature **/
	this._feature = feature;
	
	/** Are we in full details mode ? **/
	this._showDetails = details;
	
	this._init();
};

//CONSTRUCTOR
	FeatureView.prototype._init = function() {
		if(this._isDisplayable(this._feature)) {
			var style = this._feature.getStyle().get();
			var geom = this._feature.getGeometry();
			var geomType = geom.getType();
			var hasIcon = style.icon != undefined;
			var geomLatLng = geom.getLatLng();
			this._layer = L.featureGroup();
			
			//Init layer object, depending of geometry type
			switch(geomType) {
				case "Point":
					var marker = this._createMarker(geomLatLng);
					if(marker != null) {
						this._layer.addLayer(marker);
						hasIcon = true;
						
						marker = null;
					}
					break;
					
				case "LineString":
					this._layer.addLayer(L.polyline(geomLatLng, style));
					break;
					
				case "Polygon":
					this._layer.addLayer(L.polygon(geomLatLng, style));
					break;
					
				case "MultiPolygon":
					this._layer.addLayer(L.multiPolygon(geomLatLng, style));
					break;
					
				default:
					console.log("Unknown geometry type: "+geomType);
			}
			
			//Look for an icon or a label
			var labelizable = this._labelizable();
			var hasPhoto = this._mainView.getOptionsView().showPhotos() && (this._feature.getImages().hasValidImages() || (this._mainView.hasWebGL() && !this._mainView.isMobile() && this._feature.getImages().hasValidSpherical()));
			
			if(hasIcon || labelizable || hasPhoto) {
				switch(geomType) {
					case "Point":
						//Labels
						if(labelizable) {
							this._layer.addLayer(this._createLabel(geomLatLng, hasIcon));
						}
						
						if(hasPhoto) {
							this._layer.addLayer(this._createPhotoIcon(geomLatLng));
						}
						break;
						
					case "LineString":
						var ftGeomJSON = geom.get();
						var nbSegments = ftGeomJSON.coordinates.length - 1;
						
						//For each segment, add an icon
						var coord1, coord2, coordMid, angle, coord, marker;
						for(var i=0; i < nbSegments; i++) {
							coord1 = ftGeomJSON.coordinates[i];
							coord2 = ftGeomJSON.coordinates[i+1];
							coordMid = [ (coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2 ];
							angle = azimuth({lat: coord1[1], lng: coord1[0], elv: 0}, {lat: coord2[1], lng: coord2[0], elv: 0}).azimuth;
							coord = L.latLng(coordMid[1], coordMid[0]);
							
							if(hasIcon) {
								if(style.rotateIcon) {
									marker = this._createMarker(coord, angle);
									if(marker != null) {
										this._layer.addLayer(marker);
									}
								}
								else {
									marker = this._createMarker(coord);
									if(marker != null) {
										this._layer.addLayer(marker);
									}
								}
							}
							
							//Labels
							if(labelizable) {
								this._layer.addLayer(this._createLabel(coord, hasIcon, angle));
							}
							
							if(hasPhoto) {
								this._layer.addLayer(this._createPhotoIcon(coord));
							}
						}
						
						//Clear tmp objects
						coord1 = null;
						coord2 = null;
						coordMid = null;
						angle = null;
						coord = null;
						marker = null;
						ftGeomJSON = null;
						nbSegments = null;
						
						break;
						
					case "Polygon":
						var coord = geom.getCentroid();
						
						if(hasIcon) {
							var marker = this._createMarker(coord);
							if(marker != null) {
								this._layer.addLayer(marker);
							}
						}
						
						//Labels
						if(labelizable) {
							this._layer.addLayer(this._createLabel(coord, hasIcon));
						}
						
						if(hasPhoto) {
							this._layer.addLayer(this._createPhotoIcon(coord));
						}
						
						//Clear tmp objects
						coord = null;
						
						break;
					
					case "MultiPolygon":
						var ftGeomJSON = geom.get();
						var nbPolygons = ftGeomJSON.coordinates.length;
						
						//For each polygon, add an icon
						var coordMid, coordsPolygon, length, coord, marker;
						for(var i=0; i < nbPolygons; i++) {
							coordMid = [0, 0];
							coordsPolygon = ftGeomJSON.coordinates[i];
							length = coordsPolygon[0].length;
							for(var j=0; j < length; j++) {
								if(j < length - 1) {
									coordMid[0] += coordsPolygon[0][j][0];
									coordMid[1] += coordsPolygon[0][j][1];
								}
							}
							
							coordMid[0] = coordMid[0] / (length -1);
							coordMid[1] = coordMid[1] / (length -1);
							coord = L.latLng(coordMid[1], coordMid[0]);
							
							if(hasIcon) {
								marker = this._createMarker(coord);
								if(marker != null) {
									this._layer.addLayer(marker);
								}
							}
							
							//Labels
							if(labelizable) {
								this._layer.addLayer(this._createLabel(coord, hasIcon, angle));
							}
							
							if(hasPhoto) {
								this._layer.addLayer(this._createPhotoIcon(coord));
							}
						}
						
						//Clear tmp objects
						ftGeomJSON = null;
						nbPolygons = null;
						coordMid = null;
						coordsPolygon = null;
						length = null;
						coord = null;
						marker = null;
						
						break;
						
					default:
						console.log("Unknown geometry type: "+geomType);
				}
			}
			
			//Add popup if needed
			if(style.popup == undefined || style.popup == "yes") {
				this._layer.bindPopup(this.createPopup());
				this._hasPopup = true;
			}
			
			//Clear tmp objects
			style = null;
			geom = null;
			geomType = null;
			hasIcon = null;
			geomLatLng = null;
			labelizable = null;
			hasPhoto = null;
		}
	};

//ACCESSORS
	/**
	 * @return The relative layer to overlay object on map
	 */
	FeatureView.prototype.getRelativeLayer = function() {
		//Determine relative layer
		var relLayer = this._feature.getStyle().get().layer;
		if(relLayer != undefined) {
			relLayer = parseFloat(relLayer);
			if(!isNaN(relLayer)) {
				this._relLayer = relLayer;
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
	FeatureView.prototype.getLayer = function() {
		return this._layer;
	};
	
	/**
	 * @return True if this view has an associated popup
	 */
	FeatureView.prototype.hasPopup = function() {
		return this._hasPopup;
	};
	
//OTHER METHODS
	/**
	 * Should the given feature be shown, regarding to view context ?
	 * @return True if yes
	 */
	FeatureView.prototype._isDisplayable = function() {
		var ftTags = this._feature.getTags();
		var ftLevels = this._feature.onLevels();
		var options = this._mainView.getOptionsView();
		
		var addObject = false;
		
		//Check if is this object should be shown only in details mode
		var isDetail = this._feature.getStyle().isDetail();
		if(isDetail && !this._showDetails) { return false; }
		
		//Object with levels defined
		if(ftLevels.length > 0) {
			var nbTags = Object.keys(ftTags).length;

			addObject = nbTags > 0
					&& (nbTags > 1 || ftTags.area == undefined)
					&& this._feature.isOnLevel(this._mainView.getLevelView().get())
					&& (options.showTranscendent() || ftLevels.length == 1)
					&& (!options.showBuildingsOnly() || ftTags.building != undefined)
					&& (options.showUnrendered() || Object.keys(this._feature.getStyle().get()).length > 0);
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

//		if(!addObject) {
//			console.log("Unrendered object: "+this._feature.getId());
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
	FeatureView.prototype._createMarker = function(latlng, angle) {
		var result = null;
		var iconUrl = null;
		var style = this._feature.getStyle().get();
		angle = angle || null;
		
		var tmpUrl = this._feature.getStyle().getIconUrl();
		
		if(tmpUrl != null) {
			iconUrl = CONFIG.view.icons.folder+'/'+tmpUrl;
		}
		else if(style.showMissingIcon == undefined || style.showMissingIcon) {
			iconUrl = CONFIG.view.icons.folder+'/icon_default.png';
		}
		else if(this._feature.getGeometry().getType() == "Point") {
			result = L.circleMarker(latlng, style);
		}
		
		if(iconUrl != null) {
			var myIcon = L.icon({
				iconUrl: iconUrl,
				iconSize: [CONFIG.view.icons.size, CONFIG.view.icons.size],
				iconAnchor: [CONFIG.view.icons.size/2, CONFIG.view.icons.size/2],
				popupAnchor: [0, -CONFIG.view.icons.size/2]
			});
			
			if(angle != null) {
				result = L.rotatedMarker(latlng, {icon: myIcon, angle: angle});
			}
			else {
				result = L.marker(latlng, {icon: myIcon});
			}
		}
			
		return result;
	}
	
	/**
	 * Creates a photo marker with the given coordinates
	 * @param latlng The coordinates as leaflet LatLng
	 * @return The marker as leaflet layer
	 */
	FeatureView.prototype._createPhotoIcon = function(latlng) {
		var size = this._feature.getImages().countImages();
		
		return L.circleMarker(latlng,{
			color: "green",
			fill: false,
			opacity: 0.7,
			radius: CONFIG.view.icons.size/2 + size,
			weight: 1 + size
		})
	};
	
	/**
	 * Creates the popup for a given feature
	 * @return The popup object
	 */
	FeatureView.prototype.createPopup = function() {
		var style = this._feature.getStyle().get();
		var isMobile = this._mainView.isMobile();
		var iconUrl = this._feature.getStyle().getIconUrl();
		
		/*
		 * Title
		 */
		var text = '<h1 class="popup">';
		
		//Add icon in title
		if(iconUrl != null) {
			text += '<img class="icon" src="'+CONFIG.view.icons.folder+'/'+iconUrl+'" /> ';
		}
		
		//Object name (its name tag or its type)
		text += this._feature.getName();
		
		//Add up and down icons if levelup property == true
		var ftLevels = this._feature.onLevels();
		if(style.levelup && ftLevels.length > 0 && !isMobile) {
			//Able to go up ?
			var levelId = ftLevels.indexOf(this._mainView.getLevelView().get());
			if(levelId < ftLevels.length -1) {
				text += ' <a onclick="controller.toLevel('+ftLevels[levelId+1]+')" href="#"><img src="'+CONFIG.view.icons.folder+'/arrow_up_3.png" title="Go up" alt="Up!" /></a>';
			}
			//Able to go down ?
			if(levelId > 0) {
				text += ' <a onclick="controller.toLevel('+ftLevels[levelId-1]+')" href="#"><img src="'+CONFIG.view.icons.folder+'/arrow_down_3.png" title="Go down" alt="Down!" /></a>';
			}
		}

		/*
		 * Links
		 */
		text += '</h1><div class="popup-footer">';
		
		//Picture link
		if(this._feature.getImages().hasValidImages() || (this._mainView.hasWebGL() && !this._mainView.isMobile() && this._feature.getImages().hasValidSpherical())) {
			text += '<a href="#" id="images-open" title="Related pictures" onclick="controller.getView().getImagesView().open(\''+this._feature.getId()+'\')"><img src="img/icon_picture_2.svg" alt="Pictures" /></a> ';
		}
		
		//Tags and OSM links
		text += '<a href="#" id="tags-open" title="Tags" onclick="controller.getView().getTagsView().open(\''+this._feature.getId()+'\')"><img src="img/icon_tags.svg" alt="Tags" /></a><a href="http://www.openstreetmap.org/'+this._feature.getId()+'" title="See this on OSM.org" target="_blank"><img src="img/icon_osm.svg" alt="OSM.org" /></a></div>';
		
		var options = (isMobile) ? { autoPan: false } : { };
		
		return L.popup(options).setContent(text);
	}
	
	/**
	 * Should the feature receive a label ?
	 * @return True if it should have a label
	 */
	FeatureView.prototype._labelizable = function() {
		var ftStyle = this._feature.getStyle().get();
		return ftStyle.label != undefined && ftStyle.label != null && this._feature.hasTag(ftStyle.label);
	};
	
	/**
	 * Creates the label (as a marker) for the given feature
	 * @param coordinates The coordinates of the point where the label will be rendered
	 * @param hasMarker Does this feature will also be rendered as a marker (icon/circle) ?
	 * @param angle The rotation angle for label (default: 0)
	 * @return The label as a leaflet marker
	 */
	FeatureView.prototype._createLabel = function(coordinates, hasMarker, angle) {
		var styleRules = this._feature.getStyle().get();
		var angle = angle || false;
		if(angle != false) {
			angle = (angle >= 90) ? angle - 90 : angle + 270;
			angle = angle % 180;
		}
		
		var classes = (styleRules.labelStyle != undefined) ? ' '+styleRules.labelStyle : '';
		var text = this._feature.getTag(styleRules.label);
		var iconAnchor = (hasMarker) ? [ null, -CONFIG.view.icons.size/2] : [ null, CONFIG.view.icons.size/2 ];
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



/**
 * The tags overlay component
 */
var TagsView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;

//CONSTRUCTOR
	$("#tags-close").click(function() {
		$("#op-tags").removeClass("show");
		$("#op-tags").addClass("hide");
	});
};

//OTHER METHODS
	/**
	* Opens and set tags for the given feature
	* @param ftId The feature ID
	*/
	TagsView.prototype.open = function(ftId) {
		//Retrieve feature
		var ft = this._mainView.getData().getFeature(ftId);
		
		var tagList = "";
		var detailsTxt = '';
		var tags = ft.getTags();
		var first = true;
		var val, detail, link, icon, tagValue, vInt, v, vOk;
		var regex = /\$\{(\w+)\}/;
		var txtVals = {
			N: "North", NNE: "North North-east", NE:"North-east", ENE: "East North-east",
			E: "East", ESE: "East South-east", SE: "South-east", SSE: "South South-east",
			S: "South", SSW: "South South-west", SW: "South-west", WSW:"West South-west",
			W: "West", WNW: "West North-west", NW: "North-west", NNW: "North North-west",
			north: "North", south: "South", east: "East", west: "West"
		};
		
		for(var k in tags) {
			/*
			 * List tags
			 */
			if(!first) {
				tagList += ' + ';
			}
			else {
				first = false;
			}
			
			val = tags[k];
			tagList += '<span class="osm-tag"><a href="http://wiki.openstreetmap.org/wiki/Key:'+k+'" target="_blank" class="osm-key">'+k+'</a>=<span class="osm-val">'+val+'</span></span>';
			
			/*
			 * Details about the feature
			 */
			detail = STYLE.details[k];
			if(detail != undefined) {
				detailsTxt += '<span class="detail"><span class="label">';
				
				//Label
				if(detail.img != undefined) {
					detailsTxt += '<img src="'+CONFIG.view.icons.folder+'/'+detail.img+'" title="'+k+'" />';
				}
				else if(detail.name != undefined) {
					detailsTxt += detail.name;
				}
				else {
					detailsTxt += k;
				}
				
				detailsTxt += '</span><span class="value">';
				
				//Value
				switch(detail.values) {
					case "icons":
						if(detail.icons != undefined) {
							//Replace tag value in icon URL
							icon = detail.icons;
							if(regex.test(icon)) {
								//If an alias exists for the given value, replace
								if(detail.iconsAlias != undefined && detail.iconsAlias[val] != undefined) {
									icon = icon.replace(regex, detail.iconsAlias[val]);
								}
								else {
									icon = icon.replace(regex, val);
								}
								
								//Check if icon file exists (to avoid exotic values)
								if(!contains(STYLE.images, icon)) {
									console.warn("[View] Invalid icon for details "+icon);
									detailsTxt += val;
								}
								else {
									detailsTxt += '<img src="'+CONFIG.view.icons.folder+'/'+icon+'" title="'+val+'" />';
								}
							}
							else {
								detailsTxt += '<img src="'+CONFIG.view.icons.folder+'/'+detail.icons+'" title="'+val+'" />';
							}
						}
						else {
							console.warn("[View] Missing icon "+details.icons);
						}
						break;

					case "link":
						link = val;
						if(detail.link != undefined) {
							link = detail.link.replace(regex, val);
						}
						detailsTxt += '<a href="'+link+'" target="_blank"><img src="'+CONFIG.view.icons.folder+'/icon_link.svg" alt="Link" /></a>';
						break;

					case "direction":
						//Is the orientation a number value or not ?
						vInt = parseInt(val);
						if(isNaN(vInt)) {
							vOk = txtVals[val];
							v = (vOk == undefined) ? "Invalid" : vOk;
						}
						else {
							//Define a simple direction
							if((vInt >= 337 && vInt < 360) || (vInt >= 0 && vInt < 22)) {
								v = "North";
							}
							else if(vInt >= 22 && vInt < 67) {
								v = "North-east";
							}
							else if(vInt >= 67 && vInt < 112) {
								v = "East";
							}
							else if(vInt >= 112 && vInt < 157) {
								v = "South-east";
							}
							else if(vInt >= 157 && vInt < 202) {
								v = "South";
							}
							else if(vInt >= 202 && vInt < 247) {
								v = "South-west";
							}
							else if(vInt >= 247 && vInt < 292) {
								v = "West";
							}
							else if(vInt >= 292 && vInt < 337) {
								v = "North-west";
							}
							else {
								v = "Invalid";
							}
						}
						
						detailsTxt += v;
						break;
					
					case "measure":
						v = parseFloat(val);
						if(isNaN(v)) {
							detailsTxt += val;
						}
						else {
							detailsTxt += val+detail.unit;
						}
						break;

					case "hours":
						detailsTxt += '<a href="http://github.pavie.info/yohours/?oh='+encodeURIComponent(val)+'" target="_blank"><img src="'+CONFIG.view.icons.folder+'/icon_link.svg" alt="YoHours" /></a>';
						break;
					
					case "text":
					default:
						detailsTxt += val;
				}
				
				detailsTxt += '</span></span>';
			}
		}
		
		console.log("layer",ft.getStyle().get().layer);
		
		$("#op-tags-list").html(tagList);
		
		if(detailsTxt != '') {
			$("#op-tags-details").show();
			$("#op-tags-details").html(detailsTxt);
		}
		else {
			$("#op-tags-details").hide();
		}

		//Show panel
		$("#op-tags").removeClass("hide");
		$("#op-tags").addClass("show");
	};

	/**
	 * Creates a formated tag display
	 * @param ftId the feature ID
	 * @param key The OSM key to display
	 * @param cleanName The clean name to display
	 * @param tagCleaner The function that will clean the tag value (for example, add proper unit for dimensions), optional
	 * @return The formated tag, or empty string if not found
	 */
	TagsView.prototype._addFormatedTag = function(ftId, key, cleanName, tagCleaner) {
		var text = '';

		if(this._mainView.getData().getFeature(ftId).hasTag(key)) {
			text = (tagCleaner == undefined) ?
				'<span class="detail"><span class="label">'+cleanName+'</span><span class="value">'+this._mainView.getData().getFeature(ftId).getTag(key)+'</span></span>'
				: '<span class="detail"><span class="label">'+cleanName+'</span><span class="value">'+tagCleaner(this._mainView.getData().getFeature(ftId).getTag(key))+'</span></span>';
		}
		
		return text;
	};


	
/**
 * The levels component
 */
var LevelView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;
	
	/** The currently shown level **/
	this._level = parseFloat(this._mainView.getUrlView().getLevel());

	/** The available levels **/
	this._levels = null;
	
	/** Is the component enabled ? **/
	this._enabled = false;
};

//ACCESSORS
	/**
	 * @return The current level value
	 */
	LevelView.prototype.get = function() {
		return this._level;
	};

//MODIFIERS
	/**
	 * Changes the current level
	 * @param lvl The new level (if undefined, uses the current select value)
	 */
	LevelView.prototype.set = function(lvl) {
		var result = false;
		var data = this._mainView.getData();
		var lvlOk = (lvl != null) ? parseFloat(lvl) : parseFloat($("#level").val());
		
		if(data != null && data.getLevels() != null) {
			if(contains(data.getLevels(), lvlOk)) {
				//Change level
				this._level = lvlOk;
				if(lvl != null) { $("#level").val(lvlOk); }
				result = true;
			}
		}
		else {
			throw new Error("Invalid level");
		}
		
		return result;
	};
	
	/**
	 * Changes the level values depending of data
	 */
	LevelView.prototype.update = function() {
		this._levels = this._mainView.getData().getLevels();
		
		//Change current level if not available anymore
		if(this._level == null || !contains(this._levels, this._level)) {
			//Check if 
			//Set to 0 if available
			this._level = (contains(this._levels, 0)) ? 0 : this._levels[0];
			this._mainView.getUrlView().levelChanged();
		}
		
		/*
		 * Fill level selector
		 */
		var option = '';

		//Compute level and store them as select options
		for(var i=0; i < this._levels.length; i++) {
			var lvl = this._levels[i];
			
			option += '<option value="'+ lvl + '"';
			if(lvl == this._level) { option += ' selected="selected"'; }
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
	 * @return True if level was changed
	 */
	LevelView.prototype.up = function() {
		var result = false;
		
		if(this._mainView.getMapView().get().getZoom() >= CONFIG.view.map.data_min_zoom) {
			var currentLevelId = this._levels.indexOf(this._level);
			
			if(currentLevelId == -1) {
				this._mainView.getMessagesView().displayMessage("Invalid level", "error");
			}
			else if(currentLevelId + 1 < this._levels.length) {
				this.set(this._levels[currentLevelId+1]);
				result = true;
			}
			else {
				this._mainView.getMessagesView().displayMessage("You are already at the last available level", "alert");
			}
		}
		
		return result;
	};
	
	/**
	 * Goes to the lower level
	 * @return True if level was changed
	 */
	LevelView.prototype.down = function() {
		var result = false;
		
		if(this._mainView.getMapView().get().getZoom() >= CONFIG.view.map.data_min_zoom) {
			var currentLevelId = this._levels.indexOf(this._level);
			
			if(currentLevelId == -1) {
				this._mainView.getMessagesView().displayMessage("Invalid level", "error");
			}
			else if(currentLevelId > 0) {
				this.set(this._levels[currentLevelId-1]);
				result = true;
			}
			else {
				this._mainView.getMessagesView().displayMessage("You are already at the first available level", "alert");
			}
		}
		
		return result;
	};
	
	/**
	 * Disable level buttons
	 */
	LevelView.prototype.disable = function() {
		if(this._enabled) {
			this._enabled = false;
			$("#level").prop("disabled", true);
			$("#levelUp").off("click");
			$("#levelDown").off("click");
			$("#level").off("change");
		}
	};
	
	/**
	 * Enable level button
	 */
	LevelView.prototype.enable = function() {
		if(!this._enabled) {
			this._enabled = true;
			$("#level").prop("disabled", false);
			$("#levelUp").click(controller.onLevelUp);
			$("#levelDown").click(controller.onLevelDown);
			$("#level").change(controller.onLevelChange);
		}
	};



/**
 * The options component
 */
var OptionsView = function() {
//ATTRIBUTES
	/** Show transcendent elements **/
	this._transcend = true;
	
	/** Show unrendered elements **/
	this._unrendered = false;
	
	/** Show only buildings **/
	this._buildings = false;
	
	/** Show photos markers **/
	this._photos = false;
	
	/** Show OSM notes **/
	this._notes = false;

//CONSTRUCTOR
	//Init checkboxes
	$("#show-transcendent").prop("checked", this._transcend);
	$("#show-unrendered").prop("checked", this._unrendered);
	$("#show-buildings-only").prop("checked", this._buildings);
	$("#show-photos").prop("checked", this._photos);
	$("#show-notes").prop("checked", this._notes);
	
	//Add triggers
	$("#button-settings").click(function() {
		controller.getView().showCentralPanel("settings");
	});
	$("#show-transcendent").change(function() {
		this.changeTranscendent();
		controller.getView().updateOptionChanged();
	}.bind(this));
	$("#show-unrendered").change(function() {
		this.changeUnrendered();
		controller.getView().updateOptionChanged();
	}.bind(this));
	$("#show-buildings-only").change(function() {
		this.changeBuildingsOnly();
		controller.getView().updateOptionChanged();
	}.bind(this));
	$("#show-photos").change(function() {
		this.changePhotos();
		controller.getView().updateOptionChanged();
	}.bind(this));
	$("#show-notes").change(function() {
		this.changeNotes();
		controller.getView().updateOptionChanged();
	}.bind(this));
	
	this.enable();
};

//ACCESSORS
	/**
	 * @return Must we show transcendent objects ?
	 */
	OptionsView.prototype.showTranscendent = function() {
		return this._transcend;
	};
	
	/**
	 * @return Must we show unrendered objects ?
	 */
	OptionsView.prototype.showUnrendered = function() {
		return this._unrendered;
	};
	
	/**
	 * @return Must we show only building objects ?
	 */
	OptionsView.prototype.showBuildingsOnly = function() {
		return this._buildings;
	};
	
	/**
	 * @return Must we show photo markers ?
	 */
	OptionsView.prototype.showPhotos = function() {
		return this._photos;
	};
	
	/**
	 * @return Must we show notes markers ?
	 */
	OptionsView.prototype.showNotes = function() {
		return this._notes;
	};

//MODIFIERS
	/**
	 * Must we set transcendent objects ?
	 */
	OptionsView.prototype.changeTranscendent = function() {
		this._transcend = !this._transcend;
	};
	
	/**
	 * Must we set unrendered objects ?
	 */
	OptionsView.prototype.changeUnrendered = function() {
		this._unrendered = !this._unrendered;
	};
	
	/**
	 * Must we set only building objects ?
	 */
	OptionsView.prototype.changeBuildingsOnly = function() {
		this._buildings = !this._buildings;
	};
	
	/**
	 * Must we show photo markers ?
	 */
	OptionsView.prototype.changePhotos = function() {
		this._photos = !this._photos;
	};
	
	/**
	 * Must we show OSM notes ?
	 */
	OptionsView.prototype.changeNotes = function() {
		this._notes = !this._notes;
	};
	
	/**
	 * Must we set transcendent objects ?
	 */
	OptionsView.prototype.setTranscendent = function(p) {
		this._transcend = p;
		$("#show-transcendent").prop("checked", this._transcend);
	};
	
	/**
	 * Must we set unrendered objects ?
	 */
	OptionsView.prototype.setUnrendered = function(p) {
		this._unrendered = p;
		$("#show-unrendered").prop("checked", this._unrendered);
	};
	
	/**
	 * Must we set only building objects ?
	 */
	OptionsView.prototype.setBuildingsOnly = function(p) {
		this._buildings = p;
		$("#show-buildings-only").prop("checked", this._buildings);
	};
	
	/**
	 * Must we show photo markers ?
	 */
	OptionsView.prototype.setPhotos = function(p) {
		this._photos = p;
		$("#show-photos").prop("checked", this._photos);
	};
	
	/**
	 * Must we show notes markers ?
	 */
	OptionsView.prototype.setNotes = function(p) {
		this._notes = p;
		$("#show-notes").prop("checked", this._notes);
	};
	
	/**
	 * Disable options buttons
	 */
	OptionsView.prototype.disable = function() {
		$("#show-buildings-only").prop("disabled", true);
		$("#show-unrendered").prop("disabled", true);
		$("#show-transcendent").prop("disabled", true);
		$("#show-photos").prop("disabled", true);
		$("#show-notes").prop("disabled", true);
	};
	
	/**
	 * Enable level button
	 */
	OptionsView.prototype.enable = function() {
		$("#show-buildings-only").prop("disabled", false);
		$("#show-unrendered").prop("disabled", false);
		$("#show-transcendent").prop("disabled", false);
		$("#show-photos").prop("disabled", false);
		$("#show-notes").prop("disabled", false);
	};



/**
 * The export component
 */
// var ExportView = function(main) {
// //ATTRIBUTES
// 	/** The main view **/
// 	this._mainView = main;
// 
// //CONSTRUCTOR
// 	$("#button-export").click(function() {
// 		controller.getView().showCentralPanel("export");
// 	});
// 	//$("#export-link").click(controller.onExportLevel);
// 	//$("#export-link-img").click(controller.onExportLevelImage);
// };
// 	
// //OTHER METHODS
// 	/**
// 	 * Shows the export button
// 	 */
// 	ExportView.prototype.showButton = function() {
// 		$("#button-export").show();
// 	};
// 	
// 	/**
// 	 * Hides the export button
// 	 */
// 	ExportView.prototype.hideButton = function() {
// 		$("#button-export").hide();
// 		this._mainView.hideCentralPanel();
// 	};



/**
 * The permalink and browser URL component
 */
var URLView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;
	
	/*
	 * URL parameters
	 */
	this._bbox = null;
	this._lat = null;
	this._lon = null;
	this._zoom = null;
	this._level = null;
	this._tiles = null;

//CONSTRUCTOR
	this._readUrl();
	this._setShortlink();
};

//ACCESSORS
	/**
	 * @return The tile layer to display
	 */
	URLView.prototype.getTiles = function() {
		return this._tiles;
	};
	
	/**
	 * @return The bounding box
	 */
	URLView.prototype.getBBox = function() {
		return this._bbox;
	};
	
	/**
	 * @return The latitude
	 */
	URLView.prototype.getLatitude = function() {
		return this._lat;
	};
	
	/**
	 * @return The longitude
	 */
	URLView.prototype.getLongitude = function() {
		return this._lon;
	};
	
	/**
	 * @return The zoom
	 */
	URLView.prototype.getZoom = function() {
		return this._zoom;
	};
	
	/**
	 * @return The level
	 */
	URLView.prototype.getLevel = function() {
		return this._level;
	};

//OTHER METHODS
	/**
	 * Updates the component when map moves
	 */
	URLView.prototype.mapUpdated = function() {
		//Update fields
		var map = this._mainView.getMapView().get();
		this._zoom = map.getZoom();
		this._lat = map.getCenter().lat;
		this._lon = map.getCenter().lng;
		this._tiles = this._mainView.getMapView().getTileLayer();
		
		//Update DOM
		this._updateUrl();
		this._setShortlink();
	};
	
	/**
	 * Updates the component when options change
	 */
	URLView.prototype.optionsChanged = function() {
		//Update DOM
		this._updateUrl();
		this._setShortlink();
	};
	
	/**
	 * Updates the component when level changes
	 */
	URLView.prototype.levelChanged = function() {
		this._level = this._mainView.getLevelView().get();
		
		//Update DOM
		this._updateUrl();
		this._setShortlink();
	};
	
	/**
	 * Updates the component when tile layer changes
	 */
	URLView.prototype.tilesChanged = function() {
		this._tiles = this._mainView.getMapView().getTileLayer();
		
		//Update DOM
		this._updateUrl();
		this._setShortlink();
	};
	
	/**
	 * @return The page base URL
	 */
	URLView.prototype._getUrl = function() {
		return $(location).attr('href').split('?')[0];
	};
	
	/**
	 * @return The URL hash
	 */
	URLView.prototype._getUrlHash = function() {
		var hash = $(location).attr('href').split('#')[1];
		return (hash != undefined) ? hash : "";
	};
	
	/**
	 * Reads the browser URL and updates this object fields
	 */
	URLView.prototype._readUrl = function() {
		var parameters = this._getParameters();
		var optionsView = this._mainView.getOptionsView();
		
		//Read shortlink
		var short = parameters.s;
		if(short != undefined) {
			var regex = /^(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)\+([A-Z])([a-zA-Z0-9]+)\+(?:(-?)([a-zA-Z0-9]+)\.([a-zA-Z0-9]+))?(?:\+([a-zA-Z0-9]+))?$/;
			if(regex.test(short)) {
				var shortRes = regex.exec(short);
				this._lat = base62toDec(shortRes[2]) + base62toDec(shortRes[3]) / 100000;
				if(shortRes[1] == "-") { this._lat = -this._lat; }
				
				this._lon = base62toDec(shortRes[5]) + base62toDec(shortRes[6]) / 100000;
				if(shortRes[4] == "-") { this._lon = -this._lon; }
				
				this._zoom = letterToInt(shortRes[7]);
				
				var options = intToBitArray(base62toDec(shortRes[8]));
				while(options.length < 6) { options = "0" + options; }
				optionsView.setUnrendered(options[options.length - 1] == 1);
				//optionsView.setLegacy(options[options.length - 2] == 1); //Deprecated option
				optionsView.setTranscendent(options[options.length - 3] == 1);
				optionsView.setBuildingsOnly(options[options.length - 4] == 1);
				optionsView.setPhotos(options[options.length - 5] == 1);
				optionsView.setNotes(options[options.length - 6] == 1);
				
				//Get level if available
				if(shortRes[10] != undefined && shortRes[11] != undefined) {
					this._level = base62toDec(shortRes[10]) + base62toDec(shortRes[11]) / 100;
					if(shortRes[9] == "-") { this._level = -this._level; }
				}
				
				//Get tiles if available
				if(shortRes[12] != undefined) {
					this._tiles = base62toDec(shortRes[12]);
				}
			}
			else {
				this._mainView.getMessagesView().displayMessage("Invalid short link", "alert");
			}
		}
		//Read parameters directly
		else {
			this._bbox = parameters.bbox;
			this._lat = parameters.lat;
			this._lon = parameters.lon;
			this._zoom = parameters.zoom;
			if(parameters.transcend != undefined) { optionsView.setTranscendent(parameters.transcend == "1"); }
			if(parameters.unrendered != undefined) { optionsView.setUnrendered(parameters.unrendered == "1"); }
			if(parameters.buildings != undefined) { optionsView.setBuildingsOnly(parameters.buildings == "1"); }
			if(parameters.photos != undefined) { optionsView.setPhotos(parameters.photos == "1"); }
			if(parameters.notes != undefined) { optionsView.setNotes(parameters.notes == "1"); }
			this._level = parameters.level;
			this._tiles = parameters.tiles;
		}
	};
	
	URLView.prototype._updateUrl = function() {
		var optionsView = this._mainView.getOptionsView();
		var params = "lat="+this._lat+"&lon="+this._lon+"&zoom="+this._zoom+"&tiles="+this._tiles;
		
		if(this._zoom >= CONFIG.view.map.data_min_zoom) {
			if(this._level != null) {
				params += "&level="+this._level;
			}
			
			params += "&transcend="+((optionsView.showTranscendent()) ? "1" : "0");
			params += "&unrendered="+((optionsView.showUnrendered()) ? "1" : "0");
			params += "&buildings="+((optionsView.showBuildingsOnly()) ? "1" : "0");
			params += "&photos="+((optionsView.showPhotos()) ? "1" : "0");
			params += "&notes="+((optionsView.showNotes()) ? "1" : "0");
		}
		
		var hash = this._getUrlHash();
		var link = this._getUrl() + "?" + params + ((hash != "") ? '#' + hash : "");
		
		$("#permalink").attr('href', link);
		
		//Update browser URL
		window.history.replaceState({}, "OpenLevelUp!", link);
		
		//Update OSM link
		$("#osm-link").attr('href', "http://openstreetmap.org/#map="+this._zoom+"/"+this._lat+"/"+this._lon);
	};
	
	/**
	 * Updates short links
	 * Format: lat+lon+zoomoptions+level+tiles
	 * Lat and lon are the latitude and longitude, encoded in base 62
	 * Zoom is the map zoom encoded as a letter (A=1, Z=26)
	 * Options are a bit array, encoded as base 62
	 * Example: 10.AQ3+-2j.64S+E6+F+2
	 */
	URLView.prototype._setShortlink = function() {
		var optionsView = this._mainView.getOptionsView();
		var shortLat = ((this._lat < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(this._lat))) + "." + decToBase62((Math.abs((this._lat % 1).toFixed(5)) * 100000).toFixed(0)); //Latitude
		var shortLon = ((this._lon < 0) ? "-" : "") + decToBase62(Math.floor(Math.abs(this._lon))) + "." + decToBase62((Math.abs((this._lon % 1).toFixed(5)) * 100000).toFixed(0)); //Longitude
		var shortZoom = intToLetter(this._zoom); //Zoom
		var shortTiles = decToBase62(this._tiles);
		
		//Level
		var shortLvl = "";
		if(this._level != null) {
			if(this._level < 0) {
				shortLvl += "-";
			}
			
			shortLvl += decToBase62(Math.floor(Math.abs(this._level)));
			shortLvl += ".";
			shortLvl += decToBase62((Math.abs((this._level % 1).toFixed(2)) * 100).toFixed(0));
		}
		
		var shortOptions = bitArrayToBase62([
					((optionsView.showNotes()) ? "1" : "0"),
					((optionsView.showPhotos()) ? "1" : "0"),
					((optionsView.showBuildingsOnly()) ? "1" : "0"),
					((optionsView.showTranscendent()) ? "1" : "0"),
					"1", //((optionsView.showLegacy()) ? "1" : "0"),
					((optionsView.showUnrendered()) ? "1" : "0")
				]);
		
		//Update link
		$("#shortlink").attr('href', this._getUrl() + "?s=" + shortLat+"+"+shortLon+"+"+shortZoom+shortOptions+"+"+shortLvl+"+"+shortTiles);
	}
	
	/**
	 * Get URL parameters
	 * @return The parameters
	 */
	URLView.prototype._getParameters = function() {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		var params = new Object();
		
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			params[sParameterName[0]] = sParameterName[1];
		}
		
		return params;
	};



/**
 * The room names component
 */
var NamesView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;

//CONSTRUCTOR
	$("#search-room").click(this.searchFocus.bind(this));
	$("#search-room").focus(this.searchFocus.bind(this));
	$("#search-room").focusout(this.searchFocus.bind(this));
	$("#search-room").bind("input propertychange", this.update.bind(this));
	$("#search-room-reset").click(this.reset.bind(this));
	$("#search-room").val("Search");
};

//OTHER METHODS
	/**
	 * Shows the export button
	 */
	NamesView.prototype.showButton = function() {
		$("#sidebar-tab-roomlist").removeClass("disabled");
	};
	
	/**
	 * Hides the export button
	 */
	NamesView.prototype.hideButton = function() {
		$("#sidebar-tab-roomlist").addClass("disabled");
		this._mainView.hideCentralPanel();
	};
	
	/**
	 * Updates the names list
	 */
	NamesView.prototype.update = function() {
		if(this._mainView.getData() != null) {
			var filter = (this.searchOK()) ? $("#search-room").val() : null;
			var roomNames = this._mainView.getData().getNames();
			
			//Filter room names
			var roomNamesFiltered = null;
			
			if(roomNames != null) {
				roomNamesFiltered = new Object();
				
				for(var lvl in roomNames) {
					roomNamesFiltered[lvl] = new Object();
					
					for(var room in roomNames[lvl]) {
						var ftGeomRoom = roomNames[lvl][room].getGeometry();
						
						if((filter == null || contains(room.toLowerCase(), filter.toLowerCase()))
							&& (roomNames[lvl][room].getStyle().get().popup == undefined
							|| roomNames[lvl][room].getStyle().get().popup == "yes")
							&& this._mainView.getData().getBBox().intersects(ftGeomRoom.getBounds())) {

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
				//$("#rooms").empty();
				
				var levelsKeys = Object.keys(roomNamesFiltered);
				levelsKeys.sort(function (a,b) { return parseFloat(a)-parseFloat(b);});
				
				var roomHtml = '';
				
				for(var i=0; i < levelsKeys.length; i++) {
					var lvl = levelsKeys[i];

					//Create new level row
					roomHtml += '<div class="lvl-row" id="lvl'+lvl+'"><div class="lvl-name">'+lvl+'</div><div class="lvl-rooms" id="lvl'+lvl+'-rooms"><ul>';

					//Add each room
					for(var room in roomNamesFiltered[lvl]) {
						roomHtml += '<li class="ref"><a href="#" onclick="controller.getView().getMapView().goTo(\''+roomNamesFiltered[lvl][room].getId()+'\',\''+lvl+'\')">';
						
						if(STYLE != undefined) {
							roomHtml += '<img src="'+CONFIG.view.icons.folder+'/'+((contains(STYLE.images, roomNamesFiltered[lvl][room].getStyle().getIconUrl())) ? roomNamesFiltered[lvl][room].getStyle().getIconUrl() : 'icon_default.png')+'" width="'+CONFIG.view.icons.size+'px"> '+room;
						}
						
						roomHtml += '</a></li>';
					}
					
					roomHtml += '</ul></div></div>';
				}
				
				$("#rooms").html(roomHtml);
			}
		}
	};
	
	/**
	 * Resets the room names list
	 */
	NamesView.prototype.reset = function() {
		$("#search-room").val("Search");
		this.update();
	};
	
	/**
	 * @return True if the searched string for filtering names is long enough
	 */
	NamesView.prototype.searchOK = function() {
		var search = $("#search-room").val();
		return !this._mainView.isMobile() && search != "Search" && search.length >= 3;
	};
	
	/**
	 * When search room input is changed
	 */
	NamesView.prototype.searchFocus = function() {
		var search = $("#search-room").val();
		if(search == "Search" && $("#search-room").is(":focus")) {
			$("#search-room").val("");
		}
		else if(search == "" && !$("#search-room").is(":focus")) {
			$("#search-room").val("Search");
		}
	};



/**
 * The images overlay panel component
 */
var ImagesView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;
	
	/** The currently shown spherical image **/
	this._currentSpherical = -1;
	
	/** The available spherical images **/
	this._sphericalImages = null;
	
	/*
	 * Sphere related attributes
	 */
	this._camera = null;
	this._scene = null;
	this._renderer = null;
	this._container= null;
	this._isUserInteracting = null;
	this._onMouseDownMouseX = null;
	this._onMouseDownMouseY = null;
	this._lon = null;
	this._onMouseDownLon = null;
	this._lat = null;
	this._onMouseDownLat = null;
	this._phi = null;
	this._theta = null;
	this._firstClick = null;
	this._mesh = null;
	
//CONSTRUCTOR
	//$("#op-images").hide();
	$("#images-close").click(function() {
		$("#op-images").removeClass("show");
		$("#op-images").addClass("hide");
	});
	$("#tab-imgs-a").click(function() { controller.getView().getImagesView().changeTab("tab-imgs"); });
	$("#tab-spheric-a").click(function() { controller.getView().getImagesView().changeTab("tab-spheric"); });
	$("#spherical-nav-left").click(function() { controller.getView().getImagesView().previousSpherical(); });
	$("#spherical-nav-right").click(function() { controller.getView().getImagesView().nextSpherical(); });
};

//OTHER METHODS
	/**
	 * Opens and set images for the given feature
	 * @param ftId The feature ID
	 */
	ImagesView.prototype.open = function(ftId) {
		//Retrieve feature
		var ft = this._mainView.getData().getFeature(ftId);
		var ftImgs = ft.getImages();
		var images = ftImgs.get();
		this._sphericalImages = ftImgs.getSpherical();
		
		//Create images list
		var imagesData = [];
		for(var i=0; i < images.length; i++) {
			var img = images[i];

			imagesData.push({
				image: img.url,
				link: img.url,
				title: img.source,
				description: this._getLegend(img)
			});
		}
		
		/*
		 * Set images tab
		 */
		var hasCommon = imagesData.length > 0;
		var hasSpherical = this._sphericalImages.length > 0 && this._mainView.hasWebGL() && !this._mainView.isMobile();
		
		//Common images
		if(hasCommon) {
			//Load base images
			$("#tab-imgs-a").show();
			Galleria.run('.galleria', { dataSource: imagesData, popupLinks: true, _toggleInfo: false });
		}
		else {
			$("#tab-imgs-a").hide();
		}
		
		//Spherical images
		if(hasSpherical) {
			this._currentSpherical = 0;
			$("#tab-spheric-a").show();
			var sceneInit = this._scene == null;
			if(sceneInit) {
				this._initSphere();
			}
			this._loadSphere();
			if(sceneInit) {
				this._animateSphere();
			}
			
			//Other settings
			this._renderer.setSize(this._getSphereWidth(), this._getSphereHeight());
			
			//Navigation buttons
			if(this._sphericalImages.length > 1) {
				$("#spherical-nav").show();
			}
			else {
				$("#spherical-nav").hide();
			}
		}
		else {
			this._currentSpherical = -1;
			$("#tab-spheric-a").hide();
		}
		
		//Open panel
		if(hasCommon) {
			this.changeTab("tab-imgs");
		}
		else if(hasSpherical) {
			this.changeTab("tab-spheric");
		}
		
		//Update images status
		var status = ftImgs.getStatus();
		this.updateStatus("web", status.web, ft.getTag("image"));
		this.updateStatus("mapillary", status.mapillary, ft.getTag("mapillary"));
		this.updateStatus("flickr", status.flickr);
		
		$("#op-images").removeClass("hide");
		$("#op-images").addClass("show");
	};
	
 	/**
 	 * Changes the currently opened tab in images popup
 	 * @param tab The tab name
 	 */
 	ImagesView.prototype.changeTab = function(tab) {
		$("#op-images-tabs-links a").removeClass("selected");
 		$("#"+tab+"-a").addClass("selected");
		$(".op-images-tab").hide();
 		$("#"+tab).show();
 	};
	
	/**
	 * Changes the status for a given source
	 * @param source The image source (mapillary, flickr, web)
	 * @param status The image status (ok, missing, bad, unknown)
	 * @param baselink The image link (optional)
	 */
	ImagesView.prototype.updateStatus = function(source, status, baselink) {
		var link = $("#status-"+source);
		var element = $("#status-"+source+" span");
		
		element.removeClass("ok missing bad");
		if(status != "unknown") {
			element.addClass(status);
		}
		
		//Update title
		var title;
		switch(status) {
			case "ok":
				title = "The image link is valid";
				break;
			case "missing":
				title = "No image link defined";
				break;
			case "bad":
				title = "The image link is broken";
				if(source == "mapillary") {
					title += " (Check mapillary:* tags)";
				}
				else if(source == "web") {
					title += " (URL: "+baselink+")";
				}
				break;
			case "unknown":
				title = "The image is still potentially loading";
				break;
		}
		link.prop("title", title);
	};
	
	/**
	 * @param img The image details
	 * @return The description
	 */
	ImagesView.prototype._getLegend = function(img) {
		var description = "";
		
		if(img.author != undefined) { description += img.author }
		if(img.date != undefined && img.date > 0) {
			if(description != "") { description += ", "; }
			description += new Date(img.date).toLocaleString();
		}
		if(img.page != undefined) {
			if(description != "") { description += " - "; }
			description += '<a href="'+img.page+'" target="_blank">Page</a>';
		}
		description += "<br />"+img.tag;
		
		return description;
	};
	
	/*
	 * Sphere related methods
	 */
	
	ImagesView.prototype._getSphereWidth = function() {
		var w = $("#op-images > div").width();
		return (w > 0) ? w : CONFIG.view.images.spherical.width;
	};
	
	ImagesView.prototype._getSphereHeight = function() {
		var h = window.innerHeight * 0.8;
		h = (h > 800) ? 700 : h - 100;
		return (h > 0) ? h : CONFIG.view.images.spherical.height;
	};
	
	/**
	 * Changes the spherical to the previous one (if any)
	 */
	ImagesView.prototype.previousSpherical = function() {
		if(this._sphericalImages.length > 1) {
			if(this._currentSpherical > 0) {
				this._currentSpherical--;
			}
			else {
				this._currentSpherical = this._sphericalImages.length -1;
			}
			this._loadSphere();
		}
	};
	
	/**
	 * Changes the spherical to the previous one (if any)
	 */
	ImagesView.prototype.nextSpherical = function() {
		if(this._sphericalImages.length > 1) {
			if(this._currentSpherical < this._sphericalImages.length -1) {
				this._currentSpherical++;
			}
			else {
				this._currentSpherical = 0;
			}
			this._loadSphere();
		}
	};
	
	/**
	 * Initializes the ThreeJS sphere
	 */
	ImagesView.prototype._initSphere = function() {
		$("#spherical-content canvas").remove();
		this._container = document.getElementById("spherical-content");
		
		//Scene
		this._scene = new THREE.Scene();
		
		//Renderer
		this._renderer = new THREE.WebGLRenderer({ antialias: true });
		this._renderer.setPixelRatio( window.devicePixelRatio );
		this._container.appendChild(this._renderer.domElement);
		
		//Events
		document.addEventListener('mousedown', this._onDocumentMouseDown.bind(this), false);
		document.addEventListener('mousemove', this._onDocumentMouseMove.bind(this), false);
		document.addEventListener('mouseup', this._onDocumentMouseUp.bind(this), false);
		document.addEventListener('mousewheel', this._onDocumentMouseWheel.bind(this), false);
		document.addEventListener('DOMMouseScroll', this._onDocumentMouseWheel.bind(this), false);
		document.addEventListener('dragover', function ( event ) {
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		}.bind(this), false );
		document.addEventListener( 'dragenter', function ( event ) {
			document.body.style.opacity = 0.5;
		}.bind(this), false );
		document.addEventListener( 'dragleave', function ( event ) {
			document.body.style.opacity = 1;
		}.bind(this), false );
		window.addEventListener( 'resize', this._onWindowResize.bind(this), false );
	};
	
	/**
	 * Loads the ThreeJS sphere with current spherical image
	 */
	ImagesView.prototype._loadSphere = function() {
		var sphericalImg = this._sphericalImages[this._currentSpherical];
		$("#spherical-legend-title").html(sphericalImg.source);
		$("#spherical-legend-text").html(this._getLegend(sphericalImg));
		$("#spherical-counter span").html((this._currentSpherical+1)+' / '+this._sphericalImages.length);
		
		//Init vars
		this._isUserInteracting = false;
		this._onMouseDownMouseX = 0;
		this._onMouseDownMouseY = 0;
		this._onMouseDownLon = 0;
		this._lat = 0;
		this._onMouseDownLat = 0;
		this._phi = 0;
		this._theta = 0;
		this._firstClick = true;
		
		//Set initial direction
		this._lon = (sphericalImg.relativeDirection != undefined) ? sphericalImg.relativeDirection - 180 : sphericalImg.angle;
		
		//Camera
		this._camera = new THREE.PerspectiveCamera(75, this._getSphereWidth() / this._getSphereHeight(), 1, 1000);
		this._camera.target = new THREE.Vector3( 0, 0, 0 );
		
		//Sphere
		if(this._mesh != null) {
			this._scene.remove(this._mesh);
		}
		var geometry = new THREE.SphereGeometry(100, 30, 30);
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		THREE.ImageUtils.crossOrigin = "anonymous";
		var texture = THREE.ImageUtils.loadTexture(sphericalImg.url);
		texture.anisotropy = this._renderer.getMaxAnisotropy();
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearMipMapLinearFilter;
		var material = new THREE.MeshBasicMaterial({
			map: texture,
			side: THREE.FrontSide
		});
		this._mesh = new THREE.Mesh( geometry, material );
		this._mesh.rotation.y = Math.PI - THREE.Math.degToRad(sphericalImg.angle); //Pointing to north
		this._scene.add( this._mesh );
		
		//Events
		document.addEventListener( 'drop', function ( event ) {
			event.preventDefault();
			var reader = new FileReader();
			reader.addEventListener( 'load', function ( event ) {
				material.map.image.src = event.target.result;
				material.map.needsUpdate = true;
			}, false );
			reader.readAsDataURL( event.dataTransfer.files[ 0 ] );
			document.body.style.opacity = 1;
		}.bind(this), false );
	};
	
	ImagesView.prototype._onWindowResize = function() {
		var aspect = this._getSphereWidth() / this._getSphereHeight(); //this._container.clientWidth / this._container.clientHeight;
		if(!isNaN(aspect) && aspect > 0) {
			this._camera.aspect = aspect;
			this._camera.updateProjectionMatrix();
			this._renderer.setSize(this._getSphereWidth(), this._getSphereHeight());
		}
	};

	ImagesView.prototype._onDocumentMouseDown = function( event ) {
		event.preventDefault();
		if($('#spherical-content canvas:hover').length != 0) {
			this._isUserInteracting = true;
			onPointerDownPointerX = event.clientX;
			onPointerDownPointerY = event.clientY;
			onPointerDownLon = this._lon;
			onPointerDownLat = this._lat;
		}
	};

	ImagesView.prototype._onDocumentMouseMove = function( event ) {
		if ( this._isUserInteracting === true ) {
			this._lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
			this._lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
		}
	};

	ImagesView.prototype._onDocumentMouseUp = function( event ) {
		this._isUserInteracting = false;
		if($('#spherical-content canvas:hover').length != 0) {
			this._firstClick = false;
		}
	};

	ImagesView.prototype._onDocumentMouseWheel = function( event ) {
		var prevFov = this._camera.fov;
		// WebKit
		if ( event.wheelDeltaY ) {
			this._camera.fov -= event.wheelDeltaY * 0.05;
		// Opera / Explorer 9
		} else if ( event.wheelDelta ) {
			this._camera.fov -= event.wheelDelta * 0.05;
		// Firefox
		} else if ( event.detail ) {
			this._camera.fov += event.detail * 1.0;
		}
		
		//Limit wheel action
		if(this._camera.fov < 40 || this._camera.fov > 100) {
			this._camera.fov = prevFov;
		}
		this._camera.updateProjectionMatrix();
	};

	ImagesView.prototype._animateSphere = function() {
		requestAnimationFrame( this._animateSphere.bind(this) );
		this._update();
	};

	ImagesView.prototype._update = function() {
		if (this._firstClick && this._isUserInteracting === false) {
			this._lon += 0.1;
		}
		this._lat = Math.max( - 85, Math.min( 85, this._lat ) );
		this._phi = THREE.Math.degToRad( 90 - this._lat );
		this._theta = THREE.Math.degToRad( this._lon );
		this._camera.target.x = 500 * Math.sin( this._phi ) * Math.cos( this._theta );
		this._camera.target.y = 500 * Math.cos( this._phi );
		this._camera.target.z = 500 * Math.sin( this._phi ) * Math.sin( this._theta );
		this._camera.lookAt( this._camera.target );
		
		//var angle = Math.round(THREE.Math.radToDeg(this._theta) % 360);
		//if(angle < 0) { angle += 360; }
		//$("#spherical-direction").html(angle+"°");
		
		this._renderer.render( this._scene, this._camera );
	};



/**
 * The loading overlay panel component
 */
var LoadingView = function() {
//ATTRIBUTES
	/** Is loading ? **/
	this._loading = false;
	
	/** The last timestamp **/
	this._lastTime = 0;
};
	
//ACCESSORS
	/**
	 * @return True if loading
	 */
	LoadingView.prototype.isLoading = function() {
		return this._loading;
	};
	
//OTHER METHODS
	/**
	 * Shows or hides the loading component
	 * @param loading True if the application is loading something
	 */
	LoadingView.prototype.setLoading = function(loading) {
		this._loading = loading;
		if(loading) {
			$("#op-loading-info li").remove();
			$("#op-loading").removeClass("hide");
			$("#op-loading").addClass("show");
			this._lastTime = (new Date()).getTime();
		}
		else {
			$("#op-loading").removeClass("show");
			$("#op-loading").addClass("hide");
			$(document).trigger("loading_done");
		}
	};
	
	/**
	 * Adds an information about the loading progress
	 * @param info The loading information to add
	 */
	LoadingView.prototype.addLoadingInfo = function(info) {
		//Timestamp
		var currentTime = (new Date()).getTime();
		$("#op-loading-info li:last").append(' <small>'+(currentTime-this._lastTime)+' ms</small>');
		
		//Add a new child in list, corresponding to the given message
		var newLi = document.createElement("li");
		$("#op-loading-info").append(newLi);
		
		//Add text to the added child
		$("#op-loading-info li:last-child").html(info);
		
		this._lastTime = currentTime;
	};



/**
 * The about view
 */
var AboutView = function() {
//CONSTRUCTOR
	//$("#op-about").hide();
	$("#about-link").click(function() {
		$("#op-about").toggleClass("hide show");
	});
	$("#about-close").click(function() {
		$("#op-about").removeClass("show");
		$("#op-about").addClass("hide");
	});
}



/**
 * The messages stack component
 */
var MessagesView = function() {
//ATTRIBUTES
	/** The amount of currently shown messages **/
	this._nbMessages = 0;
};

//ACCESSORS
	/**
	 * @return The amount of currently shown messages
	 */
	MessagesView.prototype.getNbMessages = function() {
		return this._nbMessages;
	};
	
//MODIFIERS
	/**
	 * Decreases the amount of currently shown messages
	 */
	MessagesView.prototype.decreaseNbMessages = function() {
		this._nbMessages--;
	};
	
//OTHER METHODS
	/**
	 * Displays a message in the console and in a specific area of the page.
	 * @param msg The string to display
	 * @param type The kind of message (info, alert, error)
	 */
	MessagesView.prototype.displayMessage = function(msg, type) {
		//Add a new child in list, corresponding to the given message
		var line = '<li class="'+type+'">'+msg+'</li>';
		
		if(this._nbMessages == 0) {
			$("#infobox").show();
			$("#infobox-list").append(line);
		}
		else {
			$("#infobox-list li:first-child").before(line);
		}
		
		this._nbMessages++;
		
		//Remove that child after a delay
		setTimeout(function() {
			$("#infobox-list li").last().remove();
			this.decreaseNbMessages();
			if(this.getNbMessages() == 0) {
				$("#infobox").hide();
			}
		}.bind(this), 5000);
	};
	
	/**
	 * Clears all messages.
	 */
	MessagesView.prototype.clear = function() {
		$("#infobox-list li").remove();
		this._nbMessages = 0;
	};



/**
 * The notes overlay panel
 */
var NotesView = function(main) {
//ATTRIBUTES
	this._mainView = main;

//CONSTRUCTOR
	$("#sidebar-tab-notes").click(this.editNote.bind(this));
	$("#notes-close").click(function() {
		$("#op-notes").removeClass("show");
		$("#op-notes").addClass("hide");
	});
	$("#note-send").click(controller.newNote.bind(controller));
};

//ACCESSORS
	/**
	 * @return The notes textarea content
	 */
	NotesView.prototype.getNewNoteText = function() {
		return $("#note-txt").val();
	};
	
//MODIFIERS
	/**
	 * Shows the export button
	 */
	NotesView.prototype.showButton = function() {
		$("#sidebar-tab-notes").removeClass("disabled");
	};
	
	/**
	 * Hides the export button
	 */
	NotesView.prototype.hideButton = function() {
		$("#sidebar-tab-notes").addClass("disabled");
		this._mainView.hideCentralPanel();
		this._mainView.getMapView().hideDraggableMarker();
	};
	
	/**
	 * Shows a given note in panel
	 * @param e The leaflet event
	 */
	NotesView.prototype.show = function(e) {
		var note = this._mainView.getNotesData()[e.target.options.id];
		
		if(note != undefined) {
			//Change title
			$("#op-notes h2").html("Note #"+note.id);
			$("#notes-status-txt").html(note.status);
			$("#notes-status-icon").removeClass("ok bad").addClass((note.status == "closed") ? "ok" : "bad");
			$("#notes-link").attr("href", "http://www.openstreetmap.org/note/"+note.id);
			
			//Add comments
			var commentsHtml = "", comment, user;
			for(var i=0, l=note.comments.length; i < l; i++) {
				comment = note.comments[i];
				user = (comment.user != "") ? "User "+comment.user : "Anonymous";
				commentsHtml += '<div class="op-notes-comment">'
								+'<p class="desc">'+user+', '+comment.date+'</p>'
								+'<p class="txt">'+comment.text+'</p>'
								+'</div>';
			}
			
			$("#op-notes-comments").html(commentsHtml);
			$("#op-notes").addClass("show");
		}
		else {
			console.error("[Notes] Invalid ID: "+e.target.options.id);
		}
	};

//OTHER METHODS
	/**
	 * Starts or stops to edit a new note
	 */
	NotesView.prototype.editNote = function() {
		if(!$("#notes").hasClass("active")) {
			var dataZoom = this._mainView.getMapView().get().getZoom() >= CONFIG.view.map.data_min_zoom;
			if(dataZoom) {
				this._mainView.showCentralPanel("note-add");
				this._mainView.getMapView().showDraggableMarker();
				$("#note-txt").val("Level "+this._mainView.getLevelView().get()+": ");
			}
			else {
				this._mainView.getMessagesView().displayMessage("You have to zoom in to add a note", "alert");
			}
		}
		else {
			this._mainView.hideCentralPanel();
			this._mainView.getMapView().hideDraggableMarker();
		}
	};

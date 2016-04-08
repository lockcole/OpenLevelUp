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
 * Controller JS class
 */

/***********************
 * Configuration files *
 ***********************/

//Global conf (cache enabled)
$.ajaxSetup({ cache: true });

//Load config file
var CONFIG;
$.ajax({
	url: 'config.json',
       async: false,
       dataType: 'json',
       success: function(data) { CONFIG = data; }
}).fail(function() { console.error("[Controller] Error while retrieving CONFIG"); });

//Load JSON style file
var STYLE;
$.ajax({
	url: 'style.json',
       async: false,
       dataType: 'json',
       success: function(data) { STYLE = data; }
}).fail(function() { console.error("[Controller] Error while retrieving STYLE"); });

//Load PolygonFeatures file
var POLYGON_FEATURES;
$.ajax({
	url: 'polygon_features.json',
       async: false,
       dataType: 'json',
       success: function(data) { POLYGON_FEATURES = data; }
}).fail(function() { console.error("[Controller] Error while retrieving POLYGON_FEATURES"); });

//Load lang file
var LANG;
$.ajax({
	url: 'lang.json',
       async: false,
       dataType: 'json',
       success: function(data) { LANG = data; }
}).fail(function() { console.error("[Controller] Error while retrieving LANG"); });

addCompatibility();


/***********
 * Classes *
 ***********/

/**
 * Application controller (as defined in MVC pattern).
 * Updates view and model depending of user actions in view.
 */
var Ctrl = function() {
//ATTRIBUTES
	/** The data container **/
	this._data = null;
	
	/** The cluster data container **/
	this._clusterData = null;
	
	/** The mapillary data **/
	this._mapillaryData = new MapillaryData();
	
	/** The OSM notes data **/
	this._notesData = null;
	
	/** The download start time **/
	this._downloadStart = null;
	
	/** The amount of requested external metadata via Ajax **/
	this._nbExternalApiRequests = null;
	
	/** The routing graphs **/
	this._graphs = {};
	
	/** The current HTML view **/
	this._view = null;
};
	
//ACCESSORS
	/**
	 * @return The current view
	 */
	Ctrl.prototype.getView = function() {
		return this._view;
	};
	
	/**
	 * @return The current map data object
	 */
	Ctrl.prototype.getData = function() {
		return this._data;
	};
	
	/**
	 * @return The cluster data
	 */
	Ctrl.prototype.getClusterData = function() {
		return this._clusterData;
	};
	
	/**
	 * @return The mapillary data
	 */
	Ctrl.prototype.getMapillaryData = function() {
		return this._mapillaryData;
	};
	
	/**
	 * @return The OSM notes data
	 */
	Ctrl.prototype.getNotesData = function() {
		return this._notesData;
	};

//OTHER METHODS
	/**
	 * This function initializes the controller
	 */
	Ctrl.prototype.init = function() {
		this._view = new MainView(this);
		
		//Init leaflet map
 		this.onMapUpdate();
	};


/********************
 * Main view events *
 ********************/
	/**
	 * Called when level up is needed
	 */
	Ctrl.prototype.onLevelUp = function() {
		if(controller.getView().getLevelView().up()) {
			controller.getView().updateLevelChanged();
		}
	};
	
	/**
	 * Called when level down is needed
	 */
	Ctrl.prototype.onLevelDown = function() {
		if(controller.getView().getLevelView().down()) {
			controller.getView().updateLevelChanged();
		}
	};
	
	/**
	 * Called when level changes
	 */
	Ctrl.prototype.onLevelChange = function() {
		if(controller.getView().getLevelView().set()) {
			controller.getView().updateLevelChanged();
		}
	};
	
	/**
	 * Makes the map go to the given level
	 * @param lvl The new level to display
	 * @param failsafe If true, when destination level doesn't exists, goes to next level available (default: false)
	 */
	Ctrl.prototype.toLevel = function(lvl, failsafe) {
		failsafe = failsafe || false;
		try {
			if(controller.getView().getLevelView().set(lvl)) {
				controller.getView().updateLevelChanged();
			}
			else if(failsafe) {
				if(lvl < controller.getView().getLevelView().get()) {
					controller.getView().getLevelView().down();
				}
				else {
					controller.getView().getLevelView().up();
				}
				controller.getView().updateLevelChanged();
			}
		}
		catch(e) {
			controller.getView().getMessagesView().displayMessage(e.message, "error");
		}
	};
	
	/**
	 * Handles the edit of implicit level option
	 */
	Ctrl.prototype.implicitLevelChanged = function() {
		controller.onMapUpdate(true);
	};
	
	/**
	 * This function is called when user wants to export the currently shown level
	 */
	Ctrl.prototype.onExportLevel = function() {
		var level = this._view.getLevelView().get();
		
		if(
			this._view.getMapView().get().getZoom() >= CONFIG.view.map.data_min_zoom
			&& level != null
			&& this._view.getMapView()._dataLayer != null
		) {
			//Get data for given level
			var levelData = [];
			var data = this._data.getFeatures();
			for(var d in data) {
				if(data[d].isOnLevel(level)) {
					levelData.push(data[d].getGeoJSON());
				}
			}
			
			//Create GeoJSON
			var geojson = { type: "FeatureCollection", features: levelData };
			var file = new Blob(
				[JSON.stringify(geojson, null, '\t')],
				{ type: "application/json;charset=utf-8;" }
			);
			saveAs(file, "level_"+level+".geojson");
		}
		else {
			this._view.getMessagesView().displayMessage("No level available for export", "alert");
		}
	}


/*******************
 * Map view events *
 *******************/
	/**
	 * This function is called when base layer on map changes
	 */
	Ctrl.prototype.onMapLayerChange = function(e) {
		if(e.name != undefined) {
			controller.getView().getMapView().setTileLayer(e.name);
		}
	};
	
	/**
	 * This function is called when a layer was added on map
	 */
	Ctrl.prototype.onMapLayerAdd = function(e) {
		//Stop loading when cluster is added
		if(e.layer._childClusters != undefined) {
			controller.getView().getLoadingView().setLoading(false);
		}
		controller.getView().getMapView().changeTilesOpacity();
	};
	
	/**
	 * This function is called when map was moved or zoomed in/out.
	 * @param force Force data download (optional, default: false)
	 */
	Ctrl.prototype.onMapUpdate = function(force) {
		force = force || false;

		var map = this._view.getMapView().get();
		var bbox = map.getBounds();
		var zoom = map.getZoom();
		
		//Clear messages
		this._view.getMessagesView().clear();
		
		//Check if zoom is high enough to download data
		if(zoom >= CONFIG.view.map.cluster_min_zoom) {
			this._view.getLoadingView().setLoading(true);
			this._view.getLoadingView().addLoadingInfo(this._view.getTranslation("loading", "prepareupdate"));
			
			//High zoom data download
			if(zoom >= CONFIG.view.map.data_min_zoom) {
				this._oldLevel = this._view.getLevelView().get();
				
				//Download data only if new BBox isn't contained in previous one
				if(force
					|| this._data == null
					|| !this._data.isInitialized()
					|| !this._data.getBBox().contains(bbox)
				) {
					//Resize BBox for small areas (avoid multiple Overpass API calls)
					var diffZoom = zoom - CONFIG.view.map.data_min_zoom;
					bbox = bbox.pad(1.1 + 0.5 * diffZoom);
					
					//Download data
					this.downloadData("data", bbox);
					//When download is done, endMapUpdate() will be called.
				}
				//Else, we just update view
				else {
					this.endMapUpdate();
				}
			}
			//Low zoom data download (cluster)
			else {
				//Download data only if new BBox isn't contained in previous one
				if(force
					|| this._clusterData == null
					|| !this._clusterData.isInitialized()
					|| !this._clusterData.getBBox().contains(bbox)
				) {
					if(zoom > CONFIG.view.map.cluster_min_zoom) {
						//Resize BBox for small areas (avoid multiple Overpass API calls)
						var diffZoom = zoom - CONFIG.view.map.cluster_min_zoom;
						bbox = bbox.pad(1.1 + 0.5 * diffZoom);
					}
					
					//Download data
					this.downloadData("cluster", bbox);
					//When download is done, endMapClusterUpdate() will be called.
				}
				//Else, we just update view
				else {
					this.endMapClusterUpdate();
				}
			}
		}
		//Else, clean map
		else {
			this._view.updateMapMoved();
		}
	};
	
	/**
	 * This function is called after data download finishes
	 */
	Ctrl.prototype.endMapUpdate = function() {
		this._view.getLoadingView().addLoadingInfo(this._view.getTranslation("loading", "refresh"));
		this._view.updateMapMoved();
		this._view.getLoadingView().setLoading(false);
	};
	
	/**
	 * This function is called after cluster data download finishes
	 */
	Ctrl.prototype.endMapClusterUpdate = function() {
		this._view.getLoadingView().addLoadingInfo(this._view.getTranslation("loading", "refresh"));
		this._view.updateMapMoved();
		this._view.getLoadingView().setLoading(false);
	};


/*******************
 * Data management *
 *******************/
	/**
	 * Downloads data from Overpass API
	 * Then calls another function to process it.
	 * @param type The kind of request ("data" or "cluster")
	 * @param bbox The bounding box
	 */
	Ctrl.prototype.downloadData = function(type, bbox) {
		this._downloadStart = (new Date()).getTime();
		this._resetRouting();
		
		var oapiRequest = null;
		var bounds = boundsString(bbox);
		
		this._view.getLoadingView().addLoadingInfo(this._view.getTranslation("loading", "requestoapi"));
		
		//Prepare request depending of type
		if(type == "cluster") {
			oapiRequest = '[out:json][timeout:25][bbox:'+bounds+'];(way["indoor"]["indoor"!="yes"]["level"];way["buildingpart"]["level"];);out ids center;';
		}
		else {
			if(this._view.getOptionsView().showImplicitLevel()) {
				oapiRequest = '[out:json][timeout:25][bbox:'+bounds+'];(node;way;relation;);(._;>;);out body;';
			}
			else {
				oapiRequest = '[out:json][timeout:25][bbox:'+bounds+'];(node["repeat_on"];way["repeat_on"];relation["repeat_on"];node[~"^((min|max)_)?level$"~"."];way[~"^((min|max)_)?level$"~"."];relation[~"^((min|max)_)?level$"~"."];);out body;>;out qt skel;';
			}
		}

		//Download data
		$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.error("Error: "+thrownError+"\nURL: "+settings.url); });
		$.get(
			CONFIG.osm.oapi+encodeURIComponent(oapiRequest),
			function(data) {
				//console.log("[Time] Overpass download: "+((new Date()).getTime() - this._downloadStart));
				this.getView().getLoadingView().addLoadingInfo(this._view.getTranslation("loading", "processdata"));
				
				if(type == "cluster") {
					this._clusterData = new OSMClusterData(bbox, data);
					this.getView().getMapView().resetVars();
					this.endMapClusterUpdate();
				}
				else {
					this._data = new OSMData(bbox, data, this._view.getOptionsView().showImplicitLevel());
					this.getView().getMapView().resetVars();

					this.getView().getLoadingView().addLoadingInfo(this._view.getTranslation("loading", "downloadphoto"));
					this._nbExternalApiRequests = 0;
					
					//Download OSM notes
					this.downloadNotes(bbox);
					
					//Download Flickr data
					this.downloadFlickr(bbox);
					
					//Request mapillary data
					var mapillaryKeys = this._data.getMapillaryKeys();
					var mapillaryNb = mapillaryKeys.length;
					
					for(var i=0; i < mapillaryNb; i++) {
						var key = mapillaryKeys[i];
						if(!this._mapillaryData.has(key)) {
							this.requestMapillaryData(key);
						}
					}

					this.checkExternalRequestsDone();
				}
			}.bind(this),
			"json")
		.fail(controller.onDownloadFail.bind(this));
	};
	
	/**
	 * This function is called when data download fails
	 */
	Ctrl.prototype.onDownloadFail = function() {
		this.getView().getLoadingView().setLoading(false);
		this.getView().getMessagesView().displayMessage(this._view.getTranslation("error", "datadownload"), "error");
	};
	
	/**
	 * Checks if all metadata for external data have been retrieved, and if so ends map update.
	 */
	Ctrl.prototype.checkExternalRequestsDone = function(almost) {
		almost = almost || false;
		
		if(this._nbExternalApiRequests == 0) {
			if(almost) {
				this.endMapUpdate();
			}
			else {
				setTimeout(
					function() { this.checkExternalRequestsDone(true); }.bind(this),
					1000
				);
			}
		}
		else {
			setTimeout(
				this.checkExternalRequestsDone.bind(this),
				1000
			);
		}
	};

/*********************
 * Flickr management *
 *********************/
	/**
	 * Retrieves picture data from Flickr
	 * @param bbox The bounding box
	 */
	Ctrl.prototype.downloadFlickr = function(bbox) {
		var params = 'method=flickr.photos.search&api_key='+CONFIG.images.flickr.key+'&bbox='+bbox.toBBoxString()+'&machine_tags=osm:&has_geo=1&extras=machine_tags,url_c,date_taken,owner_name&format=json&nojsoncallback=1';
		var url = CONFIG.images.flickr.api+params;
		
		//Download
		this._nbExternalApiRequests++;
		$.ajax({
			url: url,
			async: true,
			dataType: 'json',
			success: this.setFlickrData.bind(this)
		}).fail(this.onFlickrDownloadFail.bind(this));
	};
	
	/**
	 * Processes the received Flickr data, and updates the model objects
	 * @param data The Flickr data, as JSON
	 */
	Ctrl.prototype.setFlickrData = function(data) {
		try {
			if(this._data.isInitialized()) {
				if(data.stat == "ok") {
					var associatedPhotos = 0;
					var osmKeyRegex = /^(osm:)(node|way|relation)$/;
					
					//Read photos
					var photoList = data.photos.photo;
					for(var i=0; i < photoList.length; i++) {
						var photo = photoList[i];
						
						//Update objects according to machine tags
						var machineTags = photo.machine_tags.split(' ');
						for(var j=0; j < machineTags.length; j++) {
							var machineTag = machineTags[j].split('=');
							var key = machineTag[0];
							var value = machineTag[1];
							
							//Check if valid key and value
							if(key.match(osmKeyRegex) && !isNaN(value)) {
								//Kind of object
								var type = key.split(':')[1];
								var ftId = type+'/'+value;
								
								//Update given object
								var feature = this._data.getFeature(ftId);
								if(feature != undefined) {
									feature.getImages().addFlickrImage(
										photo.title,
										photo.url_c,
										new Date(photo.datetaken.replace(" ", "T")).getTime(),
										photo.ownername,
										photo.owner,
										photo.id
									);
									associatedPhotos++;
								}
							}
						}
					}
					
					console.log("[Flickr] Done processing images ("+associatedPhotos+" associated)");
				}
				else {
					console.error("[Flickr] Error: received corrupted data");
					console.log(data);
				}
			}
			else {
				console.error("[Flickr] Error: map data is not initialized");
			}
		}
		catch(e) {
			console.error("[Flickr] Error during data process: "+e);
		}
		this._nbExternalApiRequests--;
	};
	
	/**
	 * This function is called when data download fails
	 */
	Ctrl.prototype.onFlickrDownloadFail = function() {
		this._nbExternalApiRequests--;
		console.error("[Flickr] An error occured");
	};

/************************
 * Mapillary management *
 ************************/
	/**
	 * Request the information for a given mapillary photo
	 * @param id The mapillary ID
	 * @param isLast Is this the last mapillary download (default: false)
	 */
	Ctrl.prototype.requestMapillaryData = function(id, isLast) {
		isLast = isLast || false;
		var params = 'im/'+id+'?client_id='+CONFIG.images.mapillary.clientId;
		var url = CONFIG.images.mapillary.api+params;
		
		//Download
		this._nbExternalApiRequests++;
		$.get(
			url,
			this.setMapillaryData.bind(this),
			'json'
		).fail(controller.onMapillaryDownloadFail.bind(this));
	};
	
	/**
	 * Processes the received Mapillary data, and updates the images data in model
	 * @param data The Flickr data, as JSON
	 */
	Ctrl.prototype.setMapillaryData = function(data) {
		try {
			if(this._data.isInitialized()) {
				if(data.key != undefined) {
					var key = data.key;
					this._mapillaryData.add(key, data);
				}
				else {
					console.error("[Mapillary] Error: received corrupted data");
					console.log(data);
				}
			}
			else {
				console.error("[Mapillary] Error: map data is not initialized");
			}
		}
		catch(e) {
			console.error("[Mapillary] Error during data process: "+e);
		}
		this._nbExternalApiRequests--;
	};
	
	/**
	 * This function is called when data download fails
	 */
	Ctrl.prototype.onMapillaryDownloadFail = function() {
		this._nbExternalApiRequests--;
		console.error("[Mapillary] An error occured");
	};

/************************
 * OSM Notes management *
 ************************/
	/**
	 * Retrieve OSM notes
	 * @param bbox The bounding box
	 */
	Ctrl.prototype.downloadNotes = function(bbox) {
		var params = 'notes?bbox='+bbox.toBBoxString();
		var url = CONFIG.osm.api+params;
		
		//Download
		this._nbExternalApiRequests++;
		$.ajax({
			url: url,
			type: 'GET',
			async: true,
			dataType: 'xml',
			success: this.setNotesData.bind(this)
		}).fail(this.onNotesDownloadFail.bind(this));
	};
	
	/**
	 * Processes the received Notes data
	 * @param data The OSM notes data, as JSON
	 */
	Ctrl.prototype.setNotesData = function(data) {
		try {
			this._notesData = new NotesData(data);
		}
		catch(e) {
			console.error("[Notes] Error during data process: "+e);
		}
		this._nbExternalApiRequests--;
	};
	
	/**
	 * This function is called when notes data download fails
	 */
	Ctrl.prototype.onNotesDownloadFail = function() {
		this._nbExternalApiRequests--;
		console.error("[Notes] An error occured");
	};

	/**
	 * Send new note to OSM
	 */
	Ctrl.prototype.newNote = function() {
		//Retrieve note data
		var text = this._view.getNotesView().getNewNoteText().trim();
		
		//Check if not empty
		var textCheck = text.split(':');
		if(text.length > 0 && (textCheck.length == 1 || textCheck[1].trim().length > 0)) {
			//Check coordinates
			var coords = this._view.getMapView().getDraggableMarkerCoords();
			
			if(coords != null) {
				//Create URL
				var url = CONFIG.osm.api+"notes?lat="+coords.lat+"&lon="+coords.lng+"&text="+text;
				
				//Send note to OSM
				$.post(
					url,
					null,
					this.newNoteSent.bind(this),
					"xml"
				).fail(this.newNoteFailed.bind(this));
			}
			else {
				this._view.getMessagesView().displayMessage(this._view.getTranslation("error", "invalidcoordsnote"), "error");
			}
		}
		else {
			this._view.getMessagesView().displayMessage(this._view.getTranslation("error", "emptynote"), "alert");
		}
	};
	
	/**
	 * Success function for note sending
	 */
	Ctrl.prototype.newNoteSent = function(data) {
		this._view.getMessagesView().displayMessage(this._view.getTranslation("error", "notesent"), "info");
		this._view.getMapView().hideDraggableMarker();
		this._view.collapseSidebar();
		
		//Add given data to NotesData
		this._notesData.parse(data);
		
		//Refresh map
		this._view.updateNoteAdded();
	};
	
	/**
	 * Fail function for note sending
	 */
	Ctrl.prototype.newNoteFailed = function() {
		this._view.getMessagesView().displayMessage(this._view.getTranslation("error", "notefail"), "error");
		this._view.getMapView().hideDraggableMarker();
		this._view.collapseSidebar();
	};

/***************************
 * Routing related methods *
 ***************************/

	/**
	 * Starts routing
	 * @param mode The routing mode (see CONFIG.routing)
	 * @param startPt The start coordinates
	 * @param startLvl The start level
	 * @param endPt The end coordinates
	 * @param endLvl The end level
	 */
	Ctrl.prototype.startRouting = function(mode, startPt, startLvl, endPt, endLvl) {
		// console.log('startRouting', mode, startPt, startLvl, endPt, endLvl);
		//Create graph if not available
		if(this._graphs[mode] == undefined) {
			this._graphs[mode] = new Graph();
			this._graphs[mode].createFromOSMData(this._data, CONFIG.routing[mode].avoid);
		}
		
		//Launch routing
		try {
			var path = this._graphs[mode].findShortestPath(startPt, startLvl, endPt, endLvl);
			// console.log('path', path);
			// path = this._graphs[mode].normalizePath(path, startPt, startLvl, endPt, endLvl);
			this.getView().getRoutingView().showRoute(path);
		}
		catch(e) {
			this.getView().getMessagesView().displayMessage(this._view.getTranslation("error", "noroute"), "alert");
			console.log(e);
			this.getView().getRoutingView().showRoute(null);
		}
	};
	
	/**
	 * Resets routing view and model
	 */
	Ctrl.prototype._resetRouting = function() {
		this._graphs = {};
		this.getView().getRoutingView().reset();
	};

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
 * Controller JS class
 */

//Global conf (cache enabled)
$.ajaxSetup({ cache: true });

//Load JSON style file
var STYLE;
$.ajax({
	url: 'style.json',
       async: false,
       dataType: 'json',
       success: function(data) { STYLE = data; }
});

//Load PolygonFeatures file
var POLYGON_FEATURES;
$.ajax({
	url: 'polygon_features.json',
       async: false,
       dataType: 'json',
       success: function(data) { POLYGON_FEATURES = data; }
});

addCompatibility();

//Application core handler
OLvlUp = function() {};

OLvlUp.controller = {
// ====== CONSTANTS ====== 
/** Overpass API server URL **/
API_URL: "http://www.overpass-api.de/api/interpreter?data=",
//API_URL: "http://api.openstreetmap.fr/oapi/interpreter?data=",
//API_URL: "http://overpass.osm.rambler.ru/cgi/interpreter?data=",

/** Flickr API URL **/
FLICKR_API_URL: "https://api.flickr.com/services/rest/?",

/** Flickr API Key **/
FLICKR_API_KEY: "d06fb1ebb3ede5813b89c79320e11ab8",

/** Mapillary API URL (with ending /) **/
MAPILLARY_API_URL: "https://a.mapillary.com/v2/",

/** Mapillary API Key **/
MAPILLARY_API_KEY: "NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzplMWU2NDQ5NDNmZjM5M2Iw",
};

// ======= CLASSES =======
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
	
	/** The download start time **/
	this._downloadStart = null;
	
	/** The amount of requested Mapillary pictures **/
	this._nbMapillaryRequests = null;
	
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

//OTHER METHODS
	/**
	 * This function initializes the controller
	 */
	Ctrl.prototype.init = function(mobile) {
		mobile = mobile || false;
		
		this._view = new MainView(this, mobile);
		
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
	 */
	Ctrl.prototype.toLevel = function(lvl) {
		try {
			if(controller.getView().getLevelView().set(lvl)) {
				controller.getView().updateLevelChanged();
			}
		}
		catch(e) {
			controller.getView().getMessagesView().displayMessage(e.message, "error");
		}
	};


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
		if(zoom >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
			this._view.getLoadingView().setLoading(true);
			this._view.getLoadingView().addLoadingInfo("Prepare update");
			
			//High zoom data download
			if(zoom >= OLvlUp.view.DATA_MIN_ZOOM) {
				this._oldLevel = this._view.getLevelView().get();
				
				//Download data only if new BBox isn't contained in previous one
				if(force
					|| this._data == null
					|| !this._data.isInitialized()
					|| !this._data.getBBox().contains(bbox)
				) {
					//Resize BBox for small areas (avoid multiple Overpass API calls)
					var diffZoom = zoom - OLvlUp.view.DATA_MIN_ZOOM;
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
					if(zoom > OLvlUp.view.CLUSTER_MIN_ZOOM) {
						//Resize BBox for small areas (avoid multiple Overpass API calls)
						var diffZoom = zoom - OLvlUp.view.CLUSTER_MIN_ZOOM;
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
		this._view.getLoadingView().addLoadingInfo("Refresh map");
		this._view.updateMapMoved();
		this._view.getLoadingView().setLoading(false);
	};
	
	/**
	 * This function is called after cluster data download finishes
	 */
	Ctrl.prototype.endMapClusterUpdate = function() {
		this._view.getLoadingView().addLoadingInfo("Refresh map");
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
		
		var oapiRequest = null;
		var bounds = boundsString(bbox);
		
		this._view.getLoadingView().addLoadingInfo("Request Overpass API");
		
		//Prepare request depending of type
		if(type == "cluster") {
			oapiRequest = '[out:json][timeout:25][bbox:'+bounds+'];(way["indoor"]["indoor"!="yes"]["level"];way["buildingpart"]["level"];);out ids center;';
		}
		else {
			oapiRequest = '[out:json][timeout:25][bbox:'+bounds+'];(node["repeat_on"];way["repeat_on"];relation["repeat_on"];node[~"^.*level$"~"."];way[~"^.*level$"~"."];relation[~"^.*level$"~"."];);out body;>;out qt skel;';
		}

		//Download data
		$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.log("Error: "+thrownError+"\nURL: "+settings.url); });
		$.get(
			OLvlUp.controller.API_URL+encodeURIComponent(oapiRequest),
			function(data) {
				console.log("[Time] Overpass download: "+((new Date()).getTime() - this._downloadStart));
				this.getView().getLoadingView().addLoadingInfo("Process received data");
				
				if(type == "cluster") {
					this._clusterData = new OSMClusterData(bbox, data);
					this.getView().getMapView().resetVars();
					this.endMapClusterUpdate();
				}
				else {
					this._data = new OSMData(bbox, data, STYLE);
					this.getView().getLoadingView().addLoadingInfo("Download photos metadata");
					
					//Download Flickr data
					this.downloadFlickr(bbox);
					
					this.getView().getMapView().resetVars();
					
					//Request mapillary data
					var mapillaryKeys = this._data.getMapillaryKeys();
					var mapillaryNb = mapillaryKeys.length;
					var anyMapillary = false;
					
					this._nbMapillaryRequests = 0;
					for(var i=0; i < mapillaryNb; i++) {
						var key = mapillaryKeys[i];
						if(!this._mapillaryData.has(key)) {
							anyMapillary = true;
							this._nbMapillaryRequests++;
							this.requestMapillaryData(key);
						}
					}

					if(!anyMapillary) {
						this.endMapUpdate();
					}
				}
			}.bind(this),
			"text")
		.fail(controller.onDownloadFail.bind(this));
	};
	
	/**
	 * This function is called when data download fails
	 */
	Ctrl.prototype.onDownloadFail = function() {
		this.getView().getLoadingView().setLoading(false);
		this.getView().getMessagesView().displayMessage("An error occured during data download", "error");
	};

/*********************
 * Flickr management *
 *********************/
	/**
	 * Retrieves picture data from Flickr
	 * @param bbox The bounding box
	 */
	Ctrl.prototype.downloadFlickr = function(bbox) {
		var params = 'method=flickr.photos.search&api_key='+OLvlUp.controller.FLICKR_API_KEY+'&bbox='+bbox.toBBoxString()+'&machine_tags=osm:&has_geo=1&extras=machine_tags,url_c,date_taken,owner_name&format=json&nojsoncallback=1';
		var url = OLvlUp.controller.FLICKR_API_URL+params;
		
		//Download
		$.ajax({
			url: url,
			async: false,
			dataType: 'json',
			success: this.setFlickrData.bind(this)
		}).fail(this.onFlickrDownloadFail);
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
										photo.ownername
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
	};
	
	/**
	 * This function is called when data download fails
	 */
	Ctrl.prototype.onFlickrDownloadFail = function() {
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
		var params = 'g/'+id+'?client_id='+OLvlUp.controller.MAPILLARY_API_KEY;
		var url = OLvlUp.controller.MAPILLARY_API_URL+params;
		
		//Download
		$.get(
			url,
			function(data) {
				this.setMapillaryData(data);
				this._nbMapillaryRequests--;
				if(this._nbMapillaryRequests == 0) {
					console.log("[Mapillary] Done processing images");
					this.endMapUpdate();
				}
			}.bind(this),
			'json'
		).fail(controller.onMapillaryDownloadFail);
	};
	
	/**
	 * Processes the received Mapillary data, and updates the images data in model
	 * @param data The Flickr data, as JSON
	 */
	Ctrl.prototype.setMapillaryData = function(data) {
		try {
			if(this._data.isInitialized()) {
				if(data.nodes.length > 0) {
					var key = data.nodes[0].key;
					this._mapillaryData.add(key, data.nodes[0]);
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
	};
	
	/**
	 * This function is called when data download fails
	 */
	Ctrl.prototype.onMapillaryDownloadFail = function() {
		console.error("[Mapillary] An error occured");
	};

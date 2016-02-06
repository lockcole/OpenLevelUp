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
 * JS controller classes and init code
 */

/***********************
 * Configuration files *
 ***********************/

//Global conf (cache enabled)
$.ajaxSetup({ cache: true });

//Load config file
var CONFIG;
$.ajax({
	url: 'o.conf.json',
       async: false,
       dataType: 'json',
       success: function(data) { CONFIG = data; }
}).fail(function() { console.error("[Configuration] Error while retrieving CONFIG"); });

//Load JSON style file
var STYLE;
$.ajax({
	url: 'o.style.json',
       async: false,
       dataType: 'json',
       success: function(data) { STYLE = data; }
}).fail(function() { console.error("[Controller] Error while retrieving STYLE"); });

//Load PolygonFeatures file
var POLYGON_FEATURES;
$.ajax({
	url: 'o.polygons.json',
       async: false,
       dataType: 'json',
       success: function(data) { POLYGON_FEATURES = data; }
}).fail(function() { console.error("[Controller] Error while retrieving POLYGON_FEATURES"); });

//Load lang file
var LANG;
$.ajax({
	url: 'o.lang.json',
       async: false,
       dataType: 'json',
       success: function(data) { LANG = data; }
}).fail(function() { console.error("[Controller] Error while retrieving LANG"); });


/**************
 * Controller *
 **************/

/**
 * Controller for OpenLevelUp iframe
 */
var Ctrl = function() {
//ATTRIBUTES
	/** The URL controller **/
	this._url = new URLCtrl();
	
	/** The data controller **/
	this._data = new DataCtrl(this);
	
	/** The main view **/
	this._view = new View(this, this._url.getMode());
};
//OTHER METHODS
	/**
	 * Called when map moves
	 */
	Ctrl.prototype.onMove = function() {
		//Data zooms
		if(this._view._map.getZoom() >= CONFIG.map.data_zoom) {
			var bbox = this._view._map.getBounds();
			//Data already available ?
			if(
				this._data._osmData == null
				|| !this._data._osmData.isInitialized()
				|| !this._data._osmData.getBBox().contains(bbox)
			) {
				this._data.downloadData(bbox);
			}
		}
	};

/**
 * Controller for URL
 */
var URLCtrl = function() {
//ATTRIBUTES
	/** The iframe mode **/
	this._mode = null;
};

//ACCESSORS
	/**
	 * Get iframe mode, according to URL parameters
	 * @return basic/advanced
	 */
	URLCtrl.prototype.getMode = function() {
		if(this._mode == null) {
			var params = this._getParameters();
			this._mode = "basic";
			if(params.m != undefined && params.m == "a") {
				this._mode = "advanced";
			}
		}
		return this._mode;
	};
	
//OTHER METHODS
	/**
	 * Get URL parameters
	 * @return The parameters
	 */
	URLCtrl.prototype._getParameters = function() {
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
 * Controller for data download
 */
var DataCtrl = function(ctrl) {
//ATTRIBUTES
	/** The controller **/
	this._ctrl = ctrl;
	
	/** The amount of currently running external requests **/
	this._nbExternalApiRequests = 0;
	
	/** The OSM data **/
	this._osmData = null;
	
	/** The OSM notes data **/
	this._notesData = null;
};

//OTHER METHODS
	/**
	 * Launches data download
	 * @param bbox The bounding box to use
	 */
	DataCtrl.prototype.downloadData = function(bbox) {
		//Create request string
		var oapiRequest = '[out:json][timeout:25][bbox:'+this._oapiBbox(bbox)+'];(node["repeat_on"];way["repeat_on"];relation["repeat_on"];node[~"^((min|max)_)?level$"~"."];way[~"^((min|max)_)?level$"~"."];relation[~"^((min|max)_)?level$"~"."];);out body;>;out qt skel;';
		
		//Download data
		$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.error(thrownError+"\nURL: "+settings.url); });
		$.get(
			CONFIG.osm.oapi+encodeURIComponent(oapiRequest),
			function(data) {
				this._osmData = new OSMData(bbox, data);
				this._nbExternalApiRequests = 0;
				
				//Download OSM notes
				if(this._ctrl._url.getMode() != "basic") {
					this.downloadNotes(bbox);
				}
				
				//Download Flickr data
				/*this.downloadFlickr(bbox);
				
				//Request mapillary data
				var mapillaryKeys = this._osmData.getMapillaryKeys();
				var mapillaryNb = mapillaryKeys.length;
				
				for(var i=0; i < mapillaryNb; i++) {
					var key = mapillaryKeys[i];
					if(!this._mapillaryData.has(key)) {
						this.requestMapillaryData(key);
					}
				}*/
				
				setTimeout(
					this.checkExternalRequestsDone.bind(this),
					1000
				);
			}.bind(this),
			"json")
		.fail(this.onDownloadFail.bind(this));
	};
	
	/**
	 * This function is called when data download fails
	 */
	DataCtrl.prototype.onDownloadFail = function() {
		//TODO
		console.error("fail");
		/*this.getView().getLoadingView().setLoading(false);
		this.getView().getMessagesView().displayMessage(this._view.getTranslation("error", "datadownload"), "error");*/
	};
	
	/**
	 * Checks if all metadata for external data have been retrieved, and if so ends map update.
	 */
	DataCtrl.prototype.checkExternalRequestsDone = function() {
		if(this._nbExternalApiRequests == 0) {
			this._ctrl._view.onDataReady();
		}
		else {
			setTimeout(
				this.checkExternalRequestsDone.bind(this),
				1000
			);
		}
	};
	
	/**
	 * @return The map bounds as string for Overpass API
	 */
	DataCtrl.prototype._oapiBbox = function(bounds) {
		return normLat(bounds.getSouth())+","+normLon(bounds.getWest())+","+normLat(bounds.getNorth())+","+normLon(bounds.getEast());
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

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
 * JS classes
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
		}
	};

/**
 * Controller for URL
 */
var URLCtrl = function() {
};

//ACCESSORS
	/**
	 * Get iframe mode, according to URL parameters
	 * @return basic/advanced
	 */
	URLCtrl.prototype.getMode = function() {
		var params = this._getParameters();
		var mode = "basic";
		if(params.m != undefined && params.m == "a") {
			mode = "advanced";
		}
		return mode;
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


/*********
 * Views *
 *********/

/**
 * Main view for OpenLevelUp iframe
 * @param ctrl The controller
 * @param mode The iframe mode (basic/advanced)
 */
var View = function(ctrl, mode) {
//ATTRIBUTES
	/** The controller **/
	this._ctrl = ctrl;
	
	/** The iframe mode **/
	this._mode = mode;
	
	/** The map **/
	this._map = null;
	
	/** Delay before firing onMove event to Ctrl **/
	this._delayMove = null;

//CONSTRUCTOR
	//Init map
	this._map = L.map('map', {minZoom: 1, maxZoom: CONFIG.map.max_zoom, zoomControl: false});
	L.control.zoom({ position: "topright" }).addTo(this._map);
	
	//Add location widget
	L.control.locate({ position: "topright" }).addTo(this._map);
	
	//Add scale bar
	L.control.scale({ position: "bottomleft" }).addTo(this._map);
	
	//Set lat/lon/zoom
	var lat = CONFIG.map.lat;
	var lon = CONFIG.map.lon;
	var zoom = CONFIG.map.zoom;
	this._map.setView([lat, lon], zoom);
	
	//Create tile layers
	var tileLayers = [];
	
	for(var layerId=0; layerId < CONFIG.tiles[this._mode].length; layerId++) {
		var layer = CONFIG.tiles[this._mode][layerId];
		
		//Define tile options
		var tileOptions = {
			minZoom: layer.minZoom,
			maxZoom: layer.maxZoom,
			attribution: CONFIG.olu.attribution+" | "+CONFIG.osm.attribution+" | "+layer.attribution,
		};
		if(layer.subdomains != undefined) {
			tileOptions.subdomains = layer.subdomains;
		}
		
		//Create tile layer
		tileLayers[layer.name] = new L.TileLayer(
			layer.URL,
			tileOptions
		);
		
		//Eventually add to map
		if(layerId == 0) {
			this._map.addLayer(tileLayers[layer.name]);
		}
	}
	
	//Add tile layers widget
	if(CONFIG.tiles[this._mode].length > 1) {
		L.control.layers(tileLayers).addTo(this._map);
	}
	
	//Events
	this._map.on("mouseend zoomend", this.onMove.bind(this));
};
//OTHER METHODS
	/**
	 * Called when map moves
	 */
	View.prototype.onMove = function() {
		//Reset previous delay
		if(this._delayMove != null) {
			clearTimeout(this._delayMove);
		}
		
		this._delayMove = setTimeout(this._ctrl.onMove.bind(this._ctrl), 1500);
	};


/*********
 * Model *
 *********/


/*******************
 * Utility methods *
 *******************/

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
 * JS view classes
 */

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
	
	/** The level slider on map **/
	this._lvlSlider = null;
	
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

	/**
	 * Called when data download is done
	 */
	View.prototype.onDataReady = function() {
		//TODO
		//Get raw OSM data
		var osmData = this._ctrl._data._osmData;
		
		//Init level control
		if(this._lvlSlider != null) {
			this._map.removeControl(this._lvlSlider);
		}
		
		this._lvlSlider = L.control.levelSlider(
			function(lvl) {
				console.log("Level: "+lvl);
			},
			{
				levels: osmData.getLevels(),
				orientation: 'vertical',
				position: 'bottomright'
			}
		);
		this._lvlSlider.addTo(this._map);
	};

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

OLvlUp.controller = {
// ====== CONSTANTS ====== 
/** Overpass API server URL **/
API_URL: "http://www.overpass-api.de/api/interpreter?data=",
//API_URL: "http://api.openstreetmap.fr/oapi/interpreter?data=",
//API_URL: "http://overpass.osm.rambler.ru/cgi/interpreter?data=",

// ======= CLASSES =======
/**
 * Application controller (as defined in MVC pattern).
 * Updates view and model depending of user actions in view.
 */
Ctrl: function() {
//ATTRIBUTES
	/** The data container **/
	var _data = null;
	
	/** The cluster data container **/
	var _clusterData = null;
	
	/** The current HTML view **/
	var _view = null;
	
	/** The current object **/
	var _self = this;
	
//ACCESSORS
	/**
	 * @return The current view
	 */
	this.getView = function() {
		return _view;
	};
	
	/**
	 * @return The current map data object
	 */
	this.getData = function() {
		return _data;
	};
	
	/**
	 * @return The cluster data
	 */
	this.getClusterData = function() {
		return _clusterData;
	};

//OTHER METHODS
	/**
	 * This function initializes the controller
	 */
	this.init = function(mobile) {
		mobile = mobile || false;
		
		_view = new OLvlUp.view.MainView(_self, mobile);
		
		//Init leaflet map
 		_self.onMapUpdate();
	};


/********************
 * Main view events *
 ********************/
	/**
	 * Called when level up is needed
	 */
	this.onLevelUp = function() {
		_view.getLevelView().up();
		_view.updateLevelChanged();
	};
	
	/**
	 * Called when level down is needed
	 */
	this.onLevelDown = function() {
		_view.getLevelView().down();
		_view.updateLevelChanged();
	};
	
	/**
	 * Called when level changes
	 */
	this.onLevelChange = function() {
		_view.getLevelView().set();
		_view.updateLevelChanged();
	};
	
	/**
	 * Makes the map go to the given level
	 * @param lvl The new level to display
	 */
	this.toLevel = function(lvl) {
		try {
		_view.getLevelView().set(lvl);
		_view.updateLevelChanged();
		}
		catch(e) {
			_view.getMessagesView().displayMessage(e.message, "error");
		}
	};

	/**
	 * This function is called when user wants to export the currently shown level
	 */
// 	this.onExportLevel = function() {
// 		var level = _view.getLevelView().get();
// 		var dataGeoJSON = _view.getMapView().getDataAsGeoJSON();
// 		
// 		if(level != null && dataGeoJSON != null) {
// 			var data = new Blob(
// 				[JSON.stringify(dataGeoJSON, null, '\t')],
// 				{ type: "application/json;charset=tf-8;" }
// 			);
// 			saveAs(data, "level_"+level+".geojson");
// 		}
// 		else {
// 			_view.displayMessage("No level available for export", "alert");
// 		}
// 	};
	
	/**
	 * This function is called when user wants to export the currently shown level as an image
	 */
// 	this.onExportLevelImage = function() {
// 		$("#svg-area").empty();
// 		var level = _view.getLevelView().get();
// 		var dataGeoJSON = _view.getMapView().getDataAsGeoJSON();
// 		if(level != null && dataGeoJSON != null) {
// 			var levelExporter = new OLvlUp.controller.LevelExporter(dataGeoJSON);
// 			levelExporter.exportAsSVG(_view.getMapView().get());
// 			
// 			var data = new Blob([$("#svg-area").html()],{ type: "image/svg+xml;" });
// 			saveAs(data, "level_"+_view.getCurrentLevel()+".svg");
// 		}
// 		else {
// 			_view.getMessagesView().displayMessage("No level available for export", "alert");
// 		}
// 	};


/*******************
 * Map view events *
 *******************/
	/**
	 * This function is called when base layer on map changes
	 */
	this.onMapLayerChange = function(e) {
		if(e.name != undefined) {
			_view.getMapView().setTileLayer(e.name);
		}
	};
	
	/**
	 * This function is called when a layer was added on map
	 */
	this.onMapLayerAdd = function(e) {
		//Stop loading when cluster is added
		if(e.layer._childClusters != undefined) {
			_view.getLoadingView().setLoading(false);
		}
		_view.getMapView().changeTilesOpacity();
	};
	
	/**
	 * This function is called when map was moved or zoomed in/out.
	 * @param force Force data download (optional, default: false)
	 */
	this.onMapUpdate = function(force) {
		force = force || false;

		var map = _view.getMapView().get();
		var bbox = map.getBounds();
		
		//Clear messages
		_view.getMessagesView().clear();
		
		//Recreate mapdata if null
		if(_data == null) {
			if(_view.getMapView().get().getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
				//Resize BBox for small areas (avoid multiple Overpass API calls)
				var diffZoom = map.getZoom() - OLvlUp.view.DATA_MIN_ZOOM;
				bbox = bbox.pad(1.1 + 0.5 * diffZoom);
			}
			_data = new OLvlUp.model.OSMData(bbox, STYLE);
		}
		
		if(_clusterData == null) {
			_clusterData = new OLvlUp.model.OSMClusterData(bbox);
		}
		
		//Check if zoom is high enough to download data
		if(_view.getMapView().get().getZoom() >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
			_view.getLoadingView().setLoading(true);
			
			//High zoom data download
			if(_view.getMapView().get().getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
				_oldLevel = _view.getLevelView().get();
				
				//Download data only if new BBox isn't contained in previous one
				if(force || !_data.isInitialized() || !_data.getBBox().contains(_view.getMapView().get().getBounds())) {
					//Download data
					_self.downloadData("data", _data.init, bbox);
					//When download is done, endMapUpdate() will be called.
				}
				//Else, we just update view
				else {
					_self.endMapUpdate();
				}
			}
			//Low zoom data download (cluster)
			else {
				//Download data only if new BBox isn't contained in previous one
				if(force
					|| !_clusterData.isInitialized()
					|| !_clusterData.getBBox().contains(_view.getMapView().get().getBounds())) {

					//Download data
					_self.downloadData("cluster", _clusterData.init, bbox);
					//When download is done, endMapClusterUpdate() will be called.
				}
				//Else, we just update view
				else {
					_self.endMapClusterUpdate();
				}
			}
		}
		//Else, clean map
		else {
			_view.updateMapMoved();
		}
	};
	
	/**
	 * This function is called after data download finishes
	 */
	this.endMapUpdate = function() {
		_view.getLoadingView().addLoadingInfo("Refresh map");
		_view.updateMapMoved();
		_view.getLoadingView().setLoading(false);
	};
	
	/**
	 * This function is called after cluster data download finishes
	 */
	this.endMapClusterUpdate = function() {
		_view.getLoadingView().addLoadingInfo("Refresh map");
		_view.updateMapMoved();
		_view.getLoadingView().setLoading(false);
	};


/*******************
 * Data management *
 *******************/
	/**
	 * Downloads data from Overpass API
	 * Then calls another function to process it.
	 * @param type The kind of request ("data" or "cluster")
	 * @param handler The handler function, which will process the data
	 * @param bbox The bounding box
	 */
	this.downloadData = function(type, handler, bbox) {
		var oapiRequest = null;
		var bounds = boundsString(bbox);
		
		_view.getLoadingView().addLoadingInfo("Request Overpass API");
		
		//Prepare request depending of type
		if(type == "cluster") {
			oapiRequest = '[out:json][timeout:25];(way["indoor"]["indoor"!="yes"]["level"]('+bounds+');way["buildingpart"]["level"]('+bounds+'););out body center;';
		}
		else {
			oapiRequest = '[out:json][timeout:25];(node["door"]('+bounds+');<;>;node["entrance"]('+bounds+');<;>;node["level"]('+bounds+');way["level"]('+bounds+');relation["type"="multipolygon"]["level"]('+bounds+');node["repeat_on"]('+bounds+');way["repeat_on"]('+bounds+');way["min_level"]('+bounds+');way["max_level"]('+bounds+');relation["type"="level"]('+bounds+'));out body;>;out skel qt;';
		}

		//Download data
		$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.log("Error: "+thrownError+"\nURL: "+settings.url); });
		$.get(
			OLvlUp.controller.API_URL+encodeURIComponent(oapiRequest),
			function(data) {
				controller.getView().getLoadingView().addLoadingInfo("Process received data");
				handler(data);
				if(type == "cluster") {
					controller.endMapClusterUpdate();
				}
				else {
					controller.endMapUpdate();
				}
			},
			"text")
		.fail(controller.onDownloadFail);
	};
	
	/**
	 * This function is called when data download fails
	 */
	this.onDownloadFail = function() {
		controller.getView().getLoadingView().setLoading(false);
		controller.getView().getMessagesView().displayMessage("An error occured during data download", "error");
	};
}

};
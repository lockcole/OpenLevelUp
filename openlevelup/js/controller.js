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
//API_URL: ' http://api.openstreetmap.fr/oapi/interpreter?data=',

// ======= CLASSES =======
/**
 * Application controller (as defined in MVC pattern).
 * Updates view and model depending of user actions in view.
 */
Ctrl: function() {
//ATTRIBUTES
	/** The current MapData object **/
	var _mapdata = null;
	
	/** The current HTML view **/
	var _view = null;
	
	/** The previous level value (before a map update) **/
	var _oldLevel = null;
	
	/** Should we use level parameter from URL ? **/
	var _useLevelURL = true;
	
	/** Is the map going to somewhere (goTo() method called) ? **/
	var _isGoingTo = false;
	
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
	this.getMapData = function() {
		return _mapdata;
	};
	
	/**
	 * @return True if goTo() method just called
	 */
	this.isGoingTo = function() {
		return _isGoingTo;
	};

//MODIFIERS
	/**
	 * Called when goTo ends
	 */
	this.endGoTo = function() {
		_isGoingTo = false;
	};

//OTHER METHODS
	/**
	 * This function initializes the controller
	 */
	this.init = function() {
		_view = new OLvlUp.view.Web(_self);
		
		//Init leaflet map
		_view.mapInit();
		
		//Create mapdata object
		_mapdata = new OLvlUp.model.MapData(_self);
		
		_self.onMapUpdate();
	};
	
	/**
	 * Increases the level value
	 */
	this.levelUp = function() {
		_view.levelUp(_mapdata);
	};
	
	/**
	 * Decreases the level value
	 */
	this.levelDown = function() {
		_view.levelDown(_mapdata);
	};
	
	/**
	 * Makes the map go to the given level
	 * @param lvl The new level to display
	 */
	this.toLevel = function(lvl) {
		if(_mapdata != null && _mapdata.getLevels() != null && _mapdata.getLevels().indexOf(parseFloat(lvl)) >= 0) {
			//Change level
			_view.setCurrentLevel(lvl);
			_view.refreshMap(_mapdata);
		}
	};
	
	/**
	 * This function is called when a minor change on map happens (transcendent change, base layer change, ...)
	 */
	this.onMapChange = function(e) {
		if(e.name != undefined) {
			_view.setTileLayer(e.name);
		}
		_view.refreshMap(_mapdata);
	};
	
	/**
	 * This function is called when map should display legacy objects (or not)
	 */
	this.onMapLegacyChange = function() {
		//If in data zooms, only change shown objects
		if(_view.getMap().getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
			_view.refreshMap(_mapdata);
		}
		//If in cluster zooms, re-download data
		else if(_view.getMap().getZoom() >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
			_self.onMapUpdate(true);
		}
	};
	
	/**
	 * This function is called when a layer was added on map
	 */
	this.onLayerAdd = function(e) {
		//Stop loading when cluster is added
		if(e.layer._childClusters != undefined) {
			_view.setLoading(false);
		}
	};
	
	/**
	 * When search room input is changed
	 */
	this.onSearchRoomChange = function() {
		if(_view.getSearchRoom().length == 0 || _view.isSearchRoomLongEnough()) {
			_self.resetRoomNames();
		}
	};
	
	/**
	 * Resets the room names list
	 */
	this.resetRoomNames = function() {
		_view.resetSearchRoom();
		_view.populateRoomNames(_mapdata.getRoomNames());
	};
	
	/**
	 * This function is called when map was moved or zoomed in/out.
	 * @param force Force data download (optional, default: false)
	 */
	this.onMapUpdate = function(force) {
		force = force || false;

		//Clear messages
		_view.clearMessages();
		
		//Recreate mapdata if null
		if(_mapdata == null) {
			_mapdata = new OLvlUp.model.MapData(_self);
		}
		
		//Check if zoom is high enough to download data
		if(_view.getMap().getZoom() >= OLvlUp.view.CLUSTER_MIN_ZOOM) {
			_view.setLoading(true);
			_view.addLoadingInfo("Clear map");
			
			//High zoom data download
			if(_view.getMap().getZoom() >= OLvlUp.view.DATA_MIN_ZOOM) {
				_oldLevel = _view.getCurrentLevel();
				
				//Download data only if new BBox isn't contained in previous one
				if(force || _mapdata.getBBox() == null || !_mapdata.getBBox().contains(_view.getMap().getBounds())) {
					//Download data
					_mapdata.cleanData();
					_self.downloadData("data", _mapdata.handleOapiResponse);
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
					|| _mapdata.isClusterLegacy() != _view.showLegacy()
					|| _mapdata.getClusterBBox() == null
					|| !_mapdata.getClusterBBox().contains(_view.getMap().getBounds())) {

					//Download data
					_mapdata.cleanClusterData();
					_mapdata.setClusterLegacy(_view.showLegacy());
					_self.downloadData("cluster", _mapdata.handleOapiClusterResponse);
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
			_view.populateSelectLevels({});
			_view.populateRoomNames(null);
			_view.displayMessage("Zoom in to see more information", "info");
			_view.refreshMap(_mapdata);
		}
	};
	
	/**
	 * This function is called after data download finishes
	 */
	this.endMapUpdate = function() {
		_view.addLoadingInfo("Refresh map");
		
		if(_mapdata.getLevels() != null) {
			_view.populateSelectLevels(_mapdata.getLevels());
			_view.populateRoomNames(_mapdata.getRoomNames());
			
			//Test how many levels are available
			if(_mapdata.getLevels() != null && _mapdata.getLevels().length > 0) {
				//If we have to use the level parameter from the URL
				var levelUrl = parseFloat(_view.getUrlLevel());
				if(_useLevelURL && _mapdata.getLevels().indexOf(levelUrl) >= 0) {
					_view.setCurrentLevel(levelUrl);
				}
				_useLevelURL = false;
				
				//Restore old level if possible
				if(!_useLevelURL && _mapdata.getLevels().indexOf(_oldLevel) >=0) {
					_view.setCurrentLevel(_oldLevel);
				}
			}
			
			//Refresh leaflet map
			$(document).on("donerefresh", controller.onDoneRefresh);
			_view.refreshMap(_mapdata);
		}
		else {
			_view.setLoading(false);
		}
	};
	
	/**
	 * This function is called after cluster data download finishes
	 */
	this.endMapClusterUpdate = function() {
		_view.addLoadingInfo("Refresh map");
		
		_view.populateSelectLevels({});
		_view.populateRoomNames(null);
		
		//Update view
		$(document).on("donerefresh", controller.onDoneRefresh);
		_view.refreshMap(_mapdata);
		//_view.setLoading(false);
	};
	
	/**
	 * This function is called when user wants to export the currently shown level
	 */
	this.onExportLevel = function() {
		if(_view.getCurrentLevel() != null && _view.getDataLayer() != null) {
			var data = new Blob(
				[JSON.stringify(_view.getDataLayer().toGeoJSON(), null, '\t')],
				{ type: "application/json;charset=tf-8;" }
			);
			saveAs(data, "level_"+_view.getCurrentLevel()+".geojson");
		}
		else {
			_view.displayMessage("No level available for export", "alert");
		}
	};
	
	/**
	 * This function is called when user wants to export the currently shown level as an image
	 */
	this.onExportLevelImage = function() {
		$("#svg-area").empty();
		if(_view.getCurrentLevel() != null && _view.getDataLayer() != null) {
			var levelExporter = new OLvlUp.controller.LevelExporter(_view.getDataLayer().toGeoJSON());
			levelExporter.exportAsSVG(_view.getMap());
			
			var data = new Blob([$("#svg-area").html()],{ type: "image/svg+xml;" });
			saveAs(data, "level_"+_view.getCurrentLevel()+".svg");
		}
		else {
			_view.displayMessage("No level available for export", "alert");
		}
	};
	
	/**
	 * This function is called when map has done refreshing data
	 * @param lvl Set the level to display (can be null)
	 */
	this.onDoneRefresh = function(lvl) {
		lvl = lvl || null;
		
		if(_self.isGoingTo()) {
			_self.endGoTo();
			_self.toLevel(lvl);
		}
		else {
			_view.setLoading(false);
		}
	};
	
	/**
	 * When settings button is clicked
	 */
	this.onShowSettings = function() {
		_view.showCentralPanel("settings");
	}
	
	/**
	 * When rooms button is clicked
	 */
	this.onShowRooms = function() {
		_view.showCentralPanel("room-names");
	}
	
	/**
	 * When export button is clicked
	 */
	this.onShowExport = function() {
		_view.showCentralPanel("export");
	}
	
	/**controller.endGoTo();
	 * This functions makes map go to given coordinates, at given level
	 * @param lvl The level
	 * @param lat The latitude
	 * @param lon The longitude
	 */
	this.goTo = function(lvl, lat, lon) {
		_view.getMap().setView(L.latLng(lat, lon), _view.getMap().getMaxZoom());
		
		if(_view.isLoading()) {
			_isGoingTo = true;
			$(document).on("donerefresh", function() { controller.onDoneRefresh(lvl); });
		}
		else {
			_self.toLevel(lvl);
		}
	};
	
	/**
	 * Downloads data from Overpass API
	 * Then calls another function to process it.
	 * @param type The kind of request ("data" or "cluster")
	 * @param handler The handler function, which will process the data
	 */
	this.downloadData = function(type, handler) {
		var bounds = _view.getMapBounds();
		var oapiRequest = null;
		
		_view.addLoadingInfo("Request Overpass API");
		
		//Prepare request depending of type
		if(type == "cluster") {
			_mapdata.setClusterBBox(_view.getMap().getBounds());
			oapiRequest = '[out:json][timeout:25];(way["indoor"]["indoor"!="yes"]["level"]('+bounds+');';
			if(_view.showLegacy()) { oapiRequest += 'way["buildingpart"]["level"]('+bounds+');'; }
			oapiRequest += ');out body center;';
		}
		else {
			_mapdata.setBBox(_view.getMap().getBounds());
			oapiRequest = '[out:json][timeout:25];(node["door"]('+bounds+');<;>;node["entrance"]('+bounds+');<;>;node["level"]('+bounds+');way["level"]('+bounds+');relation["type"="multipolygon"]["level"]('+bounds+');node["repeat_on"]('+bounds+');way["repeat_on"]('+bounds+');way["min_level"]('+bounds+');way["max_level"]('+bounds+');relation["type"="level"]('+bounds+'));out body;>;out skel qt;';
		}

		//Download data
		$.get(OLvlUp.controller.API_URL+encodeURIComponent(oapiRequest), handler, "text");
	};
},

/**
 * LevelExporter allows level data export.
 */
LevelExporter: function(data) {
	//ATTRIBUTES
	/** The GeoJSON features **/
	var _geojson = data;
	
	/** The current object **/
	var _self = this;
	
	//OTHER METHODS
	/**
	 * Exports the current level as a SVG
	 * @return The SVG
	 */
	this.exportAsSVG = function(map) {
		//Create SVG area
		var draw = SVG('svg-area').size("100%", "100%");
		
		var ftSvg = new Object();
		
		//Draw each feature
		for(var i in _geojson.features) {
			var feature = _geojson.features[i];
			var ftStyle = feature.properties.style.getStyle();
			
			var img = null;
			if(feature.properties.style.getIconUrl() != null) {
				var img = myFolderUrl()+"/"+feature.properties.style.getIconUrl();
			}
			
			//Create SVG object depending of feature type
			if(feature.geometry.type == "Point") {
				var coords = map.latLngToLayerPoint(L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]));
				
				var point;
				
				if(img != null) {
					point = draw.image(img, OLvlUp.view.ICON_SIZE, OLvlUp.view.ICON_SIZE)
						.move(coords.x - OLvlUp.view.ICON_SIZE/2, coords.y - OLvlUp.view.ICON_SIZE/2)
						.front();
				}
				else {
					point = draw.circle(10)
						.stroke({ color: ftStyle.color, opacity: ftStyle.opacity, width: ftStyle.weight })
						.fill({ color: ftStyle.fillColor, opacity: ftStyle.fillOpacity })
						.move(coords.x, coords.y)
						.front();
				}
				
				//Add to layer list
				if(ftStyle.layer != undefined) {
					if(ftSvg[ftStyle.layer] == undefined) {
						ftSvg[ftStyle.layer] = new Array();
					}
					
					ftSvg[ftStyle.layer].push(point);
				}
			}
			else if(feature.geometry.type == "LineString") {
				var coordsStr = "";
				
				for(var i in feature.geometry.coordinates) {
					var coords = map.latLngToLayerPoint(L.latLng(feature.geometry.coordinates[i][1], feature.geometry.coordinates[i][0]));
					coordsStr += coords.x+","+coords.y+" ";
				}
				
				var polyline = draw.polyline(coordsStr)
					.stroke({ color: ftStyle.color, opacity: ftStyle.opacity, width: ftStyle.weight })
					.fill({ color: ftStyle.fillColor, opacity: ftStyle.fillOpacity });
				polyline.attr("stroke-linecap", ftStyle.lineCap);
				polyline.attr("stroke-dasharray", ftStyle.dashArray);
				
				//Add to layer list
				if(ftStyle.layer != undefined) {
					if(ftSvg[ftStyle.layer] == undefined) {
						ftSvg[ftStyle.layer] = new Array();
					}
					
					ftSvg[ftStyle.layer].push(polyline);
				}
				
				//Add icon
				if(img != null) {
					var nbSegments = feature.geometry.coordinates.length - 1;
					
					//For each segment, add an icon
					for(var i=0; i < nbSegments; i++) {
						var coord1 = feature.geometry.coordinates[i];
						var coord2 = feature.geometry.coordinates[i+1];
						var coordMid = [ (coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2 ];
						var coordsIcon = map.latLngToLayerPoint(L.latLng(coordMid[1], coordMid[0]));
						
						var icon = draw.image(img, OLvlUp.view.ICON_SIZE, OLvlUp.view.ICON_SIZE)
							.move(coordsIcon.x - OLvlUp.view.ICON_SIZE/2, coordsIcon.y - OLvlUp.view.ICON_SIZE/2);
						
						if(ftStyle.rotateIcon) {
							var angle = azimuth({lat: coord1[1], lng: coord1[0], elv: 0}, {lat: coord2[1], lng: coord2[0], elv: 0}).azimuth;
							icon.rotate(angle, icon.x() + OLvlUp.view.ICON_SIZE/2, icon.y() + OLvlUp.view.ICON_SIZE/2);
						}
					}
				}
			}
			else if(feature.geometry.type == "Polygon") {
				for(var i in feature.geometry.coordinates) {
					var coordsStr = "";
					var fillOpacity = (ftStyle.fillOpacity != undefined) ? ftStyle.fillOpacity : 0.2;
					
					for(var j in feature.geometry.coordinates[i]) {
						var coords = map.latLngToLayerPoint(L.latLng(feature.geometry.coordinates[i][j][1], feature.geometry.coordinates[i][j][0]));
						coordsStr += coords.x+","+coords.y+" ";
					}
					
					var polygon = draw.polygon(coordsStr)
						.stroke({ color: ftStyle.color, opacity: ftStyle.opacity, width: ftStyle.weight })
						.fill({ color: ftStyle.fillColor, opacity: fillOpacity });
					polygon.attr("stroke-linecap", ftStyle.lineCap);
					polygon.attr("stroke-dasharray", ftStyle.dashArray);
					
					//Add to layer list
					if(ftStyle.layer != undefined) {
						if(ftSvg[ftStyle.layer] == undefined) {
							ftSvg[ftStyle.layer] = new Array();
						}
						
						ftSvg[ftStyle.layer].push(polygon);
					}
				}
				
				//Add icon
				if(img != null) {
					var centroid = centroidPolygon(feature.geometry);
					var coordsIcon = map.latLngToLayerPoint(L.latLng(centroid[1], centroid[0]));
					draw.image(img, OLvlUp.view.ICON_SIZE, OLvlUp.view.ICON_SIZE)
						.move(coordsIcon.x - OLvlUp.view.ICON_SIZE/2, coordsIcon.y - OLvlUp.view.ICON_SIZE/2);
				}
			}
		}
		
		//Order them by JSON style layer
		var ftSvgKeys = Object.keys(ftSvg).sort(function (a,b) { return parseFloat(b)-parseFloat(a);});
		for(var i in ftSvgKeys) {
			for(var obj in ftSvg[ftSvgKeys[i]]) {
				ftSvg[ftSvgKeys[i]][obj].back();
			}
		}
		
		//Add north arrow
		var northArrowCoords = map.latLngToLayerPoint(map.getBounds().getNorthEast());
		draw.image(myFolderUrl()+"/img/North_Pointer.svg", 45, 70)
			.move(northArrowCoords.x - 45, northArrowCoords.y);
		
		//Add logo
		draw.image(myFolderUrl()+"/img/logo.jpg", 139, 50);
		
		//Add level
		draw.text("Level "+controller.getView().getCurrentLevel())
			.move(0, 55);

		//Add attribution
		var sourceCoords = map.latLngToLayerPoint(map.getBounds().getSouthWest());
		draw.text("Map data © OpenStreetMap contributors")
			.move(sourceCoords.x, sourceCoords.y - 30);
		
		//Export
		return draw.exportSvg();
	};
}

};
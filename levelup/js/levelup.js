/*
 * This file is part of LevelUp!.
 * 
 * LevelUp! is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * LevelUp! is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with LevelUp!.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * LevelUp!
 * Web viewer for indoor mapping (based on OpenStreetMap data).
 * Author: Adrien PAVIE
 *
 * JavaScript
 * Dependencies: OSMtoGeoJSON, jQuery
 */

/*
 * =====================================================
 * =         Application controller functions          =
 * =====================================================
 */
/**
 * Class LevelUpController
 * Manages the application.
 */
function LevelUpController(currentMap) {
//ATTRIBUTES
	/** The current MapData object **/
	var _mapdata = null;
	
	/** The current Leaflet map object **/
	var _map = currentMap;
	
	/** The current GeoJSON data layer on map **/
	var _dataLayer = null;
	
	/** The current object **/
	var _self = this;

//OTHER METHODS
	/**
	 * This function is called when map was moved or zoomed in/out.
	 */
	this.mapUpdate = function() {
		setLoading(true);
		
		//Check if zoom level is high enough to download data
		if(_map.getZoom() >= 17) {
			//Get current level
			oldLevel = parseFloat($("#level").val());
			
			//Download data
			_mapdata = new MapData(_self);
			_mapdata.downloadData(_map.getBounds().getSouth()+","+_map.getBounds().getWest()+","+_map.getBounds().getNorth()+","+_map.getBounds().getEast());
			//When download is done, endMapUpdate() will be called.
		}
		else {
			_self.removeDataLayer();
			populateSelectLevels({});
			displayMessage("Zoomez plus pour afficher les informations", "info");
		}
		
		setLoading(false);
	}
	
	/**
	 * This function is called after data download finishes
	 */
	this.endMapUpdate = function() {
		if(_mapdata.getLevels() != null) {
			populateSelectLevels(_mapdata.getLevels());
			
			//Test how many levels are available
			if(_mapdata.getLevels().length > 0) {
				//Restore old level if possible
				if(_mapdata.getLevels().indexOf(oldLevel) >=0) {
					$("#level").val(oldLevel);
				}
			}
			//If no available level, display some message
			else {
				displayMessage("Pas de données sur la zone", "alert");
			}
			
			//Refresh leaflet map
			_self.updateLevelOnMap();
		}
	}
	
	/**
	 * Changes the shown level on map
	 */
	this.updateLevelOnMap = function() {
		_self.removeDataLayer();
		
		_dataLayer = L.geoJson(
			_mapdata.getData(),
			{
				filter: filterElements,
				style: styleElements,
				pointToLayer: styleNodes,
				onEachFeature: processElements
			}
		);
		_dataLayer.addTo(_map);
	}
	
	/**
	 * Makes the level increase of one step
	 */
	this.levelUp = function() {
		var currentLevelValue = $("#level").val();
		var currentLevelId = _mapdata.getLevels().indexOf(parseFloat(currentLevelValue));
		
		if(currentLevelId == -1) {
			displayMessage("Étage invalide", "error");
		}
		else if(currentLevelId + 1 < _mapdata.getLevels().length) {
			$("#level").val(_mapdata.getLevels()[currentLevelId+1]);
			_self.updateLevelOnMap();
		}
		else {
			displayMessage("Vous êtes déjà au dernier niveau disponible", "alert");
		}
	}
	
	/**
	 * Makes the level decrease of one step
	 */
	this.levelDown = function() {
		var currentLevelValue = $("#level").val();
		var currentLevelId = _mapdata.getLevels().indexOf(parseFloat(currentLevelValue));
		
		if(currentLevelId == -1) {
			displayMessage("Étage invalide", "error");
		}
		else if(currentLevelId > 0) {
			$("#level").val(_mapdata.getLevels()[currentLevelId-1]);
			_self.updateLevelOnMap();
		}
		else {
			displayMessage("Vous êtes déjà au premier niveau disponible", "alert");
		}
	}
	
	/**
	 * Removes the current data layer from map.
	 */
	this.removeDataLayer = function() {
		if(_dataLayer != null) {
			_map.removeLayer(_dataLayer);
			_dataLayer = null;
		}
	}
}



/*
 * =====================================================
 * =            Map data related functions             =
 * =====================================================
 */
/**
 * Class MapData
 * Handles data download, conversion and access.
 */
function MapData(ctrl) {
//ATTRIBUTES
	/** Levels array, ordered **/
	var _levels = null;
	
	/** Data as GeoJSON **/
	var _geojson = null;
	
	/** The application controller **/
	var _ctrl = ctrl;
	
	/** The current object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The data, as GeoJSON
	 */
	this.getData = function() {
		return _geojson;
	}
	
	/**
	 * @return The data, as GeoJSON
	 */
	this.getLevels = function() {
		return _levels;
	}
	
//OTHER METHODS
	/**
	 * Downloads data from Overpass API
	 * Then calls another function to process it.
	 * @param bounds The map bounds (South, West, North, East)
	 */
	this.downloadData = function(bounds) {
		//Download from Overpass API
		var oapiRequest = '[out:json][timeout:25];(node["indoor"]('+bounds+');way["indoor"]('+bounds+');node["door"]('+bounds+');<;>;node["level"]('+bounds+');way["level"]('+bounds+'););out body;';
		var oapiResponse = $.get("http://www.overpass-api.de/api/interpreter?data="+encodeURIComponent(oapiRequest), _self.parseOsmData, "text");
	}
	
	/**
	 * Parses raw OSM XML data, and stores the result in geojson attribute.
	 * @param data The OSM XML data.
	 */
	this.parseOsmData = function(data) {
		//Convert XML to GeoJSON
		data = data || "<osm></osm>";
		try {
			data = $.parseXML(data);
		} catch(e) {
			data = JSON.parse(data);
		}
		_geojson = osmtogeojson(data);
		
		//Retrieve level informations
		var levelsSet = new Set();
		for(var i in _geojson.features) {
			var feature = _geojson.features[i];
			
			//Parse level value (could be an integer, a float, a list of those, ...)
			if(feature.properties['tags']['level'] != undefined) {
				//Separate different values
				var currentLevel = feature.properties['tags']['level'].split(';');
				
				//Add each value in list
				for(var i=0; i < currentLevel.length; i++) {
					if(isFloat(currentLevel[i])) {
						levelsSet.add(parseFloat(currentLevel[i]));
					}
				}
			}
		}
		
		//Transform level set into a sorted array
		try {
			_levels = Array.from(levelsSet.values());
		}
		catch(error) {
			//An error is possible if browser doesn't support Set.values()
			_levels = _self.legacyProcessLevels();
		}
		_levels.sort(function (a,b) { return a-b;});

		//Call this method to notify controller that download is done
		_ctrl.endMapUpdate();
	}
	
	/**
	 * This function parses levels values from GeoJSON.
	 * @deprecated Created only because of the lack of support of Set, to delete when it will be wide supported.
	 * @return The parsed levels as an array (unsorted)
	 */
	this.legacyProcessLevels = function() {
		levelsAsArray = new Array();
		for(var i in _geojson.features) {
			var feature = _geojson.features[i];
			
			//Parse level value (could be an integer, a float, a list of those, ...)
			if(feature.properties['tags']['level'] != undefined) {
				//Separate different values
				var currentLevel = feature.properties['tags']['level'].split(';');
				
				//Add each value in list
				for(var i=0; i < currentLevel.length; i++) {
					if(isFloat(currentLevel[i])) {
						var lvl = parseFloat(currentLevel[i]);
						if(levelsAsArray.indexOf(lvl) < 0) {
							levelsAsArray[levelsAsArray.length] = lvl;
						}
					}
				}
			}
		}
		return levelsAsArray;
	}
}



/*
 * =====================================================
 * =            HTML view update functions             =
 * =====================================================
 */

	/**
	* Displays a message in the console and in a specific area of the page.
	* @param msg The string to display
	* @param type The kind of message (info, alert, error)
	*/
	function displayMessage(msg, type) {
		//console.log("["+type+"] "+msg);
		
		//Display message on map
		$("#infobox-label").html(msg);
		
		//Set style depending of message type
		$("#infobox").addClass(type);
		
		//Hide after a delay
		setTimeout(function() {
			$("#infobox-label").html("");
			$("#infobox").removeClass("alert info error");
		}, 5000);
	}

	/**
	* Displays a message when the map is loading, and hides it when its done.
	* @param isLoading True if start loading, false if loading is done
	*/
	function setLoading(isLoading) {
		$("#overlay-panel").toggle(isLoading);
	}
	
	/**
	 * This function updates the select field for levels
	 * @param levelsArray The levels array (must be already sorted)
	 */
	function populateSelectLevels(levelsArray) {
		var option = '';

		for(var i=0; i < levelsArray.length; i++) {
			option += '<option value="'+ levelsArray[i] + '">' + levelsArray[i] + '</option>';
		}
		
		$('#level').empty();
		$('#level').append(option);
	}



/*
 * =====================================================
 * =            GeoJSON processing functions           =
 * =====================================================
 */
	/**
	* This function is run everytime an element is added on the map (see onEachFeature for GeoJSON in Leaflet)
	* @param feature The GeoJSON feature to analyse
	* @param layer The leaflet layer
	*/
	function processElements(feature, layer) {
		//Create a readable text for each element
		var text;
		
		//Determine the kind of object
		var typeObject = "";
		if(feature.properties.tags["indoor"] != undefined) {
			var indoorType = feature.properties.tags["indoor"];
			var correspondingObject = { room: "Pièce", area: "Espace", wall: "Mur", corridor: "Couloir", level: "Niveau" };
			typeObject = (correspondingObject[indoorType] != undefined) ? correspondingObject[indoorType] : "";
		}
		else if(feature.properties.tags["door"] != undefined) {
			typeObject = "Entrée/sortie";
		}
		else if(feature.properties.tags["amenity"] != undefined) {
			var amenityType = feature.properties.tags["amenity"];
			var correspondingObject = { vending_machine: "Distributeur", ticket_validator: "Composteur" };
			typeObject = (correspondingObject[amenityType] != undefined) ? correspondingObject[amenityType] : "";
		}
		
		text = '<h1 class="popup">'+typeObject+'</h1>';
		
		//Then, list all tags
		text += '<h2 class="popup">Tags</h2>';
		for(i in feature.properties.tags) {
			text += i+" = "+feature.properties.tags[i]+"<br />";
		}
		
		//And add popup to layer
		layer.bindPopup(text);
	}
	
	/**
	* Filter GeoJSON elements depending of their level.
	* @param feature The GeoJSON feature to analyse
	* @param layer The leaflet layer
	* @return True if should be shown
	*/
	function filterElements(feature, layer) {
		//Consider level and repeat_on tags
		if(feature.properties.tags.repeat_on != undefined) {
			var repeatOn = feature.properties.tags.repeat_on;
			var repeatOnLevels = repeatOn.split(';'); //TODO Also use syntax with "-" separator
		}
		return feature.properties.tags.level == $("#level").val() || (repeatOnLevels != null && repeatOnLevels.indexOf($("#level").val()) >= 0);
	}

	/**
	* Returns the appropriate style for a given OSM element (depending of its tags)
	* @param feature The GeoJSON element to decorate
	* @return The style
	*/
	function styleElements(feature) {
		var result;
		
		//Indoor
		if(feature.properties.tags.indoor != undefined) {
			result = { color: "white", fillColor: "white" };
		}
		//Door
		else if(feature.properties.tags.door != undefined) {
			result = { color: "black", fillColor: "green" };
		}
		//Amenities
		else if(feature.properties.tags.amenity != undefined) {
			result = { color: "black", fillColor: "red" };
		}
		//Other elements, keep default
		else {
			result = { };
		}
		return result;
	}

	/**
	* Returns the appropriate style for a given OSM node element (depending of its tags)
	* @param feature The GeoJSON element to decorate
	* @param latlng Its coordinates
	* @return The style
	*/
	function styleNodes(feature, latlng) {
		var geojsonMarkerOptions = {
			radius: 8,
			fillColor: "#ff7800",
			color: "#000",
			weight: 1,
			opacity: 1,
			fillOpacity: 0.8
		};
		return L.circleMarker(latlng, geojsonMarkerOptions);
	}



/*
 * =====================================================
 * =                 Utility functions                 =
 * =====================================================
 */

	/**
	* Is the given value a float value ?
	* @param val The value to test
	* @return True if it's a float
	*/
	function isFloat(val) {
		return !isNaN(val);
	}
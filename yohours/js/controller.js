/*
 * This file is part of YoHours.
 * 
 * YoHours is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * YoHours is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with YoHours.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * YoHours
 * Web interface to make opening hours data for OpenStreetMap the easy way
 * Author: Adrien PAVIE
 *
 * Controller JS classes
 */
YoHours.ctrl = {
/*
 * ========== CLASSES ==========
 */
MainController: function() {
//ATTRIBUTES
	/** Main view object **/
	var _view = new YoHours.view.MainView(this);

	/** All the wide intervals defined **/
	var _dateRanges = [ new YoHours.model.DateRange() ];
	
	/** The opening hours builder **/
	var _builder = new YoHours.model.OpeningHoursBuilder();

	/** The opening hours parser **/
	var _parser = new YoHours.model.OpeningHoursParser();
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The opening_hours value
	 */
	this.getOpeningHours = function() {
		return _builder.build(_dateRanges);
	};
	
	/**
	 * @return The main view
	 */
	this.getView = function() {
		return _view;
	};
	
	/**
	 * @return The date ranges array, some may be undefined
	 */
	this.getDateRanges = function() {
		return _dateRanges;
	};
	
	/**
	 * @return The first defined date range
	 */
	this.getFirstDateRange = function() {
		var i = 0, found = false;
		while(i < _dateRanges.length && !found) {
			if(_dateRanges[i] != undefined) {
				found = true;
			}
			else {
				i++;
			}
		}
		
		//If no date range found, create a new one
		if(!found) {
			_dateRanges = [ new YoHours.model.DateRange() ];
			i = 0;
		}
		
		return _dateRanges[i];
	};

//OTHER METHODS
	/**
	 * Initializes the controller
	 */
	this.init = function() {
		_view.init();
	};

	/**
	 * Clear all defined data
	 */
	this.clear = function() {
		_dateRanges = [ new YoHours.model.DateRange() ];
		_view.getCalendarView().show(_dateRanges[0]);
		_view.refresh();
	};
	
	/**
	 * Adds a new date range
	 * @param start The start time of this range
	 * @param end The end time
	 * @return The created range
	 */
	this.newRange = function(start, end) {
		var range = new YoHours.model.DateRange(start, end);
		_dateRanges.push(range);
		_view.refresh();
		return range;
	};
	
	/**
	 * Deletes the currently shown date range
	 */
	this.deleteCurrentRange = function() {
		var range = _view.getCalendarView().getDateRange();
		var found = false, l = _dateRanges.length, i=0;
		
		while(i < l && !found) {
			if(_dateRanges[i] === range) {
				found = true;
				_dateRanges[i] = undefined;
			}
			else {
				i++;
			}
		}
		
		//Refresh calendar
		_view.getCalendarView().show(this.getFirstDateRange());
		_view.refresh();
	};
	
	/**
	 * Displays the given opening hours
	 * @param str The opening hours to show
	 */
	this.showHours = function(str) {
		//Clear intervals
		_week = new YoHours.model.Week();
		$('#calendar').fullCalendar('removeEvents');
		
		//Parse given string
		try {
			_parser.parse(str);
			// var oh = new opening_hours(str, {"place_id":"24581148","licence":"Data © OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"2399693457","lat":"48.0144107","lon":"-2.0364455","display_name":"Le Closel, Plélan-le-Grand, Rennes, Ille-et-Vilaine, Bretagne, France métropolitaine, 35380, France","address":{"suburb":"Le Closel","village":"Plélan-le-Grand","county":"Rennes","state":"Bretagne","country":"France","postcode":"35380","country_code":"fr"}});
			// var intervals = oh.getOpenIntervals(getMonday(), getSunday());
			
			// console.log(oh.getRules());
			
			// //Add read intervals to week
			// var interval;
			// for(var i =0; i < intervals.length; i++) {
				// interval = intervals[i];
				
				// //Add event to week intervals
				// var weekId = this.newInterval(
					// new YoHours.model.Interval(
						// swDayToMwDay(interval[0].getDay()),
						// swDayToMwDay(interval[1].getDay()),
						// interval[0].getHours() * 60 + interval[0].getMinutes(),
						// interval[1].getHours() * 60 + interval[1].getMinutes()
					// )
				// );
				
				// //Add event on calendar
				// var eventData = {
					// id: weekId,
					// start: moment(interval[0]),
					// end: moment(interval[1])
				// };
				// $('#calendar').fullCalendar('renderEvent', eventData, true);
			// }
			
			_view.getHoursInputView().setValid(true);
		}
		catch(e) {
			console.error(e);
			_view.getHoursInputView().setValid(false);
		}
		
		_view.getHoursInputView().setValue(str);
	};
}

};
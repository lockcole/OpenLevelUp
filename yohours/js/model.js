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
 * Model JS classes
 */
YoHours.model = {
/*
 * ========= CONSTANTS =========
 */
/**
 * The days in a week
 */
DAYS: {
	MONDAY: 0,
	TUESDAY: 1,
	WEDNESDAY: 2,
	THURSDAY: 3,
	FRIDAY: 4,
	SATURDAY: 5,
	SUNDAY: 6
},

/**
 * The days in OSM
 */
OSM_DAYS: [ "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su" ],

/**
 * The days IRL
 */
IRL_DAYS: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ],

/*
 * ========== CLASSES ==========
 */
/**
 * Class Interval, defines an interval in a given day where the POI is open.
 * @param day The week day (use DAYS constants)
 * @param start The interval start (in minutes since midnight)
 * @param end The interval end (in minutes since midnight)
 */
Interval: function(day, start, end) {
//ATTRIBUTES
	/** The day in the week, see DAYS **/
	var _day = day;
	
	/** The interval start, in minutes since midnight (local hour) **/
	var _start = start;
	
	/** The interval end, in minutes since midnight (local hour) **/
	var _end = end;
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The day in the week, see DAYS constants
	 */
	this.getDay = function() {
		return _day;
	};
	
	/**
	 * @return The interval start, in minutes since midnight
	 */
	this.getFrom = function() {
		return _start;
	};
	
	/**
	 * @return The interval end, in minutes since midnight
	 */
	this.getTo = function() {
		return _end;
	};
},

/**
 * Class Week, represents a typical week of opening hours.
 */
Week: function() {
//ATTRIBUTES
	/** The intervals defining this week **/
	var _intervals = new Object();
	
	/** The next interval ID **/
	var _nextInterval = 0;
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return This week, as a two-dimensional boolean array. First dimension is for days (see DAYS), second dimension for minutes since midnight. True if open, false else.
	 */
	this.getAsMinutesArray = function() {
		//Create array with all values set to false
		//For each day
		var minuteArray = new Array(7);
		for(var day = 0; day < 7; day++) {
			//For each minute
			minuteArray[day] = new Array(24*60 + 2);
			for (var minute = 0; minute < 24 * 60 + 2; minute++) {
				minuteArray[day][minute] = false;
			}
		}
		
		//Set to true values where an interval is defined
		for(var id in _intervals) {
			if(_intervals.hasOwnProperty(id) && _intervals[id] != undefined) {
				for (var minute = _intervals[id].getFrom(); minute <= _intervals[id].getTo(); minute++) {
					minuteArray[_intervals[id].getDay()][minute] = true;
				}
			}
		}
		
		return minuteArray;
	};
	
	/**
	 * @return The intervals in this week
	 */
	this.getIntervals = function() {
		return _intervals;
	};

//MODIFIERS
	/**
	 * Add a new interval to this week
	 * @param interval The new interval
	 * @return The ID of the added interval
	 */
	this.addInterval = function(interval) {
		_intervals[_nextInterval] = interval;
		_nextInterval++;
		
		return _nextInterval-1;
	};
	
	/**
	 * Remove the given interval
	 * @param id the interval ID
	 */
	this.removeInterval = function(id) {
		_intervals[id] = undefined;
	};
},

/**
 * Class OpeningHoursParser, creates opening_hours value from week object
 */
OpeningHoursParser: function() {
//OTHER METHODS
	/**
	 * Parses a week to create an opening_hours string
	 * Algorithm inspired by OpeningHoursEdit plugin for JOSM
	 * @param week The week object to parse
	 * @return The opening_hours string
	 */
	this.parse = function(week) {
		var minuteArray = week.getAsMinutesArray();
		var ret = "";
		var days = new Array(7); // an array representing the status of the days
		for(var i=0; i < days.length; i++) {
			days[i] = 0;
		}
		
		// 0 means nothing done with this day yet
		// 8 means the day is off
		// 0<x<8 means the day have the openinghours of day x
		// -8<x<0 means nothing done with this day yet, but it intersects a
		// range of days with same opening_hours
		for(var i = 0; i < 7; i++) {
			var add = "";
			
			if (_isArrayEmpty(minuteArray[i]) && days[i] == 0) {
				days[i] = 8;
			} else if (_isArrayEmpty(minuteArray[i]) && days[i] < 0) {
				add = YoHours.model.OSM_DAYS[i] + " off";
				days[i] = -8;
			} else if (days[i] <= 0) {
				days[i] = i + 1;
				var lastSameDay = i;
				var sameDayCount = 1;
				
				for(var j = i + 1; j < 7; j++) {
					if (_arraysEqual(minuteArray[i], minuteArray[j])) {
						days[j] = i + 1;
						lastSameDay = j;
						sameDayCount++;
					}
				}
				if (sameDayCount == 1) {
					// a single Day with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + " " + _makeStringFromMinuteArray(minuteArray[i]);
				} else if (sameDayCount == 2) {
					// exactly two Days with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + "," + YoHours.model.OSM_DAYS[lastSameDay] + " "
					+ _makeStringFromMinuteArray(minuteArray[i]);
				} else if (sameDayCount > 2) {
					// more than two Days with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + "-" + YoHours.model.OSM_DAYS[lastSameDay] + " "
					+ _makeStringFromMinuteArray(minuteArray[i]);
					for (var j = i + 1; j < lastSameDay; j++) {
						if (days[j] == 0) {
							days[j] = -i - 1;
						}
					}
				}
			}
			
			if (add.length > 0) {
				if (ret.length > 0) {
					ret += "; ";
				}
				ret += add;
			}
		}
		return ret;
	};
	
	/**
	 * Returns a String representing the openinghours on one special day (e.g. "10:00-20:00")
	 * @param minutes The minutes array for only one day
	 * @return The opening hours in this day
	 */
	function _makeStringFromMinuteArray(minutes) {
		var ret = "";
		for (var i = 0; i < minutes.length; i++) {
			if (minutes[i]) {
				var start = i;
				while (i < minutes.length && minutes[i]) {
					i++;
				}
				var addString = _timeString(start);
				if (i - 1 == 24 * 60 + 1) {
					addString += "+";
				} else if (start != i - 1) {
					addString += "-" + _timeString(i - 1);
				}
				if (ret.length > 0) {
					ret += ",";
				}
				ret += addString;
			}
		}
		return ret;
	};
	
	/**
	 * @param minutes integer in range from 0 and 24*60 inclusive
	 * @return a formatted string of the time (for example "13:45")
	 */
	function _timeString(minutes) {
		var h = Math.floor(minutes / 60);
		var period = "";
		var m = minutes % 60;
		return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + period;
	};
	
	/**
	 * Is the given array empty (ie only containing false values)
	 * @param bs The array to test
	 * @return True if empty
	 */
	function _isArrayEmpty(bs) {
		for(var i = 0; i < bs.length; i++) {
			if (bs[i]) {
				return false;
			}
		}
		return true;
	};
	
	/**
	 * Are the two arrays equal ?
	 * @param bs The first array
	 * @param bs2 The second array
	 * @return True if they are equal
	 */
	function _arraysEqual(bs, bs2) {
		var ret = true;
		for(var i = 0; i < bs.length; i++) {
			ret &= bs[i] == bs2[i];
		}
		return ret;
	};
}

};
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
 * Class Interval, defines an interval in a week where the POI is open.
 * @param dayStart The start week day (use DAYS constants)
 * @param dayEnd The end week day (use DAYS constants)
 * @param minStart The interval start (in minutes since midnight)
 * @param minEnd The interval end (in minutes since midnight)
 */
Interval: function(dayStart, dayEnd, minStart, minEnd) {
//ATTRIBUTES
	/** The start day in the week, see DAYS **/
	var _dayStart = dayStart;
	
	/** The end day in the week, see DAYS **/
	var _dayEnd = dayEnd;
	
	/** The interval start, in minutes since midnight (local hour) **/
	var _start = minStart;
	
	/** The interval end, in minutes since midnight (local hour) **/
	var _end = minEnd;
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The start day in the week, see DAYS constants
	 */
	this.getStartDay = function() {
		return _dayStart;
	};
	
	/**
	 * @return The end day in the week, see DAYS constants
	 */
	this.getEndDay = function() {
		return _dayEnd;
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

//CONSTRUCTOR
	//Handle special cases, like sunday midnight
	if(_end == 0) {
		_dayEnd = (_dayEnd == 0) ? 6 : _dayEnd-1;
		_end = 24 * 60;
	}
},

/**
 * Class Week, represents a typical week of opening hours.
 */
Week: function() {
//ATTRIBUTES
	/** The intervals defining this week **/
	var _intervals = [];
	
	/** The next interval ID **/
	var _nextInterval = 0;
	
	/** This object **/
	var _self = this;

//ACCESSORS
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
	 * Edits the given interval
	 * @param id The interval ID
	 * @param interval The new interval
	 */
	this.editInterval = function(id, interval) {
		_intervals[id] = interval;
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
		var intervals = week.getIntervals();
		var days = [];
		var daysStr = [];
		
		// 0 means nothing done with this day yet
		// 8 means the day is off
		// 0<x<8 means the day have the openinghours of day x
		// -8<x<0 means nothing done with this day yet, but it intersects a
		// range of days with same opening_hours
		var daysStatus = [];
		
		for(var i=0; i < YoHours.model.OSM_DAYS.length; i++) {
			days[i] = [];
			daysStatus[i] = 0;
			daysStr[i] = '';
		}
		
		/*
		 * Create time intervals per day
		 */
		var interval;
		var monday0 = -1;
		var sunday24 = -1;
		for(var i=0, l=intervals.length; i < l; i++) {
			interval = intervals[i];
			
			if(interval != undefined) {
				//Handle sunday 24:00 with monday 00:00
				if(interval.getStartDay() == 6 && interval.getEndDay() == 6 && interval.getTo() == 24*60) {
					sunday24 = interval.getFrom();
				}
				if(interval.getStartDay() == 0 && interval.getEndDay() == 0 && interval.getFrom() == 0) {
					monday0 = interval.getTo();
				}
				
				//Interval in a single day
				if(interval.getStartDay() == interval.getEndDay()) {
					days[interval.getStartDay()].push(_timeString(interval.getFrom())+"-"+_timeString(interval.getTo()));
				}
				//Interval on two days
				else if(interval.getEndDay() - interval.getStartDay() == 1) {
					//Continuous night
					if(interval.getFrom() > interval.getTo()) {
						days[interval.getStartDay()].push(_timeString(interval.getFrom())+"-"+_timeString(interval.getTo()));
					}
					//Separated days
					else {
						days[interval.getStartDay()].push(_timeString(interval.getFrom())+"-24:00");
						days[interval.getEndDay()].push("00:00-"+_timeString(interval.getTo()));
					}
				}
				//Interval on more than two days
				else {
					for(var j=interval.getStartDay(), end=interval.getEndDay(); j <= end; j++) {
						if(j == interval.getStartDay()) {
							days[j].push(_timeString(interval.getFrom())+"-24:00");
						}
						else if(j == interval.getEndDay()) {
							days[j].push("00:00-"+_timeString(interval.getTo()));
						}
						else {
							days[j].push("00:00-24:00");
						}
					}
				}
			}
		}
		
		/*
		 * Create continuous night for monday-sunday
		 */
		if(monday0 >= 0 && sunday24 >= 0 && monday0 < sunday24) {
			days[0].sort();
			days[6].sort();
			
			//Change sunday interval
			days[6][days[6].length-1] = _timeString(sunday24)+"-"+_timeString(monday0);
			
			//Remove monday interval
			days[0].shift();
		}
		
		/*
		 * Create interval strings per day
		 */
		for(var i=0; i < days.length; i++) {
			var intervalsStr = '';
			if(days[i].length > 0) {
				days[i].sort();
				for(var j=0; j < days[i].length; j++) {
					if(j > 0) {
						intervalsStr += ',';
					}
					intervalsStr += days[i][j];
				}
			}
			else {
				intervalsStr = 'off';
			}

			daysStr[i] = intervalsStr;
		}
		
		/*
		 * Create string result
		 */
		var result = "";
		for(var i=0; i < days.length; i++) {
			var add = "";
			
			if (daysStr[i] == 'off' && daysStatus[i] == 0) {
				daysStatus[i] = 8;
			} else if (daysStr[i] == 'off' && daysStatus[i] < 0 && daysStatus[i] > -8) {
				//add = YoHours.model.OSM_DAYS[i] + " off";
				daysStatus[i] = -8;
			} else if (daysStatus[i] <= 0 && daysStatus[i] > -8) {
				daysStatus[i] = i + 1;
				var lastSameDay = i;
				var sameDayCount = 1;
				
				for(var j = i + 1; j < 7; j++) {
					if (daysStr[i] == daysStr[j]) {
						daysStatus[j] = i + 1;
						lastSameDay = j;
						sameDayCount++;
					}
				}
				if (sameDayCount == 1) {
					// a single Day with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + " " + daysStr[i];
				} else if (sameDayCount == 2) {
					// exactly two Days with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + "," + YoHours.model.OSM_DAYS[lastSameDay] + " "
					+ daysStr[i];
				} else if (sameDayCount > 2) {
					// more than two Days with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + "-" + YoHours.model.OSM_DAYS[lastSameDay] + " "
					+ daysStr[i];
					for (var j = i + 1; j < lastSameDay; j++) {
						if (daysStatus[j] == 0) {
							daysStatus[j] = -i - 1;
						}
					}
				}
			}
			
			if (add.length > 0) {
				if (result.length > 0) {
					result += "; ";
				}
				result += add;
			}
		}
		
		/*
		 * Add days off
		 */
		var resOff = "";
		for(var i=0; i < days.length; i++) {
			var add = "";
			
			if(daysStatus[i] == -8) {
				var lastSameDay = i;
				var sameDayCount = 1;
				
				for(var j = i + 1; j < 7; j++) {
					if (daysStr[i] == daysStr[j]) {
						daysStatus[j] = -9;
						lastSameDay = j;
						sameDayCount++;
					}
					else {
						break;
					}
				}
				if (sameDayCount == 1) {
					// a single Day with this special opening_hours
					add = YoHours.model.OSM_DAYS[i];
				} else if (sameDayCount == 2) {
					// exactly two Days with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + "," + YoHours.model.OSM_DAYS[lastSameDay];
				} else if (sameDayCount > 2) {
					// more than two Days with this special opening_hours
					add = YoHours.model.OSM_DAYS[i] + "-" + YoHours.model.OSM_DAYS[lastSameDay];
					for (var j = i + 1; j < lastSameDay; j++) {
						if (daysStatus[j] == 0) {
							daysStatus[j] = -i - 1;
						}
					}
				}
			}
			
			if (add.length > 0) {
				if (resOff.length > 0) {
					resOff += ",";
				}
				resOff += add;
			}
		}
		
		if(resOff.length > 0) {
			result += "; "+resOff+" off";
		}
		
		/*
		 * Special cases
		 */
		// 24/7
		if(result == "Mo-Su 00:00-24:00") {
			result = "24/7";
		}
		
		return result;
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
}

};
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

/**
 * The month in OSM
 */
OSM_MONTHS: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],

/**
 * The months IRL
 */
IRL_MONTHS: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],

/**
 * The last day of month
 */
MONTH_END_DAY: [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ],

/**
 * The maximal minute that an interval can have
 */
MINUTES_MAX: 1440,

/**
 * The maximal value of days
 */
DAYS_MAX: 6,


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
	if(_dayEnd == 0 && _end == 0) {
		_dayEnd = YoHours.model.DAYS_MAX;
		_end = YoHours.model.MINUTES_MAX;
	}
	//console.log("Interval", _dayStart, _dayEnd, _start, _end);
},



/**
 * Class Day, represents a typical day
 */
Day: function() {
//ATTRIBUTES
	/** The intervals defining this week **/
	var _intervals = [];
	
	/** The next interval ID **/
	var _nextInterval = 0;

//ACCESSORS
	/**
	 * @return This day, as a boolean array (minutes since midnight). True if open, false else.
	 */
	this.getAsMinutesArray = function() {
		//Create array with all values set to false
		//For each minute
		var minuteArray = [];
		for (var minute = 0; minute <= YoHours.model.MINUTES_MAX; minute++) {
			minuteArray[minute] = false;
		}
		
		//Set to true values where an interval is defined
		for(var id=0, l=_intervals.length; id < l; id++) {
			if(_intervals[id] != undefined) {
				var startMinute = null;
				var endMinute = null;
				
				if(
					_intervals[id].getStartDay() == _intervals[id].getEndDay()
					|| (_intervals[id].getEndDay() == YoHours.model.DAYS_MAX && _intervals[id].getTo() == YoHours.model.MINUTES_MAX)
				) {
					//Define start and end minute regarding the current day
					startMinute = _intervals[id].getFrom();
					endMinute = _intervals[id].getTo();
				}
				
				//Set to true the minutes for this day
				if(startMinute != null && endMinute != null && startMinute != endMinute) {
					for(var minute = startMinute; minute <= endMinute; minute++) {
						minuteArray[minute] = true;
					}
				}
				else {
					console.log(_intervals[id].getFrom()+" "+_intervals[id].getTo()+" "+_intervals[id].getStartDay()+" "+_intervals[id].getEndDay());
					throw new Error("Invalid interval");
				}
			}
		}
		
		return minuteArray;
	};
	
	/**
	 * @param clean Clean intervals ? (default: false)
	 * @return The intervals in this week
	 */
	this.getIntervals = function(clean) {
		clean = clean || false;
		
		if(clean) {
			//Create continuous intervals over days
			var minuteArray = this.getAsMinutesArray();
			var intervals = [];
			var minStart = -1, minEnd;
			
			for(var min=0, lm=minuteArray.length; min < lm; min++) {
				//First minute
				if(min == 0) {
					if(minuteArray[min]) {
						minStart = min;
					}
				}
				//Last minute
				else if(min == lm-1) {
					if(minuteArray[min]) {
						intervals.push(new YoHours.model.Interval(
							0,
							0,
							minStart,
							min
						));
					}
				}
				//Other minutes
				else {
					//New interval
					if(minuteArray[min] && minStart < 0) {
						minStart = min;
					}
					//Ending interval
					else if(!minuteArray[min] && minStart >= 0) {
						intervals.push(new YoHours.model.Interval(
							0,
							0,
							minStart,
							min-1
						));

						minStart = -1;
					}
				}
			}
			
			return intervals;
		}
		else {
			return _intervals;
		}
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
	
	/**
	 * Redefines this date range intervals with a copy of the given ones
	 */
	this.copyIntervals = function(intervals) {
		_intervals = [];
		for(var i=0; i < intervals.length; i++) {
			if(intervals[i] != undefined) {
				_intervals.push($.extend(true, {}, intervals[i]));
			}
		}
	};
	
	/**
	 * Removes all defined intervals
	 */
	this.clearIntervals = function() {
		_intervals = [];
	};
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

//ACCESSORS
	/**
	 * @return This week, as a two-dimensional boolean array. First dimension is for days (see DAYS), second dimension for minutes since midnight. True if open, false else.
	 */
	this.getAsMinutesArray = function() {
		//Create array with all values set to false
		//For each day
		var minuteArray = [];
		for(var day = 0; day <= YoHours.model.DAYS_MAX; day++) {
			//For each minute
			minuteArray[day] = [];
			for (var minute = 0; minute <= YoHours.model.MINUTES_MAX; minute++) {
				minuteArray[day][minute] = false;
			}
		}
		
		//Set to true values where an interval is defined
		for(var id=0, l=_intervals.length; id < l; id++) {
			if(_intervals[id] != undefined) {
				for(var day = _intervals[id].getStartDay(); day <= _intervals[id].getEndDay(); day++) {
					//Define start and end minute regarding the current day
					var startMinute = (day == _intervals[id].getStartDay()) ? _intervals[id].getFrom() : 0;
					var endMinute = (day == _intervals[id].getEndDay()) ? _intervals[id].getTo() : YoHours.model.MINUTES_MAX;

					//Set to true the minutes for this day
					if(startMinute != endMinute) {
						for(var minute = startMinute; minute <= endMinute; minute++) {
							minuteArray[day][minute] = true;
						}
					}
				}
			}
		}
		
		return minuteArray;
	};
	
	/**
	 * @param clean Clean intervals ? (default: false)
	 * @return The intervals in this week
	 */
	this.getIntervals = function(clean) {
		clean = clean || false;
		
		if(clean) {
			//Create continuous intervals over days
			var minuteArray = this.getAsMinutesArray();
			var intervals = [];
			var dayStart = -1, minStart = -1, minEnd;
			
			for(var day=0, l=minuteArray.length; day < l; day++) {
				for(var min=0, lm=minuteArray[day].length; min < lm; min++) {
					//First minute of monday
					if(day == 0 && min == 0) {
						if(minuteArray[day][min]) {
							dayStart = day;
							minStart = min;
						}
					}
					//Last minute of sunday
					else if(day == YoHours.model.DAYS_MAX && min == lm-1) {
						if(dayStart >= 0 && minuteArray[day][min]) {
							intervals.push(new YoHours.model.Interval(
								dayStart,
								day,
								minStart,
								min
							));
						}
					}
					//Other days or minutes
					else {
						//New interval
						if(minuteArray[day][min] && dayStart < 0) {
							dayStart = day;
							minStart = min;
						}
						//Ending interval
						else if(!minuteArray[day][min] && dayStart >= 0) {
							if(min == 0) {
								intervals.push(new YoHours.model.Interval(
									dayStart,
									day-1,
									minStart,
									YoHours.model.MINUTES_MAX
								));
							}
							else {
								intervals.push(new YoHours.model.Interval(
									dayStart,
									day,
									minStart,
									min-1
								));
							}
							dayStart = -1;
							minStart = -1;
						}
					}
				}
			}
			
			return intervals;
		}
		else {
			return _intervals;
		}
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
	
	/**
	 * Removes all intervals during a given day
	 */
	this.removeIntervalsDuringDay = function(day) {
		var interval, itLength = _intervals.length;
		for(var i=0; i < itLength; i++) {
			interval = _intervals[i];
			if(interval != undefined) {
				//If interval over given day
				if(interval.getStartDay() <= day && interval.getEndDay() >= day) {
					//Create new interval if several day
					if(interval.getEndDay() - interval.getStartDay() > 1) {
						if(interval.getStartDay() < day) {
							this.addInterval(new YoHours.model.Interval(interval.getStartDay(), day-1, interval.getFrom(), 24*60));
						}
						if(interval.getEndDay() > day) {
							this.addInterval(new YoHours.model.Interval(day+1, interval.getEndDay(), 0, interval.getTo()));
						}
					}
					this.removeInterval(i);
				}
			}
		}
	};
	
	/**
	 * Redefines this date range intervals with a copy of the given ones
	 */
	this.copyIntervals = function(intervals) {
		_intervals = [];
		for(var i=0; i < intervals.length; i++) {
			if(intervals[i] != undefined) {
				_intervals.push($.extend(true, {}, intervals[i]));
			}
		}
	};
},



/**
 * Class DateRange, defines a range of months, weeks or days.
 * A typical week or day will be associated.
 */
DateRange: function(s, e) {
//ATTRIBUTES
	/** The moment when this interval starts **/
	var _start;
	
	/** The moment when this interval ends (null if only concerning start day) **/
	var _end;

	/** The kind of interval: month, week, day, holiday **/
	var _type;
	
	/** The typical week or day associated **/
	var _typical = undefined;
	
	var _self = this;

//CONSTRUCTOR
	function _init() {
		_self.updateRange(s, e);
	};

//ACCESSORS
	/**
	 * Is this interval defining a typical day ?
	 */
	this.definesTypicalDay = function() {
		return _typical instanceof YoHours.model.Day;
	};
	
	/**
	 * Is this interval defining a typical week ?
	 */
	this.definesTypicalWeek = function() {
		return _typical instanceof YoHours.model.Week;
	};
	
	/**
	 * @return The typical day or week
	 */
	this.getTypical = function() {
		return _typical;
	};
	
	/**
	 * @return When this interval starts
	 */
	this.getStart = function() {
		return _start;
	};
	
	/**
	 * @return When this interval ends
	 */
	this.getEnd = function() {
		return _end;
	};
	
	/**
	 * @return The kind of date range (day, week, month, holiday, always)
	 */
	this.getType = function() {
		return _type;
	};
	
	/**
	 * @return The human readable date range
	 */
	this.getTimeForHumans = function() {
		var result;
		
		switch(_type) {
			case "day":
				if(_end != null) {
					result = "every week from "+YoHours.model.IRL_MONTHS[_start.month-1]+" "+_start.day+" to "+YoHours.model.IRL_MONTHS[_end.month-1]+" "+_end.day;
				}
				else {
					result = "day "+YoHours.model.IRL_MONTHS[_start.month-1]+" "+_start.day;
				}
				break;

			case "week":
				if(_end != null) {
					result = "every week from week "+_start.week+" to "+_end.week;
				}
				else {
					result = "week "+_start.week;
				}
				break;

			case "month":
				if(_end != null) {
					result = "every week from "+YoHours.model.IRL_MONTHS[_start.month-1]+" to "+YoHours.model.IRL_MONTHS[_end.month-1];
				}
				else {
					result = "every week in "+YoHours.model.IRL_MONTHS[_start.month-1];
				}
				break;

			case "holiday":
				if(_start.holiday == "SH") {
					result = "every week during school holidays";
				}
				else if(_start.holiday == "PH") {
					result = "every public holidays";
				}
				else if(_start.holiday == "easter") {
					result = "each easter day";
				}
				else {
					throw new Error("Invalid holiday type: "+_start.holiday);
				}
				break;

			case "always":
			default:
				result = "every week of year";
		}
		
		return result;
	};
	
	/**
	 * @return The time selector for OSM opening_hours
	 */
	this.getTimeSelector = function() {
		var result;
		
		switch(_type) {
			case "day":
				result = YoHours.model.OSM_MONTHS[_start.month-1]+" "+((_start.day < 10) ? "0" : "")+_start.day;
				if(_end != null) {
					//Same month as start ?
					if(_start.month == _end.month) {
						result += "-"+((_end.day < 10) ? "0" : "")+_end.day;
					}
					else {
						result += "-"+YoHours.model.OSM_MONTHS[_end.month-1]+" "+((_end.day < 10) ? "0" : "")+_end.day;
					}
				}
				break;

			case "week":
				result = "week "+((_start.week < 10) ? "0" : "")+_start.week;
				if(_end != null) {
					result += "-"+((_end.week < 10) ? "0" : "")+_end.week;
				}
				break;

			case "month":
				result = YoHours.model.OSM_MONTHS[_start.month-1];
				if(_end != null) {
					result += "-"+YoHours.model.OSM_MONTHS[_end.month-1];
				}
				break;

			case "holiday":
				result = _start.holiday;
				break;

			case "always":
			default:
				result = "";
		}
		
		return result;
	};

//MODIFIERS
	/**
	 * Changes the date range
	 */
	this.updateRange = function(start, end) {
		_start = start || {};
		_end = end || null;
		
		//Find the kind of interval
		if(_start.day != undefined) {
			_type = "day";
			if(_typical == undefined) {
				if(_end != null && (_end.month > _start.month || _end.day > _start.day)) {
					_typical = new YoHours.model.Week();
				}
				else {
					_typical = new YoHours.model.Day();
					_end = null;
				}
			}
		}
		else if(_start.week != undefined) {
			_type = "week";
			if(_typical == undefined) {
				_typical = new YoHours.model.Week();
			}
			
			//Clean end if same as start
			if(_end != null && _end.week == _start.week) {
				_end = null;
			}
		}
		else if(_start.month != undefined) {
			_type = "month";
			if(_typical == undefined) {
				_typical = new YoHours.model.Week();
			}
			
			//Clean end if same as start
			if(_end != null && _end.month == _start.month) {
				_end = null;
			}
		}
		else if(_start.holiday != undefined) {
			_type = "holiday";
			if(_typical == undefined) {
				if(_start.holiday == "PH" || _start.holiday == "easter") {
					_typical = new YoHours.model.Day();
				}
				else {
					_typical = new YoHours.model.Week();
				}
			}
		}
		else {
			_type = "always";
			if(_typical == undefined) {
				_typical = new YoHours.model.Week();
			}
		}
	};

//OTHER METHODS
	/**
	 * Is the given date range concerning the same time interval ?
	 * @param start The start time
	 * @param end The end time
	 * @return True if same time selector
	 */
	this.isSameRange = function(start, end) {
		var result = false;
		
		//Clean start and end value
		if(start == null) {
			start = {};
		}
		if(end != null) {
			if(
				(start.day != undefined && end.day == start.day && end.month == start.month)
				|| (start.week != undefined && end.week == start.week)
				|| (start.month != undefined && start.day == undefined && end.month == start.month)
				|| (start.holiday != undefined && end.holiday == start.holiday)
				|| end == {}
			) {
				end = null;
			}
		}
		
		switch(_type) {
			case "day":
				result =
					(
					start.day == _start.day
					&& start.month == _start.month
					&& (end == _end || (_end != null && end != null && end.day == _end.day && end.month == _end.month))
					)
					||
					(
					start.day == undefined
					&& start.month == _start.month
					&& this.isFullMonth(_start, _end)
					);
				break;

			case "week":
				result =
					start.week == _start.week
					&& (end == _end || (_end != null && end != null && end.week == _end.week));
				break;

			case "month":
				console.log(_start, _end, start, end, this.isFullMonth(start, end));
				result = 
					(
						start.day != undefined
						&& start.month == _start.month
						&& (
							(_end == null && this.isFullMonth(start, end))
							|| (_end != null && end != null && end.month == _end.month && end.day == YoHours.model.MONTH_END_DAY[end.month-1])
						)
					)
					||
					(
						start.day == undefined
						&& start.month == _start.month
						&& ((_end != null && end != null && end.month == _end.month) || (_end == null && end == null))
					);
				break;

			case "holiday":
				result = start.holiday == _start.holiday;
				break;

			case "always":
			default:
				result =
					start.day == undefined
					&& start.week == undefined
					&& start.month == undefined
					&& start.holiday == undefined;
		}
		
		return result;
	};
	
	/**
	 * Does the given range corresponds to a full month ?
	 */
	this.isFullMonth = function(start, end) {
		if(start.month != undefined && start.day == undefined && (end == null || start.month == end.month)) {
			return true;
		}
		else if(start.month != undefined) {
			return (start.day == 1 && end != null && end.month == start.month && end.day != undefined && end.day == YoHours.model.MONTH_END_DAY[end.month-1]);
		}
		else {
			return false;
		}
	};
	
	/**
	 * Does this date range contains the given date range (ie the second is a refinement of the first)
	 * @param start The start of the date range
	 * @param end The end of the date range
	 * @return True if this date contains the given one (and is not strictly equal to)
	 */
	this.isGeneralFor = function(start, end) {
		/*
		 * Analyze the given date range
		 */
		start = start || {};
		end = end || null;
		var type;
		var result = false;
		
		//Find the kind of interval
		if(start.day != undefined) {
			type = "day";
		}
		else if(start.week != undefined) {
			type = "week";

			//Clean end if same as start
			if(end != null && end.week == start.week) {
				end = null;
			}
		}
		else if(start.month != undefined) {
			type = "month";

			//Clean end if same as start
			if(end != null && end.month == start.month) {
				end = null;
			}
		}
		else if(start.holiday != undefined) {
			type = "holiday";
		}
		else {
			type = "always";
		}
		
		/*
		 * Check if it is contained in this one
		 */
		if(_type == "always") {
			result = true;
		}
		else if(this.isSameRange(start, end)) {
			result = false;
		}
		else if(_type == "day" && this.definesTypicalWeek()) {
			if(type == "day") {
				//Starting after
				if(start.month > _start.month || (start.month == _start.month && start.day >= _start.day)) {
					//Ending before
					if(end != null && _end != null && (end.month < _end.month || (end.month == _end.month && end.day <= _end.day))) {
						result = true;
					}
				}
			}
			else if(type == "month"){
				//Starting after
				if(start.month > _start.month || (start.month == _start.month && _start.day == 1)) {
					//Ending before
					if(end != null && _end != null && (end.month < _end.month || (end.month == _end.month && _end.day == YoHours.model.MONTH_END_DAY[end.month-1]))) {
						result = true;
					}
					else if(end == null && (_end != null && start.month < _end.month)) {
						result = true;
					}
				}
			}
		}
		else if(_type == "week") {
			if(type == "week") {
				if(start.week >= _start.week) {
					if(end != null && _end != null && end.week <= _end.week) {
						result = true;
					}
					else if(end == null && ((_end != null && start.week <= _end.week) || start.week == _start.week)) {
						result = true;
					}
				}
			}
		}
		else if(_type == "month") {
			if(type == "month") {
				if(start.month >= _start.month) {
					if(end != null && _end != null && end.month <= _end.month) {
						result = true;
					}
					else if(end == null && ((_end != null && start.month <= _end.month) || start.month == _start.month)) {
						result = true;
					}
				}
			}
		}
		
		return result;
	};
	
//INIT
	_init();
},



/**
 * Class OpeningHoursBuilder, creates opening_hours value from date range object
 */
OpeningHoursBuilder: function() {
//OTHER METHODS
	/**
	 * Parses several date ranges to create an opening_hours string
	 * @param dateRanges The date ranges to parse
	 * @return The opening_hours string
	 */
	this.build = function(dateRanges) {
		var dateRange;
		var result = "", resIntv;
		
		//Read each date range
		for(var rangeId=0, l=dateRanges.length; rangeId < l; rangeId++) {
			dateRange = dateRanges[rangeId];
			if(dateRange != undefined) {
				resIntv = "";
				if(dateRange.definesTypicalWeek()) {
					resIntv += _buildWeek(dateRange.getTypical(), dateRange.getTimeSelector());
				}
				else if(dateRange.definesTypicalDay()) {
					resIntv += _buildDay(dateRange.getTypical(), dateRange.getTimeSelector());
				}
				
				//Add to result if something was returned by subparsers
				if(resIntv.length > 0) {
					if(result.length > 0) { result += "; "; }
					result += resIntv;
				}
			}
		}
		
		return result;
	};
	
	/**
	 * Reads a day to create an opening_hours string
	 * @param day The day object to read
	 * @param wideSelector A wide time selector to add (for example Jan-Mar)
	 * @return The opening_hours string
	 */
	function _buildDay(day, wideSelector) {
		var intervals = day.getIntervals(true);
		var interval;
		var result = "";
		
		if(wideSelector == "PH" || wideSelector == "SH" || wideSelector == "easter") { wideSelector += " "; }
		else { if(wideSelector.length > 0) { wideSelector += ": "; } }
		
		for(var i=0, l=intervals.length; i < l; i++) {
			interval = intervals[i];
			
			if(interval != undefined) {
				if(result.length > 0) { result += ", "; }
				result += _timeString(interval.getFrom())+"-"+_timeString(interval.getTo());
			}
		}
		
		return (result.length == 0) ? wideSelector+"off" : wideSelector+result;
	};
	
	/**
	 * Reads a week to create an opening_hours string
	 * Algorithm inspired by OpeningHoursEdit plugin for JOSM
	 * @param week The week object to read
	 * @param wideSelector A wide time selector to add (for example Jan-Mar)
	 * @return The opening_hours string
	 */
	function _buildWeek(week, wideSelector) {
		var intervals = week.getIntervals(true);
		var days = [];
		var daysStr = [];
		
		if(wideSelector == "PH" || wideSelector == "SH" || wideSelector == "easter") { wideSelector += " "; }
		else { if(wideSelector.length > 0) { wideSelector += ": "; } }
		
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
				if(interval.getStartDay() == YoHours.model.DAYS_MAX && interval.getEndDay() == YoHours.model.DAYS_MAX && interval.getTo() == YoHours.model.MINUTES_MAX) {
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
				
				for(var j = i + 1; j < days.length; j++) {
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
				result += wideSelector+add;
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
			result += "; "+wideSelector+resOff+" off";
		}
		
		/*
		 * Special cases
		 */
		//All week with same hours
		if(/^Mo\-Su \d{2}/.test(result.substr(wideSelector.length))) {
			result = wideSelector+result.substr(wideSelector.length+6);
		}
		
		// 24/7
		if(result == wideSelector+"00:00-24:00") {
			result = wideSelector+"24/7";
		}
		
		//Never opened and not full year
		if(result == "" && wideSelector != "") {
			result = wideSelector+"off";
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
},



/**
 * Class OpeningHoursParser, creates DateRange/Week/Day objects from opening_hours string
 * Based on a subpart of grammar defined at http://wiki.openstreetmap.org/wiki/Key:opening_hours/specification
 */
OpeningHoursParser: function() {
//CONSTANTS
	var RGX_RULE_MODIFIER = /^(open|closed|off)$/i;
	var RGX_WEEK_KEY = /^week$/;
	var RGX_WEEK_VAL = /^([01234]?[0-9]|5[0123])(\-([01234]?[0-9]|5[0123]))?(,([01234]?[0-9]|5[0123])(\-([01234]?[0-9]|5[0123]))?)*\:?$/;
	var RGX_MONTH = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))?\:?$/;
	var RGX_MONTHDAY = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([012]?[0-9]|3[01])(\-((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?([012]?[0-9]|3[01]))?\:?$/;
	var RGX_TIME = /^(([01]?[0-9]|2[01234])\:[012345][0-9](\-([01]?[0-9]|2[01234])\:[012345][0-9])?(,([01]?[0-9]|2[01234])\:[012345][0-9](\-([01]?[0-9]|2[01234])\:[012345][0-9])?)*)|(24\/7)$/;
	var RGX_WEEKDAY = /^(((Mo|Tu|We|Th|Fr|Sa|Su)(\-(Mo|Tu|We|Th|Fr|Sa|Su))?)|(PH|SH|easter))(,(((Mo|Tu|We|Th|Fr|Sa|Su)(\-(Mo|Tu|We|Th|Fr|Sa|Su))?)|(PH|SH|easter)))*$/;
	var RGX_HOLIDAY = /^(PH|SH|easter)$/;
	var RGX_WD = /^(Mo|Tu|We|Th|Fr|Sa|Su)(\-(Mo|Tu|We|Th|Fr|Sa|Su))?$/;

//OTHER METHODS
	/**
	 * Parses the given opening_hours string
	 * @param oh The opening_hours string
	 * @return An array of date ranges
	 */
	this.parse = function(oh) {
		var result = [];
		
		//Separate each block
		var blocks = oh.split(';');
		
		/*
		 * Blocks parsing
		 * Each block can be divided in three parts: wide range selector, small range selector, rule modifier.
		 * The last two are simpler to parse, so we start to read rule modifier, then small range selector.
		 * All the lasting tokens are part of wide range selector.
		 */
		
		var block, tokens, currentToken, ruleModifier, timeSelector, weekdaySelector, wideRangeSelector;
		var singleTime, from, to, times;
		var singleWeekday, wdStart, wdEnd, holidays, weekdays;
		var monthSelector, weekSelector, weeks, singleWeek, weekFrom, weekTo, singleMonth, months, monthFrom, monthTo;
		var dateRanges, dateRange, drObj, foundDateRange, resDrId;
		
		//Read each block
		for(var i=0, li=blocks.length; i < li; i++) {
			block = blocks[i];
			tokens = _tokenize(block);
			currentToken = tokens.length - 1;
			ruleModifier = null;
			timeSelector = null;
			weekdaySelector = null;
			wideRangeSelector = null;
			
			//console.log(tokens);
			
			/*
			 * Rule modifier (open, closed, off)
			 */
			if(currentToken >= 0 && _isRuleModifier(tokens[currentToken])) {
				//console.log("rule modifier",tokens[currentToken]);
				ruleModifier = tokens[currentToken].toLowerCase();
				currentToken--;
			}
			
			/*
			 * Small range selectors
			 */
			from = null;
			to = null;
			times = []; //Time intervals in minutes
			
			//Time selector
			if(currentToken >= 0 && _isTime(tokens[currentToken])) {
				timeSelector = tokens[currentToken];
				
				if(timeSelector == "24/7") {
					times.push({from: 0, to: 24*60});
				}
				else {
					//Divide each time interval
					timeSelector = timeSelector.split(',');
					for(var ts=0, tsl = timeSelector.length; ts < tsl; ts++) {
						//Separate start and end values
						singleTime = timeSelector[ts].split('-');
						from = _asMinutes(singleTime[0]);
						if(singleTime.length > 1) {
							to = _asMinutes(singleTime[1]);
						}
						else {
							to = from;
						}
						times.push({from: from, to: to});
					}
				}
				
				currentToken--;
			}
			
			holidays = [];
			weekdays = [];
			
			//Weekday selector
			if(timeSelector == "24/7") {
				weekdays.push({from: 0, to: 6});
			}
			else if(currentToken >= 0 && _isWeekday(tokens[currentToken])) {
				weekdaySelector = tokens[currentToken];
				
				//Divide each weekday
				weekdaySelector = weekdaySelector.split(',');
				
				for(var wds=0, wdsl = weekdaySelector.length; wds < wdsl; wds++) {
					singleWeekday = weekdaySelector[wds];
					
					//Holiday
					if(RGX_HOLIDAY.test(singleWeekday)) {
						holidays.push(singleWeekday);
					}
					//Weekday interval
					else if(RGX_WD.test(singleWeekday)) {
						singleWeekday = singleWeekday.split('-');
						wdFrom = YoHours.model.OSM_DAYS.indexOf(singleWeekday[0]);
						if(singleWeekday.length > 1) {
							wdTo = YoHours.model.OSM_DAYS.indexOf(singleWeekday[1]);
						}
						else {
							wdTo = wdFrom;
						}
						weekdays.push({from: wdFrom, to: wdTo});
					}
					else {
						throw new Error("Invalid weekday interval: "+singleWeekday);
					}
				}
				
				currentToken--;
			}
			
			/*
			 * Wide range selector
			 */
			weeks = [];
			months = [];
			
			if(currentToken >= 0) {
				wideRangeSelector = tokens[0];
				for(var ct=1; ct <= currentToken; ct++) {
					wideRangeSelector += " "+tokens[ct];
				}
				
				if(wideRangeSelector.length > 0) {
					wideRangeSelector = wideRangeSelector.replace(/\:$/g, '').split('week'); //0 = Month or SH, 1 = weeks
					
					//Month or SH
					monthSelector = wideRangeSelector[0].trim();
					if(monthSelector.length == 0) { monthSelector = null; }
					
					//Weeks
					if(wideRangeSelector.length > 1) {
						weekSelector = wideRangeSelector[1].trim();
						if(weekSelector.length == 0) { weekSelector = null; }
					}
					else { weekSelector = null; }
					
					if(monthSelector != null && weekSelector != null) {
						throw new Error("Unsupported simultaneous month and week selector");
					}
					else if(monthSelector != null) {
						monthSelector = monthSelector.split(',');
						
						for(var ms=0, msl = monthSelector.length; ms < msl; ms++) {
							singleMonth = monthSelector[ms];
							
							//School holidays
							if(singleMonth == "SH") {
								months.push({holiday: "SH"});
							}
							//Month intervals
							else if(RGX_MONTH.test(singleMonth)) {
								singleMonth = singleMonth.split('-');
								monthFrom = YoHours.model.OSM_MONTHS.indexOf(singleMonth[0])+1;
								if(singleMonth.length > 1) {
									monthTo = YoHours.model.OSM_MONTHS.indexOf(singleMonth[1])+1;
								}
								else {
									monthTo = null;
								}
								months.push({from: monthFrom, to: monthTo});
							}
							//Monthday intervals
							else if(RGX_MONTHDAY.test(singleMonth)) {
								singleMonth = singleMonth.replace(/\:/g, '').split('-');
								
								//Read monthday start
								monthFrom = singleMonth[0].split(' ');
								monthFrom = { day: parseInt(monthFrom[1]), month: YoHours.model.OSM_MONTHS.indexOf(monthFrom[0])+1 };
								
								if(singleMonth.length > 1) {
									monthTo = singleMonth[1].split(' ');
									
									//Same month as start
									if(monthTo.length == 1) {
										monthTo = { day: parseInt(monthTo[0]), month: monthFrom.month };
									}
									//Another month
									else {
										monthTo = { day: parseInt(monthTo[1]), month: YoHours.model.OSM_MONTHS.indexOf(monthTo[0])+1 };
									}
								}
								else {
									monthTo = null;
								}
								months.push({fromDay: monthFrom, toDay: monthTo});
							}
							//Unsupported
							else {
								throw new Error("Unsupported month selector: "+singleMonth);
							}
						}
					}
					else if(weekSelector != null) {
						//Divide each week interval
						weekSelector = weekSelector.split(',');
						
						for(var ws=0, wsl = weekSelector.length; ws < wsl; ws++) {
							singleWeek = weekSelector[ws].split('-');
							weekFrom = parseInt(singleWeek[0]);
							if(singleWeek.length > 1) {
								weekTo = parseInt(singleWeek[1]);
							}
							else {
								weekTo = null;
							}
							weeks.push({from: weekFrom, to: weekTo});
						}
					}
				}
			}
			
// 			console.log("months",months);
// 			console.log("weeks",weeks);
// 			console.log("holidays",holidays);
// 			console.log("weekdays",weekdays);
// 			console.log("times",times);
// 			console.log("rule",ruleModifier);
			
			/*
			 * Create date ranges
			 */
			dateRanges = [];
			
			//Month range
			if(months.length > 0) {
				for(var mId=0, ml = months.length; mId < ml; mId++) {
					singleMonth = months[mId];
					
					if(singleMonth.holiday != undefined) {
						dateRanges.push({ start: { holiday: singleMonth.holiday }});
					}
					else if(singleMonth.fromDay != undefined) {
						dateRange = { start: singleMonth.fromDay };
						if(singleMonth.toDay != null) {
							dateRange.end = singleMonth.toDay;
						}
						dateRanges.push(dateRange);
					}
					else {
						dateRange = { start: { month: singleMonth.from }};
						if(singleMonth.to != null) {
							dateRange.end = { month: singleMonth.to };
						}
						dateRanges.push(dateRange);
					}
				}
			}
			//Week range
			else if(weeks.length > 0) {
				for(var wId=0, wl = weeks.length; wId < wl; wId++) {
					dateRange = { start: { week: weeks[wId].from } };
					if(weeks[wId].to != null) {
						dateRange.end = { week: weeks[wId].to };
					}
					dateRanges.push(dateRange);
				}
			}
			//Holiday range
			else if(holidays.length > 0) {
				for(var hId=0, hl = holidays.length; hId < hl; hId++) {
					dateRanges.push({ start: { holiday: holidays[hId] } });
				}
			}
			//Full year range
			else {
				dateRanges.push({ start: {}, end: null });
			}
			
			//Case of no weekday defined = all week
			if(weekdays.length == 0) {
				if(holidays.length == 0) {
					weekdays.push({from: 0, to: YoHours.model.OSM_DAYS.length -1 });
				}
				else {
					weekdays.push({from: 0, to: 0 });
				}
			}
			
			//Case of no time defined = all day
			if(times.length == 0) {
				times.push({from: 0, to: 24*60});
			}
			
			/*
			 * Create date range objects
			 */
			for(var drId = 0, drl=dateRanges.length; drId < drl; drId++) {
				/*
				 * Find an already defined date range or create new one
				 */
				foundDateRange = false;
				resDrId=0;
				while(resDrId < result.length && !foundDateRange) {
					if(result[resDrId].isSameRange(dateRanges[drId].start, dateRanges[drId].end)) {
						foundDateRange = true;
					}
					else {
						resDrId++;
					}
				}
				
				if(foundDateRange) {
					drObj = result[resDrId];
				}
				else {
					drObj = new YoHours.model.DateRange(dateRanges[drId].start, dateRanges[drId].end);
					
					//Find general date range that may be refined by this one
					var general = -1;
					for(resDrId=0; resDrId < result.length; resDrId++) {
						if(result[resDrId].isGeneralFor(dateRanges[drId].start, dateRanges[drId].end)) {
							general = resDrId;
						}
					}
					
					//Copy general date range intervals
					if(general >= 0 && drObj.definesTypicalWeek()) {
						drObj.getTypical().copyIntervals(result[general].getTypical().getIntervals());
					}
					
					result.push(drObj);
				}
				
				/*
				 * Add time intervals
				 */
				//For each weekday
				for(var wdId=0, wdl=weekdays.length; wdId < wdl; wdId++) {
					//Remove overlapping days
					for(var wdRm=weekdays[wdId].from; wdRm <= weekdays[wdId].to; wdRm++) {
						if(drObj.definesTypicalWeek()) {
							drObj.getTypical().removeIntervalsDuringDay(wdRm);
						}
						else {
							drObj.getTypical().clearIntervals();
						}
					}
					
					//For each time interval
					for(var tId=0, tl=times.length; tId < tl; tId++) {
						if(ruleModifier == "closed" || ruleModifier == "off") {
							_removeInterval(drObj.getTypical(), weekdays[wdId], times[tId]);
						}
						else {
							_addInterval(drObj.getTypical(), weekdays[wdId], times[tId]);
						}
					}
				}
			}
		}
		
		return result;
	};

	/**
	 * Remove intervals from given typical day/week
	 * @param typical The typical day or week
	 * @param weekdays The concerned weekdays
	 * @param times The concerned times
	 */
	function _removeInterval(typical, weekdays, times) {
		for(var wd=weekdays.from; wd <= weekdays.to; wd++) {
			//Interval during day
			if(times.to >= times.from) {
				typical.removeInterval(
					new YoHours.model.Interval(wd, wd, times.from, times.to)
				);
			}
			//Interval during night
			else {
				//Everyday except sunday
				if(wd < 6) {
					typical.removeInterval(
						new YoHours.model.Interval(wd, wd+1, times.from, times.to)
					);
				}
				//Sunday
				else {
					typical.removeInterval(
						new YoHours.model.Interval(wd, wd, times.from, 24*60)
					);
					typical.removeInterval(
						new YoHours.model.Interval(0, 0, 0, times.to)
					);
				}
			}
		}
	};
	
	/**
	 * Adds intervals from given typical day/week
	 * @param typical The typical day or week
	 * @param weekdays The concerned weekdays
	 * @param times The concerned times
	 */
	function _addInterval(typical, weekdays, times) {
		for(var wd=weekdays.from; wd <= weekdays.to; wd++) {
			//Interval during day
			if(times.to >= times.from) {
				typical.addInterval(
					new YoHours.model.Interval(wd, wd, times.from, times.to)
				);
			}
			//Interval during night
			else {
				//Everyday except sunday
				if(wd < 6) {
					typical.addInterval(
						new YoHours.model.Interval(wd, wd+1, times.from, times.to)
					);
				}
				//Sunday
				else {
					typical.addInterval(
						new YoHours.model.Interval(wd, wd, times.from, 24*60)
					);
					typical.addInterval(
						new YoHours.model.Interval(0, 0, 0, times.to)
					);
				}
			}
		}
	};
	
	/**
	 * Converts a time string "12:45" into minutes integer
	 * @param time The time string
	 * @return The amount of minutes since midnight
	 */
	function _asMinutes(time) {
		var values = time.split(':');
		return parseInt(values[0]) * 60 + parseInt(values[1]);
	};
	
	/**
	 * Is the given token a weekday selector ?
	 */
	function _isWeekday(token) {
		return RGX_WEEKDAY.test(token);
	};
	
	/**
	 * Is the given token a time selector ?
	 */
	function _isTime(token) {
		return RGX_TIME.test(token);
	};
	
	/**
	 * Is the given token a rule modifier ?
	 */
	function _isRuleModifier(token) {
		return RGX_RULE_MODIFIER.test(token);
	};
	
	/**
	 * Create tokens for a given block
	 */
	function _tokenize(block) {
		var result = block.trim().split(' ');
		var position = $.inArray("", result);
		while( ~position ) {
			result.splice(position, 1);
			position = $.inArray("", result);
		}
		return result;
	};
}

};
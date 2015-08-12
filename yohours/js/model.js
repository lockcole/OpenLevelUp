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
				result = YoHours.model.OSM_MONTHS[_start.month-1]+" "+_start.day;
				if(_end != null) {
					//Same month as start ?
					if(_start.month == _end.month) {
						result += "-"+_end.day;
					}
					else {
						result += "-"+YoHours.model.OSM_MONTHS[_end.month-1]+" "+_end.day;
					}
				}
				break;

			case "week":
				result = "week "+_start.week;
				if(_end != null) {
					result += "-"+_end.week;
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
	 * @param dateRange another date range
	 * @return True if same time selector
	 */
	this.isSameRange = function(dateRange) {
		return this.getTimeSelector() == dateRange.getTimeSelector();
	};
	
//INIT
	_init();
},



/**
 * Class OpeningHoursParser, creates opening_hours value from week object
 */
OpeningHoursParser: function() {
//OTHER METHODS
	/**
	 * Parses several date ranges to create an opening_hours string
	 * @param dateRanges The date ranges to parse
	 * @return The opening_hours string
	 */
	this.parse = function(dateRanges) {
		var dateRange;
		var result = "", resIntv;
		
		//Read each date range
		for(var rangeId=0, l=dateRanges.length; rangeId < l; rangeId++) {
			dateRange = dateRanges[rangeId];
			if(dateRange != undefined) {
				resIntv = "";
				if(dateRange.definesTypicalWeek()) {
					resIntv += _parseWeek(dateRange.getTypical(), dateRange.getTimeSelector());
				}
				else if(dateRange.definesTypicalDay()) {
					resIntv += _parseDay(dateRange.getTypical(), dateRange.getTimeSelector());
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
	 * Parses a day to create an opening_hours string
	 * @param day The day object to parse
	 * @param wideSelector A wide time selector to add (for example Jan-Mar)
	 * @return The opening_hours string
	 */
	function _parseDay(day, wideSelector) {
		var intervals = day.getIntervals(true);
		var interval;
		var result = "";
		wideSelector = (wideSelector.length > 0) ? wideSelector+": " : "";
		
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
	 * Parses a week to create an opening_hours string
	 * Algorithm inspired by OpeningHoursEdit plugin for JOSM
	 * @param week The week object to parse
	 * @param wideSelector A wide time selector to add (for example Jan-Mar)
	 * @return The opening_hours string
	 */
	function _parseWeek(week, wideSelector) {
		var intervals = week.getIntervals(true);
		var days = [];
		var daysStr = [];
		wideSelector = (wideSelector.length > 0) ? wideSelector+": " : "";
		
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
		// 24/7
		if(result == wideSelector+"Mo-Su 00:00-24:00") {
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
}

};
/*
 * This file is part of YoHours.
 * 
 * YoHours is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * YoHours is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with YoHours.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * YoHours
 * Web interface to make opening hours data for OpenStreetMap the easy way
 * Author: Adrien PAVIE
 *
 * Controller JS classes
 */

/**
 * The main controller of YoHours
 */
var MainController = function() {
//ATTRIBUTES
	/** Main view object **/
	this._view = new MainView(this);

	/** All the wide intervals defined **/
	this._dateRanges = [ new DateRange() ];
	
	/** The opening hours builder **/
	this._builder = new OpeningHoursBuilder();

	/** The opening hours parser **/
	this._parser = new OpeningHoursParser();
};

//ACCESSORS
	/**
	 * @return The opening_hours value
	 */
	MainController.prototype.getOpeningHours = function() {
		return this._builder.build(this._dateRanges);
	};
	
	/**
	 * @return The main view
	 */
	MainController.prototype.getView = function() {
		return this._view;
	};
	
	/**
	 * @return The date ranges array, some may be undefined
	 */
	MainController.prototype.getDateRanges = function() {
		return this._dateRanges;
	};
	
	/**
	 * @return The first defined date range
	 */
	MainController.prototype.getFirstDateRange = function() {
		var i = 0, found = false;
		while(i < this._dateRanges.length && !found) {
			if(this._dateRanges[i] != undefined) {
				found = true;
			}
			else {
				i++;
			}
		}
		
		//If no date range found, create a new one
		if(!found) {
			this._dateRanges = [ new DateRange() ];
			i = 0;
		}
		
		return this._dateRanges[i];
	};

//OTHER METHODS
	/**
	 * Initializes the controller
	 */
	MainController.prototype.init = function() {
		this._view.init();
	};
	
	/**
	 * Initializes the controller in minimal mode (iframe)
	 */
	MainController.prototype.initMinimal = function() {
		this._view.init(true);
	};

	/**
	 * Clear all defined data
	 */
	MainController.prototype.clear = function() {
		this._dateRanges = [ new DateRange() ];
		this._view.getCalendarView().show(this._dateRanges[0]);
		this._view.refresh();
	};
	
	/**
	 * Adds a new date range
	 * @param start The start time of this range
	 * @param end The end time
	 * @param copyIntervals The intervals to copy (or null if create new void range)
	 * @return The created range
	 */
	MainController.prototype.newRange = function(start, end, copyIntervals) {
		copyIntervals = copyIntervals || null;
		var range = new DateRange(start, end);
		
		if(copyIntervals != null) {
			range.getTypical().copyIntervals(copyIntervals);
		}
		
		this._dateRanges.push(range);
		this._view.refresh();
		return range;
	};
	
	/**
	 * Deletes the currently shown date range
	 */
	MainController.prototype.deleteCurrentRange = function() {
		var range = this._view.getCalendarView().getDateRange();
		var found = false, l = this._dateRanges.length, i=0;
		
		while(i < l && !found) {
			if(this._dateRanges[i] === range) {
				found = true;
				this._dateRanges[i] = undefined;
			}
			else {
				i++;
			}
		}
		
		//Refresh calendar
		this._view.getCalendarView().show(this.getFirstDateRange());
		this._view.refresh();
	};
	
	/**
	 * Displays the given opening hours
	 * @param str The opening hours to show
	 */
	MainController.prototype.showHours = function(str) {
		if(str.length > 0) {
			//Clear intervals
			this._week = new Week();
			$('#calendar').fullCalendar('removeEvents');
			
			//Parse given string
			try {
				this._dateRanges = this._parser.parse(str.trim());
				this._view.getCalendarView().show(this._dateRanges[0]);
				this._view.getHoursInputView().setValid(true);
			}
			catch(e) {
				console.error(e);
				
				//Show error
				var ohTest;
				try {
					new opening_hours(str.trim(), null);
					ohTest = true;
				}
				catch(e2) {
					console.error(e2);
					ohTest = false;
				}
				
				this._view.getHoursInputView().setValid(false, ohTest);
			}
			
			this._view.getHoursInputView().setValue(str);
		}
	};

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

	/** The typical week **/
	var _week = new YoHours.model.Week();
	
	/** The opening hours parser **/
	var _parser = new YoHours.model.OpeningHoursParser();

	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The current week
	 */
	this.getWeek = function() {
		return _week;
	}
	
	/**
	 * @return The opening_hours value
	 */
	this.getOpeningHours = function() {
		return _parser.parse(_week);
	};
	
	/**
	 * @return The main view
	 */
	this.getView = function() {
		return _view;
	};

//OTHER METHODS
	/**
	 * Initializes the controller
	 */
	this.init = function() {
		_view.init();
	}

	/**
	 * Event handler, to add the current interval in week
	 * @param interval The new interval
	 * @return The interval ID
	 */
	this.newInterval = function(interval) {
		var intervalId = _week.addInterval(interval);
		_view.refresh();
		return intervalId;
	};
	
	/**
	 * Edits the given interval
	 * @param id The interval ID
	 * @param interval The new interval
	 */
	this.editInterval = function(id, interval) {
		_week.editInterval(id, interval);
		_view.refresh();
	};
	
	/**
	 * Event handler, to remove the given interval from week
	 * @param intervalId The interval ID
	 */
	this.removeInterval = function(intervalId) {
		_week.removeInterval(intervalId);
		_view.refresh();
	};
	
	/**
	 * Removes all the shown intervals
	 */
	this.clearIntervals = function() {
		_week = new YoHours.model.Week();
		$('#calendar').fullCalendar('removeEvents');
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
			var oh = new opening_hours(str);
			var intervals = oh.getOpenIntervals(getMonday(), getSunday());
			
			//Add read intervals to week
			var interval;
			for(var i =0; i < intervals.length; i++) {
				interval = intervals[i];
				
				//Add event to week intervals
				var weekId = this.newInterval(
					new YoHours.model.Interval(
						swDayToMwDay(interval[0].getDay()),
						swDayToMwDay(interval[1].getDay()),
						interval[0].getHours() * 60 + interval[0].getMinutes(),
						interval[1].getHours() * 60 + interval[1].getMinutes()
					)
				);
				
				//Add event on calendar
				var eventData = {
					id: weekId,
					start: moment(interval[0]),
					end: moment(interval[1])
				};
				$('#calendar').fullCalendar('renderEvent', eventData, true);
			}
			
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
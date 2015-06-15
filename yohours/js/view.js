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
 * View JS classes
 */
YoHours.view = {
/*
 * ========= CONSTANTS =========
 */

/*
 * ========== CLASSES ==========
 */
/**
 * WeekView, view class for week display
 * @param mainView The main view
 */
WeekView: function(mainView) {
//ATTRIBUTES
	/** The mainview object **/
	var _mainView = mainView;
	
	/** This object **/
	var _self = this;

//OTHER METHODS
	/**
	 * Refreshes the view
	 * @param week The week to display
	 */
	this.refresh = function(week) {
	};
	
	/**
	 * Add an interval
	 */
	this.addInterval = function(intervalId, week) {
		//Add new interval in list
		$("#intervals_list").append(
			"<li id=\"val_"+intervalId+"\">"+YoHours.model.IRL_DAYS[week.getIntervals()[intervalId].getDay()]
			+" "+ minToHourMin(week.getIntervals()[intervalId].getFrom())
			+" - "+ minToHourMin(week.getIntervals()[intervalId].getTo())
			+" <small><a href=\"#\" id=\"rm_"+intervalId+"\">Remove</a></small></li>");
		
		$("#rm_"+intervalId).click(function() {
			$("#val_"+intervalId).remove();
			controller.removeInterval(intervalId);
		});
	};
},

/**
 * IntervalSliderView, view class for interval slider management
 * @param mainView The main view
 */
IntervalSliderView: function(mainView) {
//ATTRIBUTES
	/** The mainview object **/
	var _mainView = mainView;
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The current day value
	 */
	this.getDay = function() {
		return $("#day").val();
	};
	
	/**
	 * @return The current minute start value
	 */
	this.getFrom = function() {
		return $("#slider-range").slider("values", 0);
	};
	
	/**
	 * @return The current minute end value
	 */
	this.getTo = function() {
		return $("#slider-range").slider("values", 1);
	};

//MODIFIERS
	/**
	 * Edit the current value
	 * @param day The day to display
	 * @param from The minute start value
	 * @param to The minute end value
	 */
	this.set = function(day, from, to) {
		$("#day").val(day);
		$("#slider-range").slider({
			range: true,
			min: 0,
			max: 24*60,
			step: 5,
			values: [ from, to ],
			slide: function( event, ui ) {
				_self.updateHours(ui.values[0], ui.values[1]);
			}
		});
		_self.updateHours($("#slider-range").slider("values", 0), $("#slider-range").slider("values", 1));
	};

//OTHER METHODS
	/**
	 * Updates the hours field in page
	 * @param minStart The start hour (in minutes since midnight)
	 * @param minEnd The end hour (in minutes since midnight)
	 */
	this.updateHours = function(minStart, minEnd) {
		$("#hours_start").html(minToHourMin(minStart));
		$("#hours_end").html(minToHourMin(minEnd));
	};

//CONSTRUCTOR
	_self.set(0, 8*60, 12*60);
},

/**
 * MainView, view class for the main page
 * @param ctrl The MainController
 */
MainView: function(ctrl) {
//ATTRIBUTES
	/** The application controller **/
	var _ctrl = ctrl;
	
	/** The week view **/
	var _weekView = new YoHours.view.WeekView(this);
	
	/** The slider view **/
	var _sliderView = new YoHours.view.IntervalSliderView(this);
	
	/** This object **/
	var _self = this;

//OTHER METHODS
	/**
	 * Refreshes the view
	 */
	this.refresh = function() {
		_weekView.refresh(_ctrl.getWeek());
		$("#oh").val(_ctrl.getOpeningHours());
	};
	
	/**
	 * Get the currently edited interval
	 * @return The interval
	 */
	this.getCurrentInterval = function() {
		return new YoHours.model.Interval(_sliderView.getDay(), _sliderView.getFrom(), _sliderView.getTo());
	};
	
	/**
	 * Add an interval
	 */
	this.addInterval = function(intervalId, week) {
		_weekView.addInterval(intervalId, week);
	};
	
	/**
	 * Initializes the view
	 */
	this.init = function() {
		$("#new_interval").click(controller.newInterval);
		$("#oh").val("");
	};
}

};
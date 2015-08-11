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
 * ========== CLASSES ==========
 */
/**
 * WeekView, view class for week display
 * @param mainView The main view
 */
// WeekView: function(mainView) {
// //ATTRIBUTES
	// /** The mainview object **/
	// var _mainView = mainView;
	
	// /** This object **/
	// var _self = this;

// //OTHER METHODS
	// this.init = function() {
		// $("#calendar").fullCalendar({
			// header: {
				// left: '',
				// center: '',
				// right: ''
			// },
			// defaultView: 'agendaWeek',
			// editable: true,
			// columnFormat: 'dddd',
			// timeFormat: 'HH:mm',
			// axisFormat: 'HH:mm',
			// allDayText: '24/24',
			// slotDuration: '00:15:00',
			// firstDay: 1,
			// eventOverlap: false,
			// selectable: true,
			// selectHelper: true,
			// selectOverlap: false,
			// select: function(start, end) {
				// //Add event to week intervals
				// var minStart = parseInt(start.format("H")) * 60 + parseInt(start.format("m"));
				// var minEnd = parseInt(end.format("H")) * 60 + parseInt(end.format("m"));
				// var weekId = controller.newInterval(
					// new YoHours.model.Interval(
						// swDayToMwDay(start.format("d")),
						// swDayToMwDay(end.format("d")),
						// minStart,
						// minEnd
					// )
				// );
				
				// //Add event on calendar
				// eventData = {
					// id: weekId,
					// start: start,
					// end: end
				// };
				// $('#calendar').fullCalendar('renderEvent', eventData, true);
			// },
			// eventClick: function(calEvent, jsEvent, view) {
				// controller.removeInterval(calEvent._id);
				// $('#calendar').fullCalendar('removeEvents', calEvent._id);
			// },
			// eventResize: function(event, delta, revertFunc, jsEvent, ui, view) {
				// var minStart = parseInt(event.start.format("H")) * 60 + parseInt(event.start.format("m"));
				// var minEnd = parseInt(event.end.format("H")) * 60 + parseInt(event.end.format("m"));
				// controller.editInterval(
					// event.id,
					// new YoHours.model.Interval(
						// swDayToMwDay(event.start.format("d")),
						// swDayToMwDay(event.end.format("d")),
						// minStart,
						// minEnd
					// )
				// );
			// },
			// eventDrop: function(event, delta, revertFunc, jsEvent, ui, view) {
				// var minStart = parseInt(event.start.format("H")) * 60 + parseInt(event.start.format("m"));
				// var minEnd = parseInt(event.end.format("H")) * 60 + parseInt(event.end.format("m"));
				// controller.editInterval(
					// event.id,
					// new YoHours.model.Interval(
						// swDayToMwDay(event.start.format("d")),
						// swDayToMwDay(event.end.format("d")),
						// minStart,
						// minEnd
					// )
				// );
			// }
		// });
	// };
// },



/**
 * The date range modal component
 */
DateRangeView: function(main) {
//ATTRIBUTES
	/** Is the modal shown to edit some date range ? True = edit, false = add */
	var _editMode = false;
	
	/** Date range type **/
	var _rangeType = null;
	
	/** The main view **/
	var _mainView = main;

	var _self = this;

//CONSTRUCTOR
	function _init() {
		$("#modal-range-valid").click(_self.valid);
	};

//MODIFIERS
	/**
	 * Shows the modal
	 * @param edit Edit mode ? (optional)
	 */
	this.show = function(edit) {
		_editMode = edit || false;
		
		//Reset
		$("#modal-range-nav li").removeClass("active");
		$("#modal-range-form > div").hide();
		$("#modal-range-alert").hide();
		
		//Edit interval
		if(_editMode) {
			var start = _mainView.getCalendarView().getDateRange().getStart();
			var end = _mainView.getCalendarView().getDateRange().getEnd();
			//TODO
		}
		//New wide interval
		else {
			//Set first tab as active
			$("#modal-range-nav li:first").addClass("active");
			_rangeType = $("#modal-range-nav li:first").attr("id").substr("modal-range-nav-".length);
			
			//Show associated div
			$("#modal-range-form > div:first").show();
		}
		
		$("#modal-range").modal("show");
	};
	
	/**
	 * Changes the currently shown tab
	 */
	this.tab = function(type) {
		$("#modal-range-nav li.active").removeClass("active");
		$("#modal-range-nav-"+type).addClass("active");
		$("#modal-range-form > div:visible").hide();
		$("#range-"+type).show();
		$("#modal-range-alert").hide();
		_rangeType = type;
	};
	
	/**
	 * Actions to perform when the modal was validated
	 */
	this.valid = function() {
		//Create start and end objects
		var start, end = null, startVal, endVal, startVal2, endVal2;
		
		try {
			switch(_rangeType) {
				case "month":
					//Start
					startVal = parseInt($("#range-month-start").val());
					if(isNaN(startVal)) { throw new Error("Invalid start month"); }
					start = { month: startVal };
					
					//End
					endVal = parseInt($("#range-month-end").val());
					if(!isNaN(endVal) && endVal > 0) {
						end = { month: endVal };
					}
					
					break;
				case "week":
					//Start
					startVal = parseInt($("#range-week-start").val());
					if(isNaN(startVal) || startVal < 1) { throw new Error("Invalid start week"); }
					start = { week: startVal };
					
					//End
					endVal = parseInt($("#range-week-end").val());
					if(!isNaN(endVal) && endVal > 0) {
						end = { week: endVal };
					}
					
					break;
				case "day":
					//Start
					startVal = parseInt($("#range-day-startday").val());
					if(isNaN(startVal) || startVal < 1) { throw new Error("Invalid start day"); }
					startVal2 = parseInt($("#range-day-startmonth").val());
					if(isNaN(startVal2) || startVal2 < 1) { throw new Error("Invalid start month"); }
					start = { day: startVal, month: startVal2 };
					
					//End
					endVal = parseInt($("#range-day-endday").val());
					endVal2 = parseInt($("#range-day-endmonth").val());
					if(!isNaN(endVal) && endVal > 0 && !isNaN(endVal2) && endVal2 > 0) {
						end = { day: endVal, month: endVal2 };
					}
					
					break;
				case "holiday":
					startVal = $("input[name=range-holiday-type]:checked").val();
					if(startVal != "PH" && startVal != "SH") { throw new Error("Invalid holiday type"); }
					
					break;

				case "always":
				default:
					start = {};
			}
			
			//Edit currently shown calendar
			if(_editMode) {
				_mainView.getCalendarView().getDateRange().updateRange(start, end);
			}
			//Create new calendar
			else {
				
			}
			$("#modal-range").modal("hide");
		}
		catch(e) {
			$("#modal-range-alert").show();
			$("#modal-range-alert-label").html(e);
		}
	};
	
//INIT
	_init();
},



/**
 * The calendar view, with its navigation bar
 */
CalendarView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;
	
	/** The currently shown date range **/
	var _dateRange = null;

//CONSTRUCTOR
	function _init() {
		$("#range-edit").click(function() { _mainView.getController().getView().getDateRangeView().show(true); });
	};

//ACCESSORS
	/**
	 * @return The currently shown date range
	 */
	this.getDateRange = function() {
		return _dateRange;
	};

//MODIFIERS
	/**
	 * Displays the given typical week or day
	 * @param dateRange The date range to display
	 */
	this.show = function(dateRange) {
		_dateRange = dateRange;
		
		//Week
		if(_dateRange.definesTypicalWeek()) {
			$("#calendar").fullCalendar({
				header: {
					left: '',
					center: '',
					right: ''
				},
				defaultView: 'agendaWeek',
				editable: true,
				columnFormat: 'dddd',
				timeFormat: 'HH:mm',
				axisFormat: 'HH:mm',
				allDayText: '24/24',
				slotDuration: '00:15:00',
				firstDay: 1,
				eventOverlap: false,
				selectable: true,
				selectHelper: true,
				selectOverlap: false,
				select: function(start, end) {
					//Add event to week intervals
					var minStart = parseInt(start.format("H")) * 60 + parseInt(start.format("m"));
					var minEnd = parseInt(end.format("H")) * 60 + parseInt(end.format("m"));
					var weekId = _dateRange.getTypical().addInterval(
						new YoHours.model.Interval(
							swDayToMwDay(start.format("d")),
							swDayToMwDay(end.format("d")),
							minStart,
							minEnd
						)
					);
					
					//Add event on calendar
					eventData = {
						id: weekId,
						start: start,
						end: end
					};
					$('#calendar').fullCalendar('renderEvent', eventData, true);
					
					_mainView.refresh();
				},
				eventClick: function(calEvent, jsEvent, view) {
					_dateRange.getTypical().removeInterval(calEvent._id);
					$('#calendar').fullCalendar('removeEvents', calEvent._id);
					_mainView.refresh();
				},
				eventResize: function(event, delta, revertFunc, jsEvent, ui, view) {
					var minStart = parseInt(event.start.format("H")) * 60 + parseInt(event.start.format("m"));
					var minEnd = parseInt(event.end.format("H")) * 60 + parseInt(event.end.format("m"));
					_dateRange.getTypical().editInterval(
						event.id,
						new YoHours.model.Interval(
							swDayToMwDay(event.start.format("d")),
							swDayToMwDay(event.end.format("d")),
							minStart,
							minEnd
						)
					);
					_mainView.refresh();
				},
				eventDrop: function(event, delta, revertFunc, jsEvent, ui, view) {
					var minStart = parseInt(event.start.format("H")) * 60 + parseInt(event.start.format("m"));
					var minEnd = parseInt(event.end.format("H")) * 60 + parseInt(event.end.format("m"));
					_dateRange.getTypical().editInterval(
						event.id,
						new YoHours.model.Interval(
							swDayToMwDay(event.start.format("d")),
							swDayToMwDay(event.end.format("d")),
							minStart,
							minEnd
						)
					);
					_mainView.refresh();
				}
			});
		}
		//Day
		else if(_dateRange.definesTypicalDay()) {
			
		}
		else {
			throw new Error("Invalid typical object");
		}
	};

//INIT
	_init();
},



/**
 * The opening hours text input field
 */
HoursInputView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;

	/** The input field **/
	var _field = $("#oh");
	
	/** The delay to wait before trying to parse input **/
	var _delay = 700;
	
	/** The timer **/
	var _timer;

//MODIFIERS
	/**
	 * Changes the input value
	 */
	this.setValue = function(val) {
		if(val != _field.val()) {
			_field.val(val);
		}
	};
	
	/**
	 * Sets if the contained value is correct or not
	 */
	this.setValid = function(valid) {
		if(valid) {
			$("#oh-form").removeClass("has-error");
		}
		else {
			$("#oh-form").addClass("has-error");
		}
	};
	
	this.changed = function() {
		window.clearTimeout(_timer);
		_timer = window.setTimeout(
			function() {
				_mainView.getController().showHours(_field.val());
			},
			_delay
		);
	};

//CONSTRUCTOR
	_field.bind("input propertychange", this.changed.bind(this));
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
	var _calendarView = new YoHours.view.CalendarView(this);
	
	/** The hours input view **/
	var _hoursInputView = new YoHours.view.HoursInputView(this);
	
	/** The date range modal **/
	var _dateRangeView = new YoHours.view.DateRangeView(this);
	
	/** The help dialog **/
	var _helpView;
	
	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The hours input view
	 */
	this.getHoursInputView = function() {
		return _hoursInputView;
	};
	
	/**
	 * @return The date range view
	 */
	this.getDateRangeView = function() {
		return _dateRangeView;
	};
	
	/**
	 * @return The calendar view
	 */
	this.getCalendarView = function() {
		return _calendarView;
	};
	
	/**
	 * @return The controller
	 */
	this.getController = function() {
		return _ctrl;
	};

//OTHER METHODS
	/**
	 * Initializes the view
	 */
	this.init = function() {
		_hoursInputView.setValue("");
		_calendarView.show(_ctrl.getFirstDateRange());
		
		//Init help dialog
		_helpView = $("#modal-help");
		$("#help-link").click(function() { _helpView.modal("show"); });
		
		$("#oh-clear").click(function() { _ctrl.clearIntervals(); });
	};
	
	/**
	 * Refreshes the view
	 */
	this.refresh = function() {
		_hoursInputView.setValue(_ctrl.getOpeningHours());
	};
}

};
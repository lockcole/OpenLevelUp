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
		
		//Reset navigation
		$("#modal-range-nav li").removeClass("active");
		$("#modal-range-form > div").hide();
		$("#modal-range-alert").hide();
		
		//Reset inputs
		$("#range-day-startday").val("");
		$("#range-day-startmonth").val(1);
		$("#range-day-endday").val("");
		$("#range-day-endmonth").val(0);
		$("#range-week-start").val(1);
		$("#range-week-end").val("");
		$("#range-month-start").val(1);
		$("#range-month-end").val(0);
		$("input[name=range-holiday-type]").prop("checked", false);
		$("#range-copy").hide();
		$("#range-copy-box").attr("checked", true);
		
		//Edit interval
		if(_editMode) {
			//Show modes that defines week or day only, depending of previous typical
			if(_mainView.getCalendarView().getDateRange().definesTypicalWeek()) {
				$("#modal-range-nav-always").show();
				$("#modal-range-nav-month").show();
				$("#modal-range-nav-week").show();
				$("#range-day-end").show();
				$("#range-day .text-info").hide();
				$("#range-holiday-sh").show();
				$("#range-holiday-ph").hide();
				$("#range-holiday-easter").hide();
			}
			else {
				$("#modal-range-nav-always").hide();
				$("#modal-range-nav-month").hide();
				$("#modal-range-nav-week").hide();
				$("#range-day-end").hide();
				$("#range-day .text-info").hide();
				$("#range-holiday-sh").hide();
				$("#range-holiday-ph").show();
				$("#range-holiday-easter").show();
			}
			
			var start = _mainView.getCalendarView().getDateRange().getStart();
			var end = _mainView.getCalendarView().getDateRange().getEnd();
			var type = _mainView.getCalendarView().getDateRange().getType();
			
			switch(type) {
				case "day":
					$("#range-day-startday").val(start.day);
					$("#range-day-startmonth").val(start.month);
					if(end != null) {
						$("#range-day-endday").val(end.day);
						$("#range-day-endmonth").val(end.month);
					}
					else {
						$("#range-day-endday").val("");
						$("#range-day-endmonth").val(0);
					}
					break;

				case "week":
					$("#range-week-start").val(start.week);
					if(end != null) {
						$("#range-week-end").val(end.week);
					}
					else {
						$("#range-week-end").val("");
					}
					break;

				case "month":
					$("#range-month-start").val(start.month);
					if(end != null) {
						$("#range-month-end").val(end.month);
					}
					else {
						$("#range-month-end").val(0);
					}
					break;

				case "holiday":
					$("input[name=range-holiday-type]").prop("checked", false);
					$("input[name=range-holiday-type][value="+start.holiday+"]").prop("checked", true);
					break;

				case "always":
					break;
			}
			
			$("#modal-range-nav-"+type).addClass("active");
			$("#range-"+type).show();
		}
		//New wide interval
		else {
			//Show all inputs
			$("#modal-range-nav-always").show();
			$("#modal-range-nav-month").show();
			$("#modal-range-nav-week").show();
			$("#range-day-end").show();
			$("#range-day .text-info").show();
			$("#range-holiday > div > label").show();
			
			//Set first tab as active
			$("#modal-range-nav li:first").addClass("active");
			_rangeType = $("#modal-range-nav li:first").attr("id").substr("modal-range-nav-".length);
			
			if(_rangeType != "always") {
				$("#range-copy").show();
			}
			
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
		
		if(_rangeType != "always" && !_editMode) {
			$("#range-copy").show();
		}
		else {
			$("#range-copy").hide();
		}
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
					else if(_editMode && _mainView.getCalendarView().getDateRange().definesTypicalWeek()) {
						throw new Error("Missing end day");
					}
					
					break;
				case "holiday":
					startVal = $("input[name=range-holiday-type]:checked").val();
					if(startVal != "PH" && startVal != "SH" && startVal != "easter") { throw new Error("Invalid holiday type"); }
					start = { holiday: startVal };
					
					break;

				case "always":
				default:
					start = {};
			}
			
			//Check if not overlapping another date range
			var overlap = false;
			var ranges = _mainView.getController().getDateRanges();
			var l = ranges.length, i=0;
			var generalRange = -1; //Wider date range which can be copied if needed
			
			while(i < l) {
				if(ranges[i] != undefined && ranges[i].isSameRange(start, end)) {
					throw new Error("This time range is identical to another one");
				}
				else {
					if(ranges[i] != undefined && ranges[i].isGeneralFor(start, end)) {
						generalRange = i;
					}
					i++;
				}
			}
			
			//Edit currently shown calendar
			if(_editMode) {
				_mainView.getCalendarView().getDateRange().updateRange(start, end);
				_mainView.getCalendarView().show(_mainView.getCalendarView().getDateRange());
				_mainView.refresh();
			}
			//Create new calendar
			else {
				//Copy wider date range intervals
				if($("#range-copy-box").is(":checked") && generalRange >= 0) {
					_mainView.getCalendarView().show(_mainView.getController().newRange(start, end, ranges[generalRange].getTypical().getIntervals()));
				}
				else {
					_mainView.getCalendarView().show(_mainView.getController().newRange(start, end));
				}
			}
			$("#modal-range").modal("hide");
		}
		catch(e) {
			$("#modal-range-alert").show();
			$("#modal-range-alert-label").html(e);
			console.error(e);
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
		$("#range-edit").click(function() { _mainView.getDateRangeView().show(true); });
		$("#range-delete").click(function() {
			_mainView.getController().deleteCurrentRange();
			_mainView.getCalendarView().show(_mainView.getController().getFirstDateRange());
		});
		$("#range-nav-new").click(function() { _mainView.getDateRangeView().show(false); })
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
	 * Updates the date range navigation bar
	 */
	this.updateRangeNavigationBar = function() {
		//Remove previous tabs
		$("#range-nav li.rnav").remove();
		
		//Create tabs
		var dateRanges = _mainView.getController().getDateRanges();
		var dateRange;
		var navHtml = '';
		for(var i=0, l=dateRanges.length; i < l; i++) {
			dateRange = dateRanges[i];
			if(dateRange != undefined) {
				timeName = dateRange.getTimeSelector();
				if(timeName.length == 0) { timeName = "All year"; }
				navHtml += '<li role="presentation" id="range-nav-'+i+'" class="rnav';
				if(dateRange === _dateRange) { navHtml += ' active'; }
				navHtml += '"><a onClick="controller.getView().getCalendarView().tab(\''+i+'\')">'+timeName+'</a></li>';
			}
		}
		
		//Add to DOM
		$("#range-nav").prepend(navHtml);
	};
	
	/**
	 * Updates the label showing the human readable date range
	 */
	this.updateDateRangeLabel = function() {
		$("#range-txt-label").html(_dateRange.getTimeForHumans());
	};
	
	/**
	 * Click handler for navigation tabs
	 * @param id The date range id to show
	 */
	this.tab = function(id) {
		this.show(_mainView.getController().getDateRanges()[id]);
		$("#range-nav li.active").removeClass("active");
		$("#range-nav-"+id).addClass("active");
	};
	
	/**
	 * Displays the given typical week or day
	 * @param dateRange The date range to display
	 */
	this.show = function(dateRange) {
		_dateRange = dateRange;
		$("#calendar").fullCalendar('destroy');
		
		var intervals = _dateRange.getTypical().getIntervals();
		var events = [];
		var interval, weekId, eventData, to, eventConstraint, defaultView, colFormat;
		var fctSelect, fctResize, fctDrop;
		
		/*
		 * Variables depending of the kind of typical day/week
		 */
		//Week
		if(_dateRange.definesTypicalWeek()) {
			//Create intervals array
			for(var i = 0; i < intervals.length; i++) {
				interval = intervals[i];
				
				if(interval != undefined) {
					//Single minute event
					if(interval.getStartDay() == interval.getEndDay() && interval.getFrom() == interval.getTo()) {
						to = moment().day("Monday").hour(0).minute(0).second(0).milliseconds(0).add(interval.getEndDay(), 'days').add(interval.getTo()+1, 'minutes');
					}
					else {
						to = moment().day("Monday").hour(0).minute(0).second(0).milliseconds(0).add(interval.getEndDay(), 'days').add(interval.getTo(), 'minutes');
					}
					
					//Add event on calendar
					eventData = {
						id: i,
						start: moment().day("Monday").hour(0).minute(0).second(0).milliseconds(0).add(interval.getStartDay(), 'days').add(interval.getFrom(), 'minutes'),
						end: to,
					};
					events.push(eventData);
				}
			}
			
			eventConstraint = { start: moment().day("Monday").format("YYYY-MM-DD[T00:00:00]"), end: moment().day("Monday").add(7, "days").format("YYYY-MM-DD[T00:00:00]") };
			defaultView = "agendaWeek";
			colFormat = "dddd";
			fctSelect = function(start, end) {
				//Add event to week intervals
				var minStart = parseInt(start.format("H")) * 60 + parseInt(start.format("m"));
				var minEnd = parseInt(end.format("H")) * 60 + parseInt(end.format("m"));
				var dayStart = swDayToMwDay(start.format("d"));
				var dayEnd = swDayToMwDay(end.format("d"));
				
				//All day interval
				if(minStart == 0 && minEnd == 0 && dayEnd - dayStart >= 1) {
					minEnd = YoHours.model.MINUTES_MAX;
					dayEnd--;
				}
				
				var weekId = _dateRange.getTypical().addInterval(
					new YoHours.model.Interval(
						dayStart,
						dayEnd,
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
			};
			
			fctResize = function(event, delta, revertFunc, jsEvent, ui, view) {
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
			};
			
			fctDrop = function(event, delta, revertFunc, jsEvent, ui, view) {
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
			};
		}
		//Day
		else {
			//Create intervals array
			for(var i = 0; i < intervals.length; i++) {
				interval = intervals[i];
				
				if(interval != undefined) {
					//Single minute event
					if(interval.getFrom() == interval.getTo()) {
						to = moment().hour(0).minute(0).second(0).milliseconds(0).add(interval.getTo()+1, 'minutes');
					}
					else {
						to = moment().hour(0).minute(0).second(0).milliseconds(0).add(interval.getTo(), 'minutes');
					}
					
					//Add event on calendar
					eventData = {
						id: i,
						start: moment().hour(0).minute(0).second(0).milliseconds(0).add(interval.getFrom(), 'minutes'),
						end: to
					};
					events.push(eventData);
				}
			}
			
			eventConstraint = { start: moment().format("YYYY-MM-DD[T00:00:00]"), end: moment().add(1, "days").format("YYYY-MM-DD[T00:00:00]") };
			defaultView = "agendaDay";
			colFormat = "[Day]";
			fctSelect = function(start, end) {
				//Add event to week intervals
				var minStart = parseInt(start.format("H")) * 60 + parseInt(start.format("m"));
				var minEnd = parseInt(end.format("H")) * 60 + parseInt(end.format("m"));
				var weekId = _dateRange.getTypical().addInterval(
					new YoHours.model.Interval(
						0,
						0,
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
			};
			
			fctResize = function(event, delta, revertFunc, jsEvent, ui, view) {
				var minStart = parseInt(event.start.format("H")) * 60 + parseInt(event.start.format("m"));
				var minEnd = parseInt(event.end.format("H")) * 60 + parseInt(event.end.format("m"));
				_dateRange.getTypical().editInterval(
					event.id,
					new YoHours.model.Interval(
						0,
						0,
						minStart,
						minEnd
					)
				);
				_mainView.refresh();
			};
			
			fctDrop = function(event, delta, revertFunc, jsEvent, ui, view) {
				var minStart = parseInt(event.start.format("H")) * 60 + parseInt(event.start.format("m"));
				var minEnd = parseInt(event.end.format("H")) * 60 + parseInt(event.end.format("m"));
				_dateRange.getTypical().editInterval(
					event.id,
					new YoHours.model.Interval(
						0,
						0,
						minStart,
						minEnd
					)
				);
				_mainView.refresh();
			};
		}
		
		//Create calendar
		$("#calendar").fullCalendar({
			header: {
				left: '',
				center: '',
				right: ''
			},
			defaultView: defaultView,
			editable: true,
			height: "auto",
			columnFormat: colFormat,
			timeFormat: 'HH:mm',
			axisFormat: 'HH:mm',
			allDayText: '24/24',
			slotDuration: '00:15:00',
			firstDay: 1,
			eventOverlap: false,
			events: events,
			eventConstraint: eventConstraint,
			selectable: true,
			selectHelper: true,
			selectOverlap: false,
			select: fctSelect,
			eventClick: function(calEvent, jsEvent, view) {
				_dateRange.getTypical().removeInterval(calEvent._id);
				$('#calendar').fullCalendar('removeEvents', calEvent._id);
				_mainView.refresh();
			},
			eventResize: fctResize,
			eventDrop: fctDrop
		});
		
		this.updateDateRangeLabel();
		this.updateRangeNavigationBar();
	};

//INIT
	_init();
},



/**
 * The URL manager
 */
URLView: function(main) {
//ATTRIBUTES
	/** The main view **/
	var _mainView = main;

	/** This object **/
	var _self = this;
	
//ACCESSORS
	/**
	 * @return The opening_hours value in URL, or undefined
	 */
	this.getOpeningHours = function() {
		return (_getParameters().oh != undefined) ? decodeURIComponent(_getParameters().oh) : "";
	};

//MODIFIERS
	/**
	 * Updates the URL with the given opening_hours value
	 * @param oh The new value
	 */
	this.update = function(oh) {
		var params = (oh != undefined && oh.trim().length > 0) ? "oh="+oh.trim() : "";
		var hash = this._getUrlHash();
		
		var allOptions = params + ((hash != "") ? '#' + hash : "");
		var link = this._getUrl() + ((allOptions.length > 0) ? "?" + allOptions : "" );
		
		window.history.replaceState({}, "YoHours", link);
	};

//OTHER METHODS
	/**
	 * @return The URL parameters as an object
	 */
	function _getParameters() {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		var params = new Object();
		
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			params[sParameterName[0]] = sParameterName[1];
		}
		
		return params;
	};
	
	/**
	 * @return The page base URL
	 */
	this._getUrl = function() {
		return $(location).attr('href').split('?')[0];
	};
	
	/**
	 * @return The URL hash
	 */
	this._getUrlHash = function() {
		var hash = $(location).attr('href').split('#')[1];
		return (hash != undefined) ? hash : "";
	};
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
	
	/** The URL view **/
	var _vUrl = new YoHours.view.URLView(main);
	
	/** This object **/
	var _self = this;

//CONSTRUCTOR
	function _init() {
		//Get opening_hours from URL
		var urlOh = _vUrl.getOpeningHours();
		if(urlOh != undefined) {
			_self.setValue(urlOh);
		}
		else {
			_self.setValue("");
		}
		
		//Add triggers
		_field.bind("input propertychange", _self.changed.bind(_self));
	};

//ACCESSORS
	/**
	 * @return The opening_hours value
	 */
	this.getValue = function() {
		return _field.val();
	};
	
//MODIFIERS
	/**
	 * Changes the input value
	 */
	this.setValue = function(val) {
		if(val != _field.val()) {
			_field.val(val);
			_vUrl.update(val);
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
				_field.val(_field.val().replace(/␣/gi, ' ')); //Allow to paste directly from Taginfo
				_vUrl.update(_field.val());
				_mainView.getController().showHours(_field.val());
			},
			_delay
		);
	};

//CONSTRUCTOR
	_init();
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
		var ohInputVal = _hoursInputView.getValue();
		if(ohInputVal != undefined && ohInputVal.trim() != "") {
			_ctrl.showHours(ohInputVal);
		}
		else {
			_calendarView.show(_ctrl.getFirstDateRange());
		}
		
		//Init help dialog
		_helpView = $("#modal-help");
		$("#help-link").click(function() { _helpView.modal("show"); });
		
		$("#oh-clear").click(function() { _ctrl.clear(); });
	};
	
	/**
	 * Refreshes the view
	 */
	this.refresh = function() {
		_hoursInputView.setValue(_ctrl.getOpeningHours());
	};
}

};
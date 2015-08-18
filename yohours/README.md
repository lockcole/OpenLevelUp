YoHours
=======

![YoHours logo](http://github.pavie.info/yohours/img/logo.svg)

Read-me
-------

YoHours is a web tool to create opening hours for the [OpenStreetMap](http://openstreetmap.org) project, in the famous [opening_hours](https://wiki.openstreetmap.org/wiki/Key:opening_hours) syntax. You can define when a point of interest is open in a week, and YoHours will give you the opening_hours value to set in OpenStreetMap. This tool is written in JavaScript.

A live demo is available at [github.pavie.info/yohours](http://github.pavie.info/yohours/).


Usage
-----

YoHours is simple to use. These are the basic actions you can do:

* Add an interval: drag with your mouse over the calendar
* Remove an interval: click on it
* Extend an interval: drag the "=" sign on intervals extremities


### Seasons

YoHours is now able to handle opening hours which depends of seasons. You can define hours for specific days, weeks, months or holidays. To do so, start by defining the common opening hours ("All year" tab), then refine by adding a new season (the green "+" tab) and set the opening hours on the new calendar. You can add as many seasons as you want. You can also edit or remove a season by clicking on the pencil and trash buttons, between seasons tabs and calendar.


### Supported opening_hours values

YoHours supports only a subset of the opening_hours syntax. Here are some examples of supported values.

* Basic hours: `08:00-18:00` or `08:00-12:00,14:00-18:00`
* Weekday selectors: `Mo-Fr,Su 09:00-17:00; Sa 10:00-19:00`
* Week selectors: `week 01-05: Mo,Tu 08:00-10:00; week 06-10: Mo,Tu 10:00-12:00`
* Month selectors: `Jan-Apr: We 10:00-15:00`
* Monthday selectors: `Jan 25-30,Feb 28-Apr 15: Tu 11:00-17:00`
* Holidays selectors: `PH 21:00-23:00` or `SH Mo,Tu 06:00-09:00` or `easter off`...
* Always open: `24/7`
* Any combination of the previous examples separated by semi-colons


### Unsupported opening_hours values

The elements which are present in the [opening_hours formal specification](https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification) and not listed before aren't supported. You can contact me to discuss the integration of some new elements if needed.


Developers
----------

### Installation

If you want to install your own YoHours instance, just download the content of this repository, and upload the **yohours/** folder in your own FTP or web server. That's all.


### Tests

QUnit-based tests are available in **test.html** page. For live, see [github.pavie.info/yohours/test.html](http://github.pavie.info/yohours/test.html).


License
-------

Copyright 2015 Adrien PAVIE

See LICENSE for complete GPL3 license.

YoHours is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

YoHours is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with YoHours. If not, see <http://www.gnu.org/licenses/>.
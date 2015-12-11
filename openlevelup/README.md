OpenLevelUp!
============

![OpenLevelUp! logo](http://github.pavie.info/openlevelup/img/logo.jpg)

Read-me
-------

OpenLevelUp! is a web viewer for indoor data from the [OpenStreetMap](http://openstreetmap.org) project.
It allows you to see inside buildings, level by level through your web browser. This is written in JavaScript.
The data is retrieved from OpenStreetMap using [Overpass API](http://wiki.openstreetmap.org/wiki/Overpass_API).
For more details about the project, how to contribute on indoor in OpenStreetMap, and some use cases, see [OpenLevelUp on OSM wiki](https://wiki.openstreetmap.org/wiki/OpenLevelUp).

A live demo is available at [github.pavie.info/openlevelup](http://github.pavie.info/openlevelup/).


Examples of well-mapped areas
-----------------------------

* [Shopping mall #1](http://github.pavie.info/openlevelup/?lat=48.136858&lon=-1.695054&z=18&t=0&lvl=0&tcd=1&urd=0&bdg=0&pic=0&nte=0)
* [Shopping mall #2](http://github.pavie.info/openlevelup/?lat=44.121009&lon=4.839004&z=19&t=0&lvl=0&tcd=1&urd=0&bdg=0&pic=0&nte=0)
* [Subway station](http://github.pavie.info/openlevelup/?s=m.39i+-1.IVI+U6+-1.0+0)
* [Railway station](http://github.pavie.info/openlevelup/?s=m.LZm+2.9oO+T6+-2.0+0)
* [University campus](http://github.pavie.info/openlevelup/?lat=49.010961&lon=8.414637&z=17&t=0)


Installation
------------

If you want to install your own OpenLevelUp! instance, just download the content of this repository,
and upload the **openlevelup/** folder in your own FTP or web server. That's all.

### Configuration

If you want to change some parameters, such as the Overpass API server or the available tile servers,
just edit the **config.json** file. You can also change the objects style by editing **style.json** file.


License
-------

Copyright 2015 Adrien PAVIE

See LICENSE for complete AGPL3 license.

OpenLevelUp! is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

OpenLevelUp! is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with OpenLevelUp!. If not, see <http://www.gnu.org/licenses/>.

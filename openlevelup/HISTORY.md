Changes history
===============
23 april 2015
-------------
* New icon for information=audioguide, room=checkroom
* Room=collection rendered like room=gallery
* When a room name is clicked in side panel, map zooms to max zoom -1 (instead of max zoom)
* Icons added before room names in dedicated panel
* Layer added in JSON style for some amenities which are kind of landuses (university, school, college)
* New rendering for shop/amenity (less funky)

14 april 2015
-------------
* New option to display only buildings on map

8 april 2015
------------
* Close button in central part of side panel is visible (style fix)
* Better shop=mall rendering (similar as corridors)

3 april 2015
------------
* Ignore objects out of map BBox for display, and out of data BBox for room names

30 march 2015
-------------
* Icons for tourism=artwork, artwork_type=statue|sculpture|stone|bust, room=bedroom|toilet
* Loading and about dialogs height is now correctly scaled
* Some meta markups added (SEO)
* Style improvement in order to make map clickable under invisible side panel elements

29 march 2015
-------------
* User interface design changed, more lightweight

28 march 2015
-------------
* Default leaflet fill opacity used for image export

27 march 2015
-------------
* Level export as image added

26 march 2015
-------------
* Icon added for escalators as vertical passages
* Icon added for barrier=turnstile

24 march 2015
-------------
* Minor fix for loading pop-up not closing on empty areas
* Better style for messages

23 march 2015
-------------
* Minor fix for level up and down buttons in pop-ups (levels not sorted)

22 march 2015
-------------
* Clickable room list added (with search field)
* Alert messages moved to bottom right corner of the page
* Icons on polylines now supported
* Icons on polylines with rotation also supported (oneway)
* Crypt icon edited (more generic)

20 march 2015
-------------
* Better CSS rules for side panel and footer

19 march 2015
-------------
* Better style for walls (wider and a bit darker)
* Loading pop-up hides when cluster has done loading

17 march 2015
-------------
* New icons for laboratory=physical, biology, biological, electronics, electronic
* New icon for railway=subway_entrance (more discrete)

16 march 2015
-------------
* Latitude and longitude are now bounded in URL
* Short links system added
* Loading pop-up more verbose (display loading step by step)
* Tile layer is restored when using shortlink or permalink

15 march 2015
-------------
* Opacity restored to 1 when returning to cluster zooms
* Buttons to go up and down added in pop-up titles for stairs and elevators
* Min_level and max_level tags handled in levels parsing
* Room=* rendered with icons (administration, reception, auditorium, amphitheatre, chapel, class, laboratory, computer, conference, crypt, kitchen, library, nursery, office, restaurant, sport, storage, toilets, waiting, technical)
* Closed polylines with only room=* tag rendered as polygons

12 march 2015
-------------
* Emergency stairs/exits, hedges and pillars are now rendered
* Entrances and multipolygons objects are now properly requested in Overpass API query
* Type=level relations handled, better level management
* Better style management (processed a single time only)
* "How ?" label added under title
* Setting for hiding unrendered objects added

10 march 2015
-------------
* Better buildingpart=verticalpassage handling and rendering
* Pop-up shows image if corresponding tag defined
* Link tags (image, website, contact:website, url) are shown as HTML links in pop-ups
* Object icon shown in pop-up titles
* French cadastre TMS added
* Rendering of transport platforms
* OSM link to current object in pop-ups
* Building and buildingpart/indoor elements sent to back of other objects
* Several icons added (amenity, shop, barrier, ...)
* Generic style joker for icons ( ${tag} syntax )
* Actual name of object shown in pop-up title if defined

7 march 2015
------------
* Link to openstreetmap.org added
* Link for level export in GeoJSON
* Polygons can have icons in their style definition

6 march 2015
------------
* Legacy indoor tagging schemes supported (buildingpart=*)

5 march 2015
------------
* Application entirely in MVC design pattern
* Browser URL automatically updated when map is moved
* More tile layers added, and better management of them
* Permalinks now based on latitude, longitude and zoom
* Checkbox for hiding transcendent objects added

3 march 2015
------------
* Cluster data shown on lower zooms
* Less requests made to Overpass API
* Favicon added

2nd march 2015
--------------
* Bug fix for level parameter in permalinks

1st march 2015
--------------
* LevelUp! renamed in OpenLevelUp!
* Application fully translated in english
* New icons added
* Pop-up texts based on JSON style sheet definition
* Website style improved

28 february 2015
----------------
* JSON style sheet based system
* Level parameter added in permalinks

27 february 2015
----------------
* Object styles improved

26 february 2015
----------------
* Permalinks added

22 february 2015
----------------
* Icons added on objects

18 february 2015
----------------
* First release
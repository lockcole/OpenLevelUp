/*
 * azimuth
 * https://github.com/vxtindia/azimuth
 *
 * Copyright (c) 2014 Debjeet Biswas
 * Licensed under the MIT license.
 */

/**
 * Constants
 */

// http://en.wikipedia.org/wiki/Earth_radius
// equatorial radius in meters
var RADIUS_EQUATOR = 6378137.0;

// polar radius in meters
var RADIUS_POLES = 6356752.3;

/**
 * Calculates azimuth, distance and altitude
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
function azimuth(a, b) {
  var ap, bp, dist, br, theta, azimuth, shadow, altitude;

  ap = locationToPoint(a);
  bp = locationToPoint(b);
  dist = distance(ap, bp);

  // Let's use a trick to calculate azimuth:
  // Rotate the globe so that point A looks like latitude 0, longitude 0.
  // We keep the actual radii calculated based on the oblate geoid,
  // but use angles based on subtraction.
  // Point A will be at x=radius, y=0, z=0.
  // Vector difference B-A will have dz = N/S component, dy = E/W component.

  br = rotateGlobe(b, a, bp.radius);
  theta = Math.atan2(br.z, br.y) * 180.0 / Math.PI;
  azimuth = 90.0 - theta;

  if (azimuth < 0.0) {
    azimuth += 360.0;
  }

  if (azimuth > 360.0) {
    azimuth -= 360.0;
  }

  // Calculate altitude, which is the angle above the horizon of B as seen
  // from A. Almost always, B will actually be below the horizon, so the altitude
  // will be negative.
  shadow = Math.sqrt((br.y * br.y) + (br.z * br.z));
  altitude = Math.atan2(br.x - ap.radius, shadow) * 180.0 / Math.PI;

  return { distance: dist, azimuth: azimuth, altitude: altitude };
};

/**
 * Determines radius
 *
 * @param {Number} latRadians
 * @returns {Number}
 */
function getRadius(latRadians) {
  var cos, sin, t1, t2, t3, t4;

  cos = Math.cos(latRadians);
  sin = Math.sin(latRadians);
  t1 = RADIUS_EQUATOR * RADIUS_EQUATOR * cos;
  t2 = RADIUS_POLES * RADIUS_POLES * sin;
  t3 = RADIUS_EQUATOR * cos;
  t4 = RADIUS_POLES * sin;

  return Math.sqrt((t1 * t1 + t2 * t2) / (t3 * t3 + t4 * t4));
}

/**
 * Converts lat, lng, elv to x, y, z
 *
 * @param {Object} loc
 * @returns {Object}
 */
function locationToPoint(loc) {
  var lat, lng, radius, cosLat, sinLat, cosLng, sinLng, x, y, z;

  lat = loc.lat * Math.PI / 180.0;
  lng = loc.lng * Math.PI / 180.0;
  radius = loc.elv + getRadius(lat);
  cosLng = Math.cos(lng);
  sinLng = Math.sin(lng);
  cosLat = Math.cos(lat);
  sinLat = Math.sin(lat);
  x = cosLng * cosLat * radius;
  y = sinLng * cosLat * radius;
  z = sinLat * radius;

  return { x: x, y: y, z: z, radius: radius };
}

/**
 * Calculates distance between two points in 3d space
 *
 * @param {Object} ap
 * @param {Object} bp
 * @returns {Number}
 */
function distance(ap, bp) {
  var dx, dy, dz;

  dx = ap.x - bp.x;
  dy = ap.y - bp.y;
  dz = ap.z - bp.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Gets rotated point
 *
 * @param {Object} b
 * @param {Object} a
 * @param {Number} bRadius
 * @returns {Object}
 */
function rotateGlobe(b, a, bRadius) {
  var br, brp, alat, acos, asin, bx, by, bz;

  // Get modified coordinates of 'b' by rotating the globe so
  // that 'a' is at lat=0, lng=0
  br = { lat: b.lat, lng: (b.lng - a.lng), elv:b.elv };
  brp = locationToPoint(br);

  // scale all the coordinates based on the original, correct geoid radius
  brp.x *= (bRadius / brp.radius);
  brp.y *= (bRadius / brp.radius);
  brp.z *= (bRadius / brp.radius);

  // restore actual geoid-based radius calculation
  brp.radius = bRadius;

  // Rotate brp cartesian coordinates around the z-axis by a.lng degrees,
  // then around the y-axis by a.lat degrees.
  // Though we are decreasing by a.lat degrees, as seen above the y-axis,
  // this is a positive (counterclockwise) rotation
  // (if B's longitude is east of A's).
  // However, from this point of view the x-axis is pointing left.
  // So we will look the other way making the x-axis pointing right, the z-axis
  // pointing up, and the rotation treated as negative.
  alat = -a.lat * Math.PI / 180.0;
  acos = Math.cos(alat);
  asin = Math.sin(alat);

  bx = (brp.x * acos) - (brp.z * asin);
  by = brp.y;
  bz = (brp.x * asin) + (brp.z * acos);

  return { x: bx, y: by, z: bz };
}
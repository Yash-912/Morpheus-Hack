// ============================================================
// Geospatial Utilities — Haversine distance, zone check, geocoding
// ============================================================

const axios = require('axios');

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the Haversine distance between two lat/lng points.
 * @returns {number} Distance in kilometres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm.
 * @param {number} lat
 * @param {number} lng
 * @param {Array<[number,number]>} polygon — array of [lat, lng] pairs forming a closed polygon
 * @returns {boolean}
 */
function isWithinZone(lat, lng, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Reverse-geocode lat/lng to city name via Google Maps Geocoding API.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>} City name or null
 */
async function getCity(lat, lng) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  GOOGLE_MAPS_API_KEY not set — geocoding unavailable');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=locality`;
    const { data } = await axios.get(url, { timeout: 5000 });

    if (data.status === 'OK' && data.results.length > 0) {
      const cityComponent = data.results[0].address_components.find((c) =>
        c.types.includes('locality')
      );
      return cityComponent ? cityComponent.long_name.toLowerCase() : null;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Convert degrees to radians.
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

module.exports = { haversineDistance, isWithinZone, getCity, toRadians };

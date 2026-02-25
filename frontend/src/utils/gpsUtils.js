/**
 * GPS utility functions for the GigPay PWA.
 * Pure functions — no React state or side effects.
 */

/**
 * Derive worker status from GPS speed (m/s).
 * @param {number|null|undefined} speed — speed in meters per second
 * @returns {"idle"|"walking"|"on_trip"|"commuting"|"unknown"}
 */
export function getWorkerStatus(speed) {
    if (speed === null || speed === undefined) return 'unknown';
    if (speed < 0.5) return 'idle';
    if (speed < 8) return 'walking';
    if (speed < 40) return 'on_trip';
    return 'commuting';
}

/**
 * Format lat/lng into a human-readable string.
 * @param {number} lat
 * @param {number} lng
 * @returns {string} e.g. "19.0596°N, 72.8295°E"
 */
export function formatCoords(lat, lng) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Check if the browser supports the Geolocation API.
 * @returns {boolean}
 */
export function isGPSSupported() {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

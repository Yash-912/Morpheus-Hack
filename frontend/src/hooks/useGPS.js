import { useState, useEffect, useRef, useCallback } from 'react';
import { getWorkerStatus, isGPSSupported } from '../utils/gpsUtils';
import api from '../services/api.service';

/**
 * @typedef {Object} GPSLocation
 * @property {number} lat      — latitude (degrees)
 * @property {number} lng      — longitude (degrees)
 * @property {number} accuracy — accuracy in metres
 * @property {number|null} speed — speed in m/s (null if unavailable)
 * @property {string} timestamp — ISO 8601 timestamp
 */

/**
 * Custom React hook that manages the GPS tracking lifecycle.
 *
 * Usage:
 *   const { location, status, isTracking, error, startTracking, stopTracking } = useGPS();
 *
 * @returns {{
 *   location: GPSLocation|null,
 *   status: "idle"|"on_trip"|"walking"|"commuting"|"unknown",
 *   isTracking: boolean,
 *   error: string|null,
 *   startTracking: () => void,
 *   stopTracking: () => void,
 * }}
 */
export function useGPS() {
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState('unknown');
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);

    const watchIdRef = useRef(null);
    const lastSentRef = useRef(0); // timestamp of last backend POST

    const THROTTLE_MS = 30_000; // send to backend at most once every 30s

    /**
     * Send the current location to the backend.
     * Fails silently — never crashes GPS tracking.
     * @param {GPSLocation} loc
     */
    const sendLocationToBackend = useCallback(async (loc) => {
        const now = Date.now();
        if (now - lastSentRef.current < THROTTLE_MS) return;
        lastSentRef.current = now;

        try {
            await api.post('/location/update', {
                lat: loc.lat,
                lng: loc.lng,
                accuracy: loc.accuracy,
                speed: loc.speed,
                timestamp: loc.timestamp,
            });
        } catch {
            // Fail silently — do not interrupt GPS tracking
        }
    }, []);

    /**
     * Start continuous GPS tracking via navigator.geolocation.watchPosition.
     * The browser will show a permission dialog on first use.
     */
    const startTracking = useCallback(() => {
        if (!isGPSSupported()) {
            setError('GPS not supported on this device');
            return;
        }

        // Don't start a second watcher
        if (watchIdRef.current !== null) return;

        setError(null);
        setIsTracking(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed,
                    timestamp: new Date(position.timestamp).toISOString(),
                };
                setLocation(loc);
                setStatus(getWorkerStatus(position.coords.speed));
                sendLocationToBackend(loc);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setError(
                        'Location permission denied. Please enable GPS in your browser settings to use zone features.'
                    );
                    stopTracking();
                } else {
                    setError(`GPS error: ${err.message}`);
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 10000,
            }
        );
    }, [sendLocationToBackend]);

    /**
     * Stop GPS tracking and clear the watcher.
     */
    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        setLocation(null);
        setStatus('unknown');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, []);

    return { location, status, isTracking, error, startTracking, stopTracking };
}

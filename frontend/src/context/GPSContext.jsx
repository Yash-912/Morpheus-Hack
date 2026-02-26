import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGPS } from '../hooks/useGPS';

const GPSContext = createContext(null);

const GPS_ENABLED_KEY = 'gigpay_gps_enabled';
const GPS_PROMPTED_KEY = 'gigpay_gps_prompted';

/**
 * GPSProvider — wraps authenticated routes so all pages share GPS state.
 * Auto-starts tracking if user previously enabled it.
 */
export function GPSProvider({ children }) {
    const gps = useGPS();
    const [hasBeenPrompted, setHasBeenPrompted] = useState(() => {
        return localStorage.getItem(GPS_PROMPTED_KEY) === 'true';
    });
    const [showPrompt, setShowPrompt] = useState(false);

    // On mount: show prompt if never prompted, or auto-start if previously enabled
    useEffect(() => {
        if (!hasBeenPrompted) {
            // Show the prompt after a short delay so the UI settles
            const timer = setTimeout(() => setShowPrompt(true), 1500);
            return () => clearTimeout(timer);
        } else if (localStorage.getItem(GPS_ENABLED_KEY) === 'true') {
            // User previously enabled — auto-start tracking
            gps.startTracking();
        }
    }, [hasBeenPrompted]); // eslint-disable-line react-hooks/exhaustive-deps

    const enableTracking = useCallback(() => {
        localStorage.setItem(GPS_PROMPTED_KEY, 'true');
        localStorage.setItem(GPS_ENABLED_KEY, 'true');
        setHasBeenPrompted(true);
        setShowPrompt(false);
        gps.startTracking();
    }, [gps]);

    const dismissPrompt = useCallback(() => {
        localStorage.setItem(GPS_PROMPTED_KEY, 'true');
        localStorage.setItem(GPS_ENABLED_KEY, 'false');
        setHasBeenPrompted(true);
        setShowPrompt(false);
    }, []);

    const toggleTracking = useCallback(() => {
        if (gps.isTracking) {
            gps.stopTracking();
            localStorage.setItem(GPS_ENABLED_KEY, 'false');
        } else {
            gps.startTracking();
            localStorage.setItem(GPS_ENABLED_KEY, 'true');
        }
    }, [gps]);

    return (
        <GPSContext.Provider value={{
            ...gps,
            showPrompt,
            enableTracking,
            dismissPrompt,
            toggleTracking,
        }}>
            {children}
        </GPSContext.Provider>
    );
}

/**
 * useGPSContext — consume GPS state from any page within GPSProvider.
 */
export function useGPSContext() {
    const ctx = useContext(GPSContext);
    if (!ctx) throw new Error('useGPSContext must be used within <GPSProvider>');
    return ctx;
}

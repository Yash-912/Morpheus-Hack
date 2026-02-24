import { useState, useEffect } from 'react';

export const useGeolocation = (enabled = false) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled || !("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    heading: position.coords.heading, // Useful for the map icon orientation
                    speed: position.coords.speed
                });
            },
            (err) => setError(err.message),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [enabled]);

    return { location, error };
};

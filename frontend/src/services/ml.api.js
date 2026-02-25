// ============================================================
// ML API — Frontend service for ML/zones endpoints
// These go through the backend proxy to the ML microservice.
// ============================================================

import api from './api.service';

/**
 * Get hot zones for a city.
 * @param {string} city — e.g., "bangalore"
 * @param {object} [options] — { lat, lng } for user location context
 */
export async function getZones(city, options = {}) {
    const { data } = await api.get('/zones', {
        params: { city, lat: options.lat, lng: options.lng },
    });
    return data.data;
}

/**
 * Get earnings forecast for current user.
 * @param {object} [params] — { targetDate }
 */
export async function getForecast(params = {}) {
    const { data } = await api.get('/earnings/forecast', { params });
    return data.data;
}

/**
 * Get algorithm insights for a platform and city.
 * @param {string} platform
 * @param {string} city
 */
export async function getInsights(platform, city) {
    const { data } = await api.get('/insights', { params: { platform, city } });
    return data.data;
}

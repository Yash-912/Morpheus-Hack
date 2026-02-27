// ============================================================
// AI Copilot Service
// Handles proactive AI alerts for gig workers (Hot Zones)
// ============================================================

const { prisma } = require('../config/database');
const axios = require('axios');
const WhatsAppService = require('./whatsapp.service');
const logger = require('../utils/logger.utils');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Haversine formula to calculate distance between two lat/lng points in km
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

class CopilotService {
    /**
     * The main cron-job handler.
     * 1. Fetches active users with known locations.
     * 2. Calls ML service for Hot Zones.
     * 3. Finds nearby high-demand zones for each user.
     * 4. Pushes a proactive WhatsApp alert.
     */
    static async checkHotZonesAndAlert() {
        try {
            logger.info('CopilotService: Starting proactive Hot Zone check...');

            // Fetch users who are active, opted into WhatsApp, and have home coordinates
            const users = await prisma.user.findMany({
                where: {
                    whatsappOptIn: true,
                    isActive: true,
                    homeLat: { not: null },
                    homeLng: { not: null }
                },
                select: { id: true, name: true, phone: true, homeLat: true, homeLng: true, languagePref: true }
            });

            if (users.length === 0) {
                logger.info('CopilotService: No active users with locations found.');
                return { success: true, alertsSent: 0 };
            }

            // Fetch current Hot Zones from ML Microservice
            let hotZones = [];
            try {
                const { data } = await axios.get(`${ML_SERVICE_URL}/zones/current`);

                hotZones = data.clusters || [];
                if (hotZones.length === 0) {
                    logger.info('CopilotService: ML Service returned no active hot zones currently.');
                    return { success: true, alertsSent: 0 };
                }
            } catch (mlErr) {
                logger.error('CopilotService: Failed to fetch from ML service', { error: mlErr.message });
                return { success: false, error: 'ML_FETCH_FAILED' };
            }

            let alertsSentCount = 0;

            // Iterate over users and check distance to hot zones
            for (const user of users) {
                // Filter zones that are High Probability and within 5km of the user
                const nearbyZones = hotZones.filter(zone => {
                    if (zone.demand_level !== 'high') return false;
                    const distance = getDistanceInKm(user.homeLat, user.homeLng, zone.center_lat, zone.center_lng);
                    return distance <= 5.0; // Within 5km radius
                });

                if (nearbyZones.length > 0) {
                    // Pick the closest or highest density zone
                    const topZone = nearbyZones[0];
                    const distanceKm = getDistanceInKm(user.homeLat, user.homeLng, topZone.center_lat, topZone.center_lng).toFixed(1);

                    // Formulate message based on language preference
                    const lang = user.languagePref || 'en';
                    let message = '';

                    if (lang === 'hi') {
                        message = `🚨 *सुपर सर्ज अलर्ट!*\n\n${user.name}, ${distanceKm}km दूर एक 'High Demand' ज़ोन मिला है।\nवहाँ इस समय बहुत ज़्यादा ऑर्डर्स हैं।\n\nतेज़ी से वहाँ पहुँचें और अपनी कमाई बढ़ाएँ! 💸\n📍 Google Maps: https://www.google.com/maps/dir/?api=1&destination=${topZone.center_lat},${topZone.center_lng}`;
                    } else if (lang === 'mr') {
                        message = `🚨 *सुपर सर्ज अलर्ट!*\n\n${user.name}, ${distanceKm}km अंतरावर एक 'High Demand' झोन आढळला आहे.\nतिथे आता प्रचंड ऑर्डर्स आहेत.\n\nलवकर पोहचा आणि तुमची कमाई वाढवा! 💸\n📍 Google Maps: https://www.google.com/maps/dir/?api=1&destination=${topZone.center_lat},${topZone.center_lng}`;
                    } else {
                        message = `🚨 *Super Surge Alert!*\n\nHigh demand hotspot detected just ${distanceKm}km away from you.\nSurge conditions are active right now.\n\nHead there to maximize your earnings! 💸\n📍 Google Maps: https://www.google.com/maps/dir/?api=1&destination=${topZone.center_lat},${topZone.center_lng}`;
                    }

                    // Push via WhatsApp via Twilio/Meta
                    try {
                        await WhatsAppService.sendMessage(user.phone, message);
                        alertsSentCount++;
                        logger.info(`CopilotService: Alert sent to ${user.phone} for zone ${topZone.cluster_id}`);
                    } catch (waErr) {
                        logger.error(`CopilotService: Failed to send WhatsApp alert to ${user.phone}`, { error: waErr.message });
                    }
                }
            }

            logger.info(`CopilotService: Finished proactive check. Sent ${alertsSentCount} alerts.`);
            return { success: true, alertsSent: alertsSentCount };

        } catch (error) {
            logger.error('CopilotService Error', { error: error.message, stack: error.stack });
            return { success: false, error: error.message };
        }
    }
}

module.exports = CopilotService;

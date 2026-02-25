// ============================================================
// Platform Constants — Gig platform metadata
// Usage: import { PLATFORMS, getPlatform } from '../constants/platforms';
// ============================================================

export const PLATFORMS = {
    zomato: {
        id: 'zomato',
        name: 'Zomato',
        color: '#E23744',
        bgColor: '#FEE8EA',
        icon: '🍕',
        category: 'food_delivery',
    },
    swiggy: {
        id: 'swiggy',
        name: 'Swiggy',
        color: '#FC8019',
        bgColor: '#FFF3E6',
        icon: '🛵',
        category: 'food_delivery',
    },
    ola: {
        id: 'ola',
        name: 'Ola',
        color: '#7AB648',
        bgColor: '#F0F7E8',
        icon: '🚗',
        category: 'rideshare',
    },
    uber: {
        id: 'uber',
        name: 'Uber',
        color: '#000000',
        bgColor: '#F0F0F0',
        icon: '🚕',
        category: 'rideshare',
    },
    dunzo: {
        id: 'dunzo',
        name: 'Dunzo',
        color: '#00D09C',
        bgColor: '#E6FAF5',
        icon: '📦',
        category: 'delivery',
    },
    other: {
        id: 'other',
        name: 'Other',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: '💼',
        category: 'other',
    },
};

/**
 * Get platform metadata by ID (case-insensitive).
 * @param {string} platformId
 * @returns {object}
 */
export function getPlatform(platformId) {
    const id = (platformId || 'other').toLowerCase();
    return PLATFORMS[id] || PLATFORMS.other;
}

/**
 * Get all platform IDs as array.
 * @returns {string[]}
 */
export function getAllPlatformIds() {
    return Object.keys(PLATFORMS).filter((id) => id !== 'other');
}

/**
 * Get platforms by category.
 * @param {'food_delivery'|'rideshare'|'delivery'|'other'} category
 * @returns {object[]}
 */
export function getPlatformsByCategory(category) {
    return Object.values(PLATFORMS).filter((p) => p.category === category);
}

export default PLATFORMS;

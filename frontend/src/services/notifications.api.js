// ============================================================
// Notifications API — Frontend service for notification endpoints
// ============================================================

import api from './api.service';

/**
 * Get notifications (paginated).
 * @param {number} page
 * @param {number} limit
 */
export async function getNotifications(page = 1, limit = 20) {
    const { data } = await api.get('/notifications', { params: { page, limit } });
    return data;
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return data.data;
}

/**
 * Mark notifications as read.
 * @param {string[]} ids — notification IDs. If empty, marks all as read.
 */
export async function markRead(ids = []) {
    const { data } = await api.patch('/notifications/read', { ids });
    return data;
}

/**
 * Register FCM token for push notifications.
 * @param {string} token — Firebase Cloud Messaging token
 */
export async function registerFcmToken(token) {
    const { data } = await api.post('/notifications/fcm-token', { token });
    return data;
}

// ============================================================
// useSmsSync — Auto-read SMS inbox on mount, send to backend
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { readSms } from '../plugins/sms-plugin';
import api from '../services/api.service';

const LAST_SYNC_KEY = 'gigpay_sms_last_sync';
const PERMISSION_KEY = 'gigpay_sms_permission_granted';

/**
 * Hook that reads SMS from device inbox and syncs to backend.
 * - On native Android: reads real inbox via Capacitor plugin
 * - On web: uses realistic mock data from sms-plugin.js
 *
 * Returns:
 *  { isSyncing, lastSync, syncResult, hasPermission,
 *    grantPermission, triggerSync }
 */
export function useSmsSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [syncResult, setSyncResult] = useState(null);
    const [hasPermission, setHasPermission] = useState(
        () => localStorage.getItem(PERMISSION_KEY) === 'true'
    );
    const hasTriggered = useRef(false);

    // Load last sync timestamp
    useEffect(() => {
        const stored = localStorage.getItem(LAST_SYNC_KEY);
        if (stored) setLastSync(stored);
    }, []);

    // Core sync function
    const triggerSync = useCallback(async () => {
        if (isSyncing) return null;
        setIsSyncing(true);

        try {
            // Read SMS from device (or mock on web)
            const after = localStorage.getItem(LAST_SYNC_KEY) || null;
            const { messages, count } = await readSms(100, after);

            if (!messages || messages.length === 0) {
                setIsSyncing(false);
                return { synced: 0, message: 'No new SMS found' };
            }

            // Send to backend
            const { data } = await api.post('/sms/sync', {
                messages,
                totalScanned: count,
            });

            // Save sync timestamp
            const now = new Date().toISOString();
            localStorage.setItem(LAST_SYNC_KEY, now);
            setLastSync(now);
            setSyncResult(data);

            return data;
        } catch (err) {
            console.error('[useSmsSync] Sync failed:', err);
            return null;
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    // Grant permission and trigger first sync
    const grantPermission = useCallback(async () => {
        localStorage.setItem(PERMISSION_KEY, 'true');
        setHasPermission(true);
        return triggerSync();
    }, [triggerSync]);

    // Auto-sync on mount if permission was previously granted
    useEffect(() => {
        if (hasPermission && !hasTriggered.current) {
            hasTriggered.current = true;
            triggerSync();
        }
    }, [hasPermission, triggerSync]);

    return {
        isSyncing,
        lastSync,
        syncResult,
        hasPermission,
        grantPermission,
        triggerSync,
    };
}

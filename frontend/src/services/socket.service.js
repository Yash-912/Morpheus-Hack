import { io } from 'socket.io-client';
import { useRealtimeStore } from '../store/realtime.store';

let socket = null;

export const connectSocket = (user) => {
    if (!user) return;
    if (socket) return; // Prevent multiple connections

    const SOCKET_URL = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:5000';

    socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);

        // Join user-specific room for notifications and payouts
        socket.emit('join:user', user.id);

        // Join city room for zone updates
        // In a real app, this would be dynamic based on GPS
        socket.emit('join:city', 'bengaluru');
    });

    // ---- Listeners ----

    socket.on('zones:update', (data) => {
        useRealtimeStore.getState().setLatestZones(data.zones);
    });

    socket.on('payout:processing', (data) => {
        useRealtimeStore.getState().updatePayoutStatus({ ...data, status: 'processing' });
    });

    socket.on('payout:failed', (data) => {
        useRealtimeStore.getState().updatePayoutStatus({ ...data, status: 'failed' });
    });

    socket.on('notification:new', (notification) => {
        useRealtimeStore.getState().incrementUnreadNotifications();
        // Here you could also trigger a toast or update a notification list
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { useRealtimeStore } from '../store/realtime.store';

export const useSocket = () => {
    const socketRef = useRef(null);
    const { accessToken, user } = useAuthStore();
    const { setLatestZones, updatePayoutStatus, incrementUnreadNotifications } = useRealtimeStore();

    useEffect(() => {
        if (!accessToken || !user) return;

        socketRef.current = io(import.meta.env.VITE_API_BASE_URL || '/', {
            auth: { token: accessToken }
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to Fastify Socket.io server');
            socketRef.current.emit('joinRoom', `user_${user.id}`);
            if (user.city) {
                socketRef.current.emit('joinRoom', `city_${user.city}`);
            }
        });

        socketRef.current.on('zones_updated', (data) => setLatestZones(data));
        socketRef.current.on('payout_update', (data) => updatePayoutStatus(data));
        socketRef.current.on('new_notification', () => incrementUnreadNotifications());

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [accessToken, user, setLatestZones, updatePayoutStatus, incrementUnreadNotifications]);

    return socketRef.current;
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeStore } from '../store/realtime.store';

export const useNotifications = () => {
    const queryClient = useQueryClient();
    const unreadCount = useRealtimeStore(state => state.unreadNotifications);
    const setUnreadCount = useRealtimeStore(state => state.setUnreadNotifications);

    const notificationsQuery = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            // Simulate fetching and counting unread
            const data = [];
            setUnreadCount(data.filter(n => !n.read).length);
            return data;
        }
    });

    const markReadMutation = useMutation({
        mutationFn: async (id) => {
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    return {
        notifications: notificationsQuery.data,
        isLoading: notificationsQuery.isLoading,
        unreadCount,
        markRead: markReadMutation.mutateAsync
    };
};

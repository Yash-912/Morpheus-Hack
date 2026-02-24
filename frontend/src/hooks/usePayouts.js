import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeStore } from '../store/realtime.store';
import { getTransactionsApi, initiatePayoutApi, getWalletBalanceApi } from '../services/payouts.api';

export const usePayouts = () => {
    const queryClient = useQueryClient();
    const payoutStatus = useRealtimeStore(state => state.payoutStatus);

    const balanceQuery = useQuery({
        queryKey: ['wallet', 'balance'],
        queryFn: getWalletBalanceApi
    });

    const historyQuery = useQuery({
        queryKey: ['payouts', 'history'],
        queryFn: getTransactionsApi
    });

    const initiatePayoutMutation = useMutation({
        mutationFn: async ({ amount, type = 'standard' }) => {
            return initiatePayoutApi(amount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['payouts', 'history'] });
        }
    });

    return {
        balance: balanceQuery.data,
        isLoadingBalance: balanceQuery.isLoading,
        history: historyQuery.data,
        isLoadingHistory: historyQuery.isLoading,
        initiatePayout: initiatePayoutMutation.mutateAsync,
        isInitiating: initiatePayoutMutation.isPending,
        liveStatus: payoutStatus // Updated via WebSockets
    };
};

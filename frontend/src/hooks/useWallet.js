import { useQuery } from '@tanstack/react-query';
// import { getBalanceApi } from '../services/payouts.api'; // Phase 10

export const useWallet = () => {
    const balanceQuery = useQuery({
        queryKey: ['wallet', 'balance'],
        queryFn: async () => {
            // return getBalanceApi();
            return new Promise(resolve => setTimeout(() => resolve({
                balance: 324000, // in paise 
                lockedBalance: 120000,
                lifetimeEarned: 9240000,
                lifetimeWithdrawn: 8900000
            }), 800));
        },
        refetchInterval: 30000 // Poll every 30s per roadmap
    });

    return {
        balance: balanceQuery.data?.balance || 0,
        lockedBalance: balanceQuery.data?.lockedBalance || 0,
        lifetimeEarned: balanceQuery.data?.lifetimeEarned || 0,
        lifetimeWithdrawn: balanceQuery.data?.lifetimeWithdrawn || 0,
        isLoading: balanceQuery.isLoading,
        refetch: balanceQuery.refetch
    };
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMicroSavingsPortfolio, buyGold, sellGold, createGullak } from '../services/microsavings.api';
import toast from 'react-hot-toast';

export const useMicroSavings = () => {
    const queryClient = useQueryClient();

    const portfolioQuery = useQuery({
        queryKey: ['microsavings', 'portfolio'],
        queryFn: getMicroSavingsPortfolio,
        staleTime: 1000 * 60 * 2,
    });

    const buyGoldMutation = useMutation({
        mutationFn: (amount) => buyGold(amount),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['microsavings'] });
            toast.success(data.message || 'Gold purchased successfully!');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || 'Failed to buy gold');
        },
    });

    const sellGoldMutation = useMutation({
        mutationFn: (amount) => sellGold(amount),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['microsavings'] });
            toast.success(data.data?.message || 'Gold sold — funds being transferred!');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || 'Failed to sell gold');
        },
    });

    const createGullakMutation = useMutation({
        mutationFn: createGullak,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['microsavings'] });
            toast.success('Gullak created! Auto-deductions start tomorrow.');
        },
        onError: (error) => {
            // Don't toast here — we want the UI to capture the 400 error for inline display
            // The component handles AFFORDABILITY_CAP_EXCEEDED inline
        },
    });

    return {
        portfolio: portfolioQuery.data,
        isLoadingPortfolio: portfolioQuery.isLoading,
        buyGold: buyGoldMutation.mutateAsync,
        isBuyingGold: buyGoldMutation.isPending,
        sellGold: sellGoldMutation.mutateAsync,
        isSellingGold: sellGoldMutation.isPending,
        createGullak: createGullakMutation.mutateAsync,
        isCreatingGullak: createGullakMutation.isPending,
        createGullakError: createGullakMutation.error,
    };
};

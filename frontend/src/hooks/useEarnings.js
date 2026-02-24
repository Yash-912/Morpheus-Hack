import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayEarningsApi, getEarningsSummaryApi } from '../services/earnings.api';

export const useEarnings = () => {
    const queryClient = useQueryClient();

    // Query for today's earnings
    const todayQuery = useQuery({
        queryKey: ['earnings', 'today'],
        queryFn: async () => {
            return getTodayEarningsApi();
        }
    });

    // Query for historical summary
    const summaryQuery = useQuery({
        queryKey: ['earnings', 'summary'],
        queryFn: async () => {
            return getEarningsSummaryApi();
        }
    });

    return {
        today: todayQuery.data,
        isLoadingToday: todayQuery.isLoading,
        summary: summaryQuery.data,
        isLoadingSummary: summaryQuery.isLoading,
        refetchToday: todayQuery.refetch
    };
};

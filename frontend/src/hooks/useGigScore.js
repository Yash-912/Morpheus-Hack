import { useQuery } from '@tanstack/react-query';
import { getGigScoreOverview, getGigScoreHistory, getGigScoreEligibility } from '../services/gigscore.api';

export const useGigScore = () => {
    const overviewQuery = useQuery({
        queryKey: ['gigscore', 'overview'],
        queryFn: getGigScoreOverview,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const historyQuery = useQuery({
        queryKey: ['gigscore', 'history'],
        queryFn: getGigScoreHistory,
        staleTime: 1000 * 60 * 5,
    });

    const eligibilityQuery = useQuery({
        queryKey: ['gigscore', 'eligibility'],
        queryFn: getGigScoreEligibility,
        staleTime: 1000 * 60 * 5,
    });

    return {
        overview: overviewQuery.data,
        isLoadingOverview: overviewQuery.isLoading,
        history: historyQuery.data || [],
        isLoadingHistory: historyQuery.isLoading,
        eligibility: eligibilityQuery.data,
        isLoadingEligibility: eligibilityQuery.isLoading,
    };
};

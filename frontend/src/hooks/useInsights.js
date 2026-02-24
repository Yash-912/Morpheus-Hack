import { useQuery } from '@tanstack/react-query';
import { getAlgoInsightsApi, getPerformanceInsightsApi } from '../services/insights.api';

export const useInsights = (platform, city) => {
    const algoQuery = useQuery({
        queryKey: ['insights', 'algo', platform, city],
        queryFn: () => getAlgoInsightsApi(platform, city),
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    const performanceQuery = useQuery({
        queryKey: ['insights', 'performance'],
        queryFn: getPerformanceInsightsApi,
        staleTime: 1000 * 60 * 5,
    });

    return {
        algoInsights: algoQuery.data,
        isLoadingAlgo: algoQuery.isLoading,
        performance: performanceQuery.data,
        isLoadingPerformance: performanceQuery.isLoading
    };
};

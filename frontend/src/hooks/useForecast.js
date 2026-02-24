import { useQuery } from '@tanstack/react-query';

export const useForecast = () => {
    const focusQuery = useQuery({
        queryKey: ['earnings', 'forecast'],
        queryFn: async () => {
            return new Promise(resolve => setTimeout(() => resolve({
                min: 80000, // in paise
                max: 120000,
                expected: 100000,
                confidence: 85,
                targetHitProbability: 70
            }), 800));
        }
    });

    return {
        forecast: focusQuery.data,
        isLoadingForecast: focusQuery.isLoading
    };
};

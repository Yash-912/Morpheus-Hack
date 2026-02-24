import api from './api.service';

export const getAlgoInsightsApi = async (platform, city) => {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (city) params.append('city', city);

    const { data } = await api.get(`/insights/algo?${params.toString()}`);
    return data.data;
};

export const getPerformanceInsightsApi = async () => {
    const { data } = await api.get('/insights/performance');
    return data.data;
};

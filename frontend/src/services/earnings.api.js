import api from './api.service';

export const getTodayEarningsApi = async () => {
    const { data } = await api.get('/earnings/today');
    return data.data; // The backend wraps responses in { success, data }
};

export const getEarningsSummaryApi = async (period = 'weekly') => {
    const { data } = await api.get(`/earnings/summary?period=${period}`);
    return data.data;
};

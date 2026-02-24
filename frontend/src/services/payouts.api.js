import api from './api.service';

export const getWalletBalanceApi = async () => {
    const { data } = await api.get('/payouts/balance');
    return data.data;
};

export const initiatePayoutApi = async (amount) => {
    const { data } = await api.post('/payouts/initiate', { amount });
    return data.data;
};

export const getTransactionsApi = async () => {
    const { data } = await api.get('/payouts/history');
    return data.data;
};

import api from './api.service';

export const getWalletBalanceApi = async () => {
    const { data } = await api.get('/payouts/balance');
    return data.data;
};

export const getFeePreviewApi = async (amount) => {
    const { data } = await api.get(`/payouts/fee-preview?amount=${amount}&type=instant`);
    return data.data;
};

export const initiatePayoutApi = async (amount) => {
    const { data } = await api.post('/payouts/initiate', { amount, type: 'instant' });
    return data.data;
};

export const getTransactionsApi = async () => {
    const { data } = await api.get('/payouts/history');
    return data.data;
};

// DEMO ONLY — simulates T+7 platform settlement
export const simulateSettlementApi = async (earningId, amount) => {
    const { data } = await api.post('/payouts/simulate-settlement', { earningId, amount });
    return data.data;
};

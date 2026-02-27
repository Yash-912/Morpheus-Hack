import api from './api.service';

export const createPaymentIntent = async (amount, jobId = null) => {
    const response = await api.post('/payments/create-intent', { amount, jobId });
    return response.data.data;
};

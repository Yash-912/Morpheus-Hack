import api from './api.service';

// --- LOANS ---
export const checkLoanEligibilityApi = async () => {
    const { data } = await api.get('/loans/eligibility');
    return data.data;
};

export const applyLoanApi = async (payload) => {
    // payload: { amount, repaymentPercent }
    const { data } = await api.post('/loans/apply', payload);
    return data.data;
};

export const getActiveLoansApi = async () => {
    const { data } = await api.get('/loans/active');
    return data.data;
};

export const repayLoanApi = async ({ loanId, amount }) => {
    const { data } = await api.post(`/loans/${loanId}/repay`, { amount });
    return data.data;
};

// --- SAVINGS ---
export const getSavingsGoalsApi = async () => {
    const { data } = await api.get('/savings');
    return data.data;
};

export const createSavingsGoalApi = async (payload) => {
    // payload: { name, targetAmount, autoSavePercent }
    const { data } = await api.post('/savings/create', payload);
    return data.data;
};

export const depositSavingsApi = async ({ goalId, amount }) => {
    const { data } = await api.post(`/savings/${goalId}/deposit`, { amount });
    return data.data;
};

export const withdrawSavingsApi = async ({ goalId, amount }) => {
    const { data } = await api.post(`/savings/${goalId}/withdraw`, { amount });
    return data.data;
};

export const toggleSavingsAutoSaveApi = async (goalId) => {
    const { data } = await api.patch(`/savings/${goalId}/toggle`);
    return data.data;
};

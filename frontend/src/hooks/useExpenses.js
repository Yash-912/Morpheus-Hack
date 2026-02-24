import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getExpenses, getExpenseSummary, addExpense, deleteExpense } from '../services/expenses.api'; // Phase 10

export const useExpenses = () => {
    const queryClient = useQueryClient();

    const expensesQuery = useQuery({
        queryKey: ['expenses', 'list'],
        queryFn: async () => {
            // return getExpenses();
            return new Promise(resolve => setTimeout(() => resolve([]), 800));
        }
    });

    const summaryQuery = useQuery({
        queryKey: ['expenses', 'summary'],
        queryFn: async () => {
            // return getExpenseSummary();
            return new Promise(resolve => setTimeout(() => resolve({ total: 0, byCategory: [] }), 800));
        }
    });

    const addExpenseMutation = useMutation({
        mutationFn: async (data) => {
            // return addExpense(data);
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: async (id) => {
            // return deleteExpense(id);
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
    });

    return {
        expenses: expensesQuery.data,
        isLoadingExpenses: expensesQuery.isLoading,
        summary: summaryQuery.data,
        isLoadingSummary: summaryQuery.isLoading,
        addExpense: addExpenseMutation.mutateAsync,
        isAdding: addExpenseMutation.isPending,
        deleteExpense: deleteExpenseMutation.mutateAsync,
        isDeleting: deleteExpenseMutation.isPending,
    };
};

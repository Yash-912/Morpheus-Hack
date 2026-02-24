import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSavingsGoalsApi,
    createSavingsGoalApi,
    depositSavingsApi,
    withdrawSavingsApi,
    toggleSavingsAutoSaveApi
} from '../services/financials.api';
import toast from 'react-hot-toast';

export const useSavings = () => {
    const queryClient = useQueryClient();

    const savingsQuery = useQuery({
        queryKey: ['savings'],
        queryFn: getSavingsGoalsApi,
    });

    const createMutation = useMutation({
        mutationFn: createSavingsGoalApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            toast.success("Savings goal created!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Failed to create goal");
        }
    });

    const depositMutation = useMutation({
        mutationFn: depositSavingsApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            toast.success("Deposited to savings!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Deposit failed");
        }
    });

    const withdrawMutation = useMutation({
        mutationFn: withdrawSavingsApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            toast.success("Withdrawn to wallet!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Withdrawal failed");
        }
    });

    const toggleMutation = useMutation({
        mutationFn: toggleSavingsAutoSaveApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savings'] });
        },
        onError: (error) => {
            toast.error("Failed to toggle auto-save");
        }
    });

    return {
        goals: savingsQuery.data || [],
        isLoading: savingsQuery.isLoading,
        createGoal: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        deposit: depositMutation.mutateAsync,
        isDepositing: depositMutation.isPending,
        withdraw: withdrawMutation.mutateAsync,
        isWithdrawing: withdrawMutation.isPending,
        toggleAutoSave: toggleMutation.mutateAsync
    };
};

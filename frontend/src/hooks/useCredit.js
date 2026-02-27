import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCreditStatus, applyEmergencyFund } from '../services/credit.api';
import toast from 'react-hot-toast';

export const useCredit = () => {
    const queryClient = useQueryClient();

    const statusQuery = useQuery({
        queryKey: ['credit', 'status'],
        queryFn: getCreditStatus,
        staleTime: 1000 * 60 * 2,
    });

    const applyMutation = useMutation({
        mutationFn: ({ amount, reason }) => applyEmergencyFund(amount, reason),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['credit'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            toast.success(data.data?.message || 'Emergency fund credited instantly!');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || 'Failed to apply for emergency fund');
        },
    });

    return {
        status: statusQuery.data,
        isLoadingStatus: statusQuery.isLoading,
        applyFund: applyMutation.mutateAsync,
        isApplying: applyMutation.isPending,
    };
};

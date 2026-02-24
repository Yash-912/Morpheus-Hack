import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    checkLoanEligibilityApi,
    applyLoanApi,
    getActiveLoansApi,
    repayLoanApi
} from '../services/financials.api';
import toast from 'react-hot-toast';

export const useLoan = () => {
    const queryClient = useQueryClient();

    const eligibilityQuery = useQuery({
        queryKey: ['loans', 'eligibility'],
        queryFn: checkLoanEligibilityApi,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const activeLoansQuery = useQuery({
        queryKey: ['loans', 'active'],
        queryFn: getActiveLoansApi,
    });

    const applyMutation = useMutation({
        mutationFn: applyLoanApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            toast.success("Loan approved and credited instantly!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Failed to apply for loan");
        }
    });

    const repayMutation = useMutation({
        mutationFn: repayLoanApi,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            toast.success(data.message || "Repayment successful!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Repayment failed");
        }
    });

    return {
        eligibility: eligibilityQuery.data,
        isLoadingEligibility: eligibilityQuery.isLoading,
        activeLoans: activeLoansQuery.data || [],
        isLoadingActiveLoans: activeLoansQuery.isLoading,
        applyLoan: applyMutation.mutateAsync,
        isApplying: applyMutation.isPending,
        repayLoan: repayMutation.mutateAsync,
        isRepaying: repayMutation.isPending
    };
};

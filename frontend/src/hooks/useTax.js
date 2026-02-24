import { useQuery, useMutation } from '@tanstack/react-query';
// import { getTaxSummary, getDeductions, calculateTax } from '../services/tax.api'; // Phase 10

export const useTax = (fy) => {
    const summaryQuery = useQuery({
        queryKey: ['tax', 'summary', fy],
        queryFn: async () => {
            return new Promise(resolve => setTimeout(() => resolve({
                grossIncome: 0,
                totalDeductions: 0,
                taxableIncome: 0,
                taxPayable: 0
            }), 800));
        },
        enabled: !!fy
    });

    const deductionsQuery = useQuery({
        queryKey: ['tax', 'deductions', fy],
        queryFn: async () => {
            return new Promise(resolve => setTimeout(() => resolve([]), 800));
        },
        enabled: !!fy
    });

    const calculateMutation = useMutation({
        mutationFn: async (data) => {
            return new Promise(resolve => setTimeout(() => resolve({ recommendation: 'new' }), 800));
        }
    });

    return {
        summary: summaryQuery.data,
        isLoadingSummary: summaryQuery.isLoading,
        deductions: deductionsQuery.data,
        isLoadingDeductions: deductionsQuery.isLoading,
        calculate: calculateMutation.mutateAsync,
        isCalculating: calculateMutation.isPending
    };
};

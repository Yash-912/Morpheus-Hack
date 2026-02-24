import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useInsurance = () => {
    const queryClient = useQueryClient();

    const plansQuery = useQuery({
        queryKey: ['insurance', 'plans'],
        queryFn: async () => {
            return new Promise(resolve => setTimeout(() => resolve([]), 800));
        }
    });

    const activePoliciesQuery = useQuery({
        queryKey: ['insurance', 'active'],
        queryFn: async () => {
            return new Promise(resolve => setTimeout(() => resolve([]), 800));
        }
    });

    const activateMutation = useMutation({
        mutationFn: async ({ type, duration }) => {
            return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insurance'] });
        }
    });

    return {
        plans: plansQuery.data,
        isLoadingPlans: plansQuery.isLoading,
        activePolicies: activePoliciesQuery.data,
        isLoadingActivePolicies: activePoliciesQuery.isLoading,
        activate: activateMutation.mutateAsync,
        isActivating: activateMutation.isPending
    };
};

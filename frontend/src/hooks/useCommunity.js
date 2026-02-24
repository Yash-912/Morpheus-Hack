import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNearbyJobsApi,
    createJobApi,
    getJobDetailApi,
    acceptJobApi,
    completeJobApi,
    confirmJobApi,
    getMyJobsApi
} from '../services/community.api';
import toast from 'react-hot-toast';

export const useCommunity = (lat, lng, radius = 50) => {
    const queryClient = useQueryClient();

    // Fetch nearby jobs (only runs if lat/lng are provided)
    const nearbyJobsQuery = useQuery({
        queryKey: ['community', 'nearby', lat, lng, radius],
        queryFn: () => getNearbyJobsApi(lat, lng, radius),
        enabled: !!lat && !!lng, // Don't run this query until we have a location
        staleTime: 1000 * 60 * 1, // 1 min freshness
    });

    // Fetch user's own jobs
    const myJobsQuery = useQuery({
        queryKey: ['community', 'my-jobs'],
        queryFn: getMyJobsApi,
    });

    // Post a new job
    const createJobMutation = useMutation({
        mutationFn: createJobApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community', 'nearby'] });
            queryClient.invalidateQueries({ queryKey: ['community', 'my-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] }); // Escrow deducted
            toast.success("Job posted successfully. Escrow locked.");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Failed to post job");
        }
    });

    // Accept a job
    const acceptJobMutation = useMutation({
        mutationFn: acceptJobApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community'] });
            toast.success("Job accepted!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Failed to accept job");
        }
    });

    // Complete a job
    const completeJobMutation = useMutation({
        mutationFn: completeJobApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community'] });
            toast.success("Job marked as complete. Waiting for confirmation.");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Failed to complete job");
        }
    });

    // Confirm a job
    const confirmJobMutation = useMutation({
        mutationFn: confirmJobApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] }); // May affect poster's balance if refund, or just updates generic wallet states
            toast.success("Payment released to worker!");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.error?.message || "Failed to confirm job");
        }
    });

    return {
        nearbyJobs: nearbyJobsQuery.data || [],
        isLoadingNearby: nearbyJobsQuery.isLoading,
        myJobs: myJobsQuery.data,
        isLoadingMyJobs: myJobsQuery.isLoading,
        createJob: createJobMutation.mutateAsync,
        isCreating: createJobMutation.isPending,
        acceptJob: acceptJobMutation.mutateAsync,
        completeJob: completeJobMutation.mutateAsync,
        confirmJob: confirmJobMutation.mutateAsync
    };
};

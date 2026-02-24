import api from './api.service';

/**
 * Fetch nearby community jobs using lat/lng
 */
export const getNearbyJobsApi = async (lat, lng, radius = 50) => {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    if (radius) params.append('radius', radius);

    const { data } = await api.get(`/community/jobs?${params.toString()}`);
    return data.data;
};

/**
 * Post a new community gig
 */
export const createJobApi = async (jobData) => {
    const { data } = await api.post('/community/jobs', jobData);
    return data.data;
};

/**
 * Get job details
 */
export const getJobDetailApi = async (jobId) => {
    const { data } = await api.get(`/community/jobs/${jobId}`);
    return data.data;
};

/**
 * Accept a job
 */
export const acceptJobApi = async (jobId) => {
    const { data } = await api.post(`/community/jobs/${jobId}/accept`);
    return data.data;
};

/**
 * Mark a job as complete (by worker)
 */
export const completeJobApi = async (jobId) => {
    const { data } = await api.post(`/community/jobs/${jobId}/complete`);
    return data.data;
};

/**
 * Confirm job completion (by poster)
 */
export const confirmJobApi = async (jobId) => {
    const { data } = await api.post(`/community/jobs/${jobId}/confirm`);
    return data.data;
};

/**
 * Get users posted and accepted jobs
 */
export const getMyJobsApi = async () => {
    const { data } = await api.get('/community/my-jobs');
    return data.data;
};

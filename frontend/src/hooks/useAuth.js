import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { sendOtpApi, verifyOtpApi } from '../services/auth.api';

export const useAuth = () => {
    const { user, isAuthenticated, login, logout, isLoading, setLoading, updateUser } = useAuthStore();

    const sendOtpMutation = useMutation({
        mutationFn: async (phone) => {
            return sendOtpApi(`+91${phone}`);
        }
    });

    const verifyOtpMutation = useMutation({
        mutationFn: async ({ phone, otp }) => {
            const res = await verifyOtpApi(`+91${phone}`, otp);

            // res.data contains { accessToken, refreshToken, user, isNewUser }
            login(
                { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken },
                res.data.user
            );

            return res.data;
        }
    });

    return {
        user,
        isAuthenticated,
        isLoading,
        setLoading,
        logout,
        updateUser,
        sendOtp: sendOtpMutation.mutateAsync,
        isSendingOtp: sendOtpMutation.isPending,
        verifyOtp: verifyOtpMutation.mutateAsync,
        isVerifyingOtp: verifyOtpMutation.isPending,
    };
};

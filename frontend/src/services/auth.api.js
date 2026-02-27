import api from './api.service';

export const sendOtpApi = async (phone) => {
    const { data } = await api.post('/auth/send-otp', { phone });
    return data;
};

export const verifyOtpApi = async (phone, otp) => {
    const { data } = await api.post('/auth/verify-otp', { phone, otp });
    return data;
};

export const initAadhaarKycApi = async () => {
    const { data } = await api.post('/auth/kyc/aadhaar/init');
    return data;
};

export const verifyAadhaarOtpApi = async (requestId) => {
    const { data } = await api.post('/auth/kyc/aadhaar/verify', { requestId });
    return data;
};

export const verifySelfieApi = async (imageBlob) => {
    const formData = new FormData();
    formData.append('selfie', imageBlob);
    const { data } = await api.post('/auth/kyc/selfie', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const uploadAadhaarXmlApi = async (zipFile, shareCode) => {
    const formData = new FormData();
    formData.append('aadhaar_zip', zipFile);
    formData.append('shareCode', shareCode);

    const { data } = await api.post('/auth/kyc/aadhaar/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

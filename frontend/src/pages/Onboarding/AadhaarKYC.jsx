import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { initAadhaarKycApi, verifyAadhaarOtpApi } from '../../services/auth.api';
import { useAuth } from '../../hooks/useAuth';

const AadhaarKYC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const { updateUser } = useAuth();

    // If redirected back from Setu with an id, process KYC immediately
    useEffect(() => {
        const id = searchParams.get('id');
        const successParam = searchParams.get('success');

        if (id) {
            if (successParam === 'false') {
                toast.error('DigiLocker consent was denied or failed.');
            } else {
                handleCompleteKyc(id);
            }
        }
    }, [searchParams]);

    const handleCompleteKyc = async (requestId) => {
        setIsLoading(true);
        try {
            // Calling the API wrapper passing the requestId from the URL
            const res = await verifyAadhaarOtpApi(requestId);

            // Sync the updated User data (name, kycStatus, aadhaarLast4) into global state
            updateUser(res.data);

            toast.success('DigiLocker KYC Verified!');
            navigate('/profile');
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'DigiLocker verification failed');
            setIsLoading(false);
        }
    };

    const handleStartDigiLocker = async () => {
        setIsLoading(true);
        try {
            const res = await initAadhaarKycApi();
            // Redirect the user entirely to Setu's DigiLocker OAuth page
            window.location.href = res.data.url;
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Failed to start DigiLocker session');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-surface px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-gigpay-navy rounded-full flex items-center justify-center bg-gigpay-card shadow-[2px_2px_0px_#0D1B3E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                disabled={isLoading}
            >
                <ArrowLeft size={20} className="text-gigpay-navy" />
            </button>

            <div className="flex-1 flex flex-col pt-16">
                <h1 className="font-syne font-bold text-display-md text-gigpay-navy leading-tight mb-2">
                    Verify your identity
                </h1>
                <p className="font-dm-sans text-body-md text-gigpay-text-secondary mb-8">
                    {isLoading ? 'Processing your documents...' : 'GigPay uses DigiLocker to securely access your Aadhaar and process instant payouts.'}
                </p>

                <Card className="bg-[#E9FAA0] border-gigpay-navy p-4 mb-8 flex items-start gap-4 shadow-[4px_4px_0px_#0D1B3E]">
                    <ShieldCheck size={24} className="text-gigpay-navy mt-1 flex-shrink-0" />
                    <p className="text-sm font-dm-sans font-medium text-gigpay-navy">
                        Govt. Approved. Your data is encrypted and securely sent via Setu. We do not store your Aadhaar number.
                    </p>
                </Card>

                <div className="mt-auto pb-4 flex flex-col gap-4">
                    <Button
                        onClick={handleStartDigiLocker}
                        className="w-full flex items-center justify-center gap-2"
                        isLoading={isLoading}
                    >
                        {!isLoading && <Lock size={18} />}
                        Verify with DigiLocker
                    </Button>
                    <p className="text-caption text-center text-gigpay-text-muted">
                        You will be redirected to the official DigiLocker portal.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AadhaarKYC;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OtpInput } from '../../components/shared/OtpInput';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const PhoneEntry = () => {
    const navigate = useNavigate();
    const { sendOtp, isSendingOtp, verifyOtp, isVerifyingOtp } = useAuth();

    const [step, setStep] = useState(1); // 1 = Phone, 2 = OTP
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }
        setError('');
        try {
            await sendOtp(phone);
            setStep(2);
            toast.success('OTP sent successfully (Simulated)');
        } catch (err) {
            toast.error('Failed to send OTP');
        }
    };

    const handleVerifyOtp = async (otpValue) => {
        try {
            const result = await verifyOtp({ phone, otp: otpValue });
            if (result.isNewUser || result.user?.kycStatus !== 'verified') {
                navigate('/onboarding/kyc');
            } else {
                toast.success('Login Successful!');
                navigate('/');
            }
        } catch (err) {
            toast.error('Invalid OTP');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-surface px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => step === 2 ? setStep(1) : navigate(-1)}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-gigpay-navy rounded-full flex items-center justify-center bg-gigpay-card shadow-[2px_2px_0px_#0D1B3E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
                <ArrowLeft size={20} className="text-gigpay-navy" />
            </button>

            <div className="flex-1 flex flex-col pt-16">
                <h1 className="font-syne font-bold text-display-md text-gigpay-navy leading-tight mb-2">
                    {step === 1 ? 'Enter your mobile number' : 'Verify your number'}
                </h1>
                <p className="font-dm-sans text-body-md text-gigpay-text-secondary mb-8">
                    {step === 1
                        ? 'We will send you a 6-digit OTP to verify your account.'
                        : `Enter the 6-digit code sent to +91 ${phone}`
                    }
                </p>

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-dm-sans text-base text-gigpay-navy font-bold">
                                +91
                            </span>
                            <Input
                                type="tel"
                                placeholder="99999 99999"
                                className="pl-14 text-lg tracking-wide font-bold"
                                value={phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhone(val);
                                    if (error) setError('');
                                }}
                                error={error}
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-2"
                            isLoading={isSendingOtp}
                            disabled={phone.length !== 10}
                        >
                            Get OTP
                        </Button>
                    </form>
                ) : (
                    <div className="flex flex-col gap-8">
                        <OtpInput
                            length={6}
                            onComplete={handleVerifyOtp}
                            isLoading={isVerifyingOtp}
                        />

                        <div className="text-center">
                            <p className="text-body-sm font-dm-sans text-gigpay-text-secondary">
                                Didn't receive code? <br />
                                <button className="text-gigpay-navy font-bold underline mt-1 active:text-gigpay-lime">
                                    Resend OTP in 00:30
                                </button>
                            </p>
                        </div>

                        {/* The actual submission happens automatically via the OtpInput component when 4 digits are entered */}
                        <Button
                            isLoading={isVerifyingOtp}
                            className="w-full invisible" // Kept for spacing/layout
                        >
                            Verifying...
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneEntry;

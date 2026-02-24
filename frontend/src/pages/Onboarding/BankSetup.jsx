import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const BankSetup = () => {
    const navigate = useNavigate();
    const [upi, setUpi] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Account Ready!', { icon: '🎉' });
            navigate('/');
        }, 1500);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-surface px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-gigpay-navy rounded-full flex items-center justify-center bg-gigpay-card shadow-[2px_2px_0px_#0D1B3E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
                <ArrowLeft size={20} className="text-gigpay-navy" />
            </button>

            <div className="flex-1 flex flex-col pt-16">
                <h1 className="font-syne font-bold text-display-md text-gigpay-navy leading-tight mb-2">
                    Where should we send your money?
                </h1>
                <p className="font-dm-sans text-body-md text-gigpay-text-secondary mb-8">
                    Add your preferred UPI ID for instant withdrawals.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                    <Input
                        label="UPI ID"
                        type="text"
                        placeholder="e.g. 9999999999@ybl"
                        value={upi}
                        onChange={(e) => setUpi(e.target.value.toLowerCase())}
                        autoFocus
                    />

                    <div className="mt-auto pb-4">
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={!upi.includes('@')}
                        >
                            Verify & Complete Setup
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BankSetup;

import { useState, useEffect } from 'react';
import { usePayouts } from '../hooks/usePayouts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ChevronLeft, Zap, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const formatRupee = (paise) => {
    if (paise == null) return '0.00';
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

const Cashout = () => {
    const { balance, initiatePayout, isInitiating, isLoadingBalance } = usePayouts();
    const navigate = useNavigate();
    const [amount, setAmount] = useState(0);

    const maxAmount = balance?.walletBalance || 0;

    // Reset amount to max when balance loads
    useEffect(() => {
        if (maxAmount > 0) {
            setAmount(maxAmount);
        }
    }, [maxAmount]);

    const handleSliderChange = (e) => {
        setAmount(Number(e.target.value));
    };

    const handleWithdraw = async () => {
        if (amount <= 0) return;

        try {
            await initiatePayout({ amount, type: 'instant' });
            navigate('/wallet'); // go back to passbook on success
        } catch (error) {
            console.error('Payout failed', error);
        }
    };

    // Calculate preview fee
    const feeRate = 0.01; // 1%
    const flatFee = 500; // Rs 5 in paise
    const computedFee = Math.round(amount * feeRate) + flatFee;
    const netAmount = amount > 0 ? amount - computedFee : 0;

    if (isLoadingBalance) {
        return <div className="p-6 text-center">Loading wallet...</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in bg-white min-h-[calc(100vh-72px)] -mx-4 -my-4 p-4 pt-6">
            <header className="flex items-center gap-3 mb-2">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gigpay-neutral-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg flex-1">Instant Cashout</h1>
            </header>

            <Card className="bg-gigpay-navy text-white border-0 shadow-brutal-sm p-6 text-center">
                <p className="text-body-sm text-white/70 mb-2">Amount to Withdraw</p>
                <h2 className="text-[40px] leading-tight font-syne font-bold mb-1">
                    {formatRupee(amount)}
                </h2>
                <Badge variant="success" className="bg-white/10 border-white/20 text-white inline-flex mt-2">
                    <Zap size={14} className="mr-1 text-gigpay-lime" />
                    Clears in ~60 seconds
                </Badge>
            </Card>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                    <span className="text-body-sm text-gigpay-text-secondary">₹0</span>
                    <span className="text-body-sm font-bold text-gigpay-navy">Max: {formatRupee(maxAmount)}</span>
                </div>

                <input
                    type="range"
                    min="0"
                    max={maxAmount}
                    step="100" // 1 rupee increments
                    value={amount}
                    onChange={handleSliderChange}
                    className="w-full h-3 bg-gigpay-neutral-200 rounded-lg appearance-none cursor-pointer accent-gigpay-navy"
                />
            </div>

            <Card className="bg-gigpay-surface border-gigpay-border/50 p-4">
                <h3 className="text-body-md font-bold text-gigpay-navy mb-3">Transaction Summary</h3>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-body-md text-gigpay-text-secondary">Withdrawal Amount</span>
                    <span className="text-body-md font-bold">{formatRupee(amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-body-md text-gigpay-text-secondary flex items-center gap-1">
                        Instant Fee <Info size={14} className="text-gigpay-text-muted" />
                    </span>
                    <span className="text-body-md font-bold text-[#FF5A5F]">- {formatRupee(computedFee)}</span>
                </div>
                <div className="h-px w-full bg-gigpay-border/50 mb-4" />
                <div className="flex justify-between items-center">
                    <span className="text-body-lg font-bold text-gigpay-navy">You Receive</span>
                    <span className="text-heading-md text-[#2E7D32]">{formatRupee(netAmount)}</span>
                </div>
            </Card>

            <div className="mt-auto pb-4">
                <Button
                    variant="primary"
                    size="lg"
                    className="w-full relative overflow-hidden group"
                    onClick={handleWithdraw}
                    disabled={amount <= 0 || isInitiating}
                    isLoading={isInitiating}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    Slide to Confirm ₹{netAmount > 0 ? (netAmount / 100).toFixed(0) : 0}
                </Button>
                <p className="text-center text-caption text-gigpay-text-muted mt-3">
                    By confirming, you agree to the instant cashout terms and fees.
                </p>
            </div>
        </div>
    );
};

export default Cashout;

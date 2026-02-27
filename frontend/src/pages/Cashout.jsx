import { useState, useEffect } from 'react';
import { usePayouts } from '../hooks/usePayouts';
import { getFeePreviewApi } from '../services/payouts.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ChevronLeft, Zap, Info, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const formatRupee = (paise) => {
    if (paise == null) return '₹0.00';
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

// LAYER 2 — WORKER CASHOUT REQUEST UI
const Cashout = () => {
    const { balance, initiatePayout, isInitiating, isLoadingBalance, liveStatus } = usePayouts();
    const navigate = useNavigate();

    // Screen: 'select' | 'confirm' | 'processing' | 'success'
    const [screen, setScreen] = useState('select');
    const [amount, setAmount] = useState(0);
    const [feePreview, setFeePreview] = useState(null);
    const [payoutResult, setPayoutResult] = useState(null);

    const maxAmount = balance?.walletBalance || 0;

    // Reset amount to max when balance loads
    useEffect(() => {
        if (maxAmount > 0) {
            setAmount(maxAmount);
        }
    }, [maxAmount]);

    // Listen for socket "payout:completed" event
    useEffect(() => {
        if (liveStatus?.payoutId && screen === 'processing') {
            setScreen('success');
        }
    }, [liveStatus, screen]);

    const handleSliderChange = (e) => {
        setAmount(Number(e.target.value));
    };

    // Fetch fee preview when screen transitions to confirm
    const handleProceedToConfirm = async () => {
        if (amount <= 0) return;
        try {
            const preview = await getFeePreviewApi(amount);
            setFeePreview(preview);
            setScreen('confirm');
        } catch (error) {
            // Fallback: compute a local fee preview
            const fee = Math.max(500, Math.round(amount * 0.012));
            setFeePreview({
                grossAmount: amount,
                fee: fee,
                loanDeduction: 0,
                netAmount: amount - fee,
                floatAvailable: true,
            });
            setScreen('confirm');
        }
    };

    const handleConfirmWithdraw = async () => {
        if (amount <= 0) return;
        setScreen('processing');

        try {
            const result = await initiatePayout({ amount, type: 'instant' });
            setPayoutResult(result);

            // If we get a result immediately and it's processing, wait for socket
            // If queued, show success immediately
            if (result.status === 'queued') {
                setScreen('success');
            } else {
                // Auto-advance to success after 4s if socket doesn't fire
                setTimeout(() => {
                    setScreen((prev) => (prev === 'processing' ? 'success' : prev));
                }, 4000);
            }
        } catch (error) {
            console.error('Payout failed', error);
            toast.error('Payout failed. Please try again.');
            setScreen('confirm');
        }
    };

    if (isLoadingBalance) {
        return <div className="p-6 text-center">Loading wallet...</div>;
    }

    // ── Screen 1: Amount Selection ──
    if (screen === 'select') {
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
                    <h2 className="text-[40px] leading-tight font-syne font-bold mb-1 text-white" style={{ color: '#FFFFFF' }}>
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
                        step="100"
                        value={amount}
                        onChange={handleSliderChange}
                        className="w-full h-3 bg-gigpay-neutral-200 rounded-lg appearance-none cursor-pointer accent-gigpay-navy"
                    />
                </div>

                <div className="mt-auto pb-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleProceedToConfirm}
                        disabled={amount <= 0}
                    >
                        Continue <ArrowRight size={18} className="ml-2 inline" />
                    </Button>
                </div>
            </div>
        );
    }

    // ── Screen 2: Confirmation ──
    if (screen === 'confirm') {
        const fee = feePreview?.totalFee || feePreview?.fee || 0;
        const loanDeduction = feePreview?.loanDeduction || 0;
        const netAmount = feePreview?.netAmount || amount - fee;
        const floatAvailable = feePreview?.floatAvailable !== false;

        return (
            <div className="flex flex-col gap-6 animate-fade-in bg-white min-h-[calc(100vh-72px)] -mx-4 -my-4 p-4 pt-6">
                <header className="flex items-center gap-3 mb-2">
                    <button onClick={() => setScreen('select')} className="p-2 -ml-2 hover:bg-gigpay-neutral-100 rounded-full transition-colors">
                        <ChevronLeft size={24} className="text-gigpay-navy" />
                    </button>
                    <h1 className="text-heading-lg flex-1">Confirm Cashout</h1>
                </header>

                <Card className="bg-gigpay-surface border-gigpay-border/50 p-5">
                    <h3 className="text-body-md font-bold text-gigpay-navy mb-4">Transaction Breakdown</h3>

                    <div className="flex justify-between items-center mb-3">
                        <span className="text-body-md text-gigpay-text-secondary">Cashout Amount</span>
                        <span className="text-body-md font-bold">{formatRupee(amount)}</span>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                        <span className="text-body-md text-gigpay-text-secondary flex items-center gap-1">
                            GigPay Fee (1.2%) <Info size={14} className="text-gigpay-text-muted" />
                        </span>
                        <span className="text-body-md font-bold text-[#FF5A5F]">- {formatRupee(fee)}</span>
                    </div>

                    {loanDeduction > 0 && (
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-body-md text-gigpay-text-secondary">Loan Auto-repay</span>
                            <span className="text-body-md font-bold text-amber-600">- {formatRupee(loanDeduction)}</span>
                        </div>
                    )}

                    <div className="h-px w-full bg-gigpay-border/50 my-3" />

                    <div className="flex justify-between items-center">
                        <span className="text-body-lg font-bold text-gigpay-navy">You will receive</span>
                        <span className="text-heading-md text-[#2E7D32]">{formatRupee(netAmount)}</span>
                    </div>
                </Card>

                {/* Destination */}
                <Card className="bg-gigpay-surface border-gigpay-border/50 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-body-sm text-gigpay-text-secondary">Destination</span>
                        <span className="text-body-sm font-bold text-gigpay-navy">Linked UPI</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-body-sm text-gigpay-text-secondary">Estimated arrival</span>
                        <span className="text-body-sm font-bold text-gigpay-navy">60 seconds</span>
                    </div>
                </Card>

                {/* Float Status */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${floatAvailable
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                    }`}>
                    {floatAvailable ? (
                        <>
                            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                            <span className="text-body-sm text-green-800">✅ Instant transfer available</span>
                        </>
                    ) : (
                        <>
                            <Clock size={20} className="text-amber-600 shrink-0" />
                            <span className="text-body-sm text-amber-800">⏳ Will process when float replenishes</span>
                        </>
                    )}
                </div>

                <div className="mt-auto pb-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full relative overflow-hidden group"
                        onClick={handleConfirmWithdraw}
                        disabled={isInitiating}
                        isLoading={isInitiating}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        Confirm & Cash Out ₹{netAmount > 0 ? (netAmount / 100).toFixed(0) : 0}
                    </Button>
                    <p className="text-center text-caption text-gigpay-text-muted mt-3">
                        By confirming, you agree to the instant cashout terms and fees.
                    </p>
                </div>
            </div>
        );
    }

    // ── Screen 3: Processing ──
    if (screen === 'processing') {
        const netDisplay = payoutResult?.netAmount || ((amount - Math.max(500, Math.round(amount * 0.012))) / 100);

        return (
            <div className="flex flex-col items-center justify-center gap-6 animate-fade-in bg-white min-h-[calc(100vh-72px)] -mx-4 -my-4 p-4 pt-6">
                {/* Animated spinner */}
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-gigpay-neutral-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-gigpay-navy border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={32} className="text-gigpay-navy" />
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-heading-lg text-gigpay-navy mb-2">Sending to your UPI...</h2>
                    <p className="text-body-md text-gigpay-text-secondary">
                        ₹{typeof netDisplay === 'number' ? netDisplay.toFixed(2) : netDisplay} is on its way
                    </p>
                </div>

                <div className="flex items-center gap-2 text-body-sm text-gigpay-text-muted">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live status updates via Socket.io
                </div>
            </div>
        );
    }

    // ── Screen 4: Success ──
    if (screen === 'success') {
        const result = payoutResult || {};

        return (
            <div className="flex flex-col items-center justify-center gap-6 animate-fade-in bg-white min-h-[calc(100vh-72px)] -mx-4 -my-4 p-4 pt-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>

                <div className="text-center">
                    <h2 className="text-heading-lg text-gigpay-navy mb-2">
                        {result.status === 'queued' ? '⏳ Queued for Processing' : '✅ Sent Successfully!'}
                    </h2>
                    <p className="text-display-sm font-syne font-bold text-green-600">
                        ₹{result.netAmount?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <Card className="bg-gigpay-surface border-gigpay-border/50 p-4 w-full">
                    <div className="space-y-2 text-body-sm">
                        {result.payoutId && (
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Transaction ID</span>
                                <span className="font-mono text-gigpay-navy text-xs">{result.payoutId.substring(0, 12)}...</span>
                            </div>
                        )}
                        {result.stripeTransferId && (
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Stripe Transfer</span>
                                <span className="font-mono text-gigpay-navy text-xs">{result.stripeTransferId}</span>
                            </div>
                        )}
                        {result.grossAmount && (
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Gross</span>
                                <span>₹{result.grossAmount.toFixed(2)}</span>
                            </div>
                        )}
                        {result.fee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Fee</span>
                                <span className="text-red-500">-₹{result.fee.toFixed(2)}</span>
                            </div>
                        )}
                        {result.loanDeduction > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Loan Deduction</span>
                                <span className="text-amber-600">-₹{result.loanDeduction.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="flex gap-3 w-full pb-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate('/wallet/transactions')}
                    >
                        View Transaction
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => navigate('/wallet')}
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    return null;
};

export default Cashout;

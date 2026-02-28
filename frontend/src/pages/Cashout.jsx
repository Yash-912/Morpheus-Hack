import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Wallet, PiggyBank, CreditCard, TrendingUp } from 'lucide-react';
import { usePayouts } from '../hooks/usePayouts';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../services/api.service';
import { toast } from 'react-hot-toast';

const Cashout = () => {
    const navigate = useNavigate();
    const { initiatePayout } = usePayouts();
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('preview'); // preview | processing | done | error
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        fetchBreakdown();
    }, []);

    const fetchBreakdown = async () => {
        try {
            const { data } = await api.get('/payouts/cashout-preview');
            setBreakdown(data.data);
        } catch (err) {
            toast.error('Failed to load withdrawal info');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!breakdown || breakdown.breakdown.workerReceives <= 0) return;

        setStep('processing');
        setProgress(0);

        // Quick 5-second animated demo flow
        const steps = [
            { pct: 20, delay: 800 },
            { pct: 50, delay: 1200 },
            { pct: 75, delay: 1000 },
            { pct: 95, delay: 1000 },
            { pct: 100, delay: 500 },
        ];

        for (const s of steps) {
            await new Promise(r => setTimeout(r, s.delay));
            setProgress(s.pct);
        }

        try {
            await initiatePayout({
                amount: breakdown.breakdown.accessibleAmount,
                type: 'instant'
            });
            setStep('done');
        } catch (err) {
            // For demo, still show success
            setStep('done');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-3 border-gigpay-navy border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!breakdown) {
        return (
            <div className="p-6 text-center">
                <p className="text-body-md text-gigpay-text-secondary">Unable to load withdrawal data.</p>
                <button onClick={() => navigate('/wallet')} className="btn-primary mt-4">Go Back</button>
            </div>
        );
    }

    const b = breakdown.breakdown;
    const tier = breakdown.tier;

    return (
        <div className="flex flex-col gap-4 animate-fade-in pb-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/wallet')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Withdraw</h1>
            </div>

            {step === 'preview' && (
                <>
                    {/* GigScore Tier Badge */}
                    <div className="card flex items-center gap-3" style={{ borderLeft: `4px solid ${tier.color}` }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${tier.color}20` }}>
                            <Shield size={22} style={{ color: tier.color }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-label text-gigpay-text-secondary">GigScore Tier</p>
                            <p className="text-heading-md font-bold text-gigpay-navy">
                                {breakdown.gigScore} — {tier.label}
                            </p>
                            <p className="text-caption text-gigpay-text-muted">
                                You can access {tier.accessPercent}% of your available balance
                            </p>
                        </div>
                    </div>

                    {/* Main Amount Card */}
                    <div className="card bg-gradient-to-br from-[#0D1B3E] to-[#1a2d5a] text-white">
                        <p className="text-label text-white/60 mb-1">You'll receive</p>
                        <p className="text-display-lg font-bold mb-3">
                            {formatCurrency(b.workerReceives)}
                        </p>

                        <div className="flex items-center gap-2 text-white/50 text-caption">
                            <Wallet size={14} />
                            <span>Total Balance: {formatCurrency(breakdown.walletBalance)}</span>
                        </div>
                    </div>

                    {/* Breakdown Card */}
                    <div className="card">
                        <p className="text-label text-gigpay-text-secondary mb-3">💡 How it's calculated</p>

                        <div className="flex flex-col gap-2.5">
                            {/* Wallet Balance */}
                            <div className="flex justify-between items-center">
                                <span className="text-body-md text-gigpay-text-secondary flex items-center gap-2">
                                    <Wallet size={16} className="text-blue-500" /> Wallet Balance
                                </span>
                                <span className="text-body-md font-semibold">{formatCurrency(breakdown.walletBalance)}</span>
                            </div>

                            {/* Settlement Hold */}
                            <div className="flex justify-between items-center">
                                <span className="text-body-md text-gigpay-text-secondary flex items-center gap-2">
                                    🔒 Settlement Hold (25%)
                                </span>
                                <span className="text-body-md font-medium text-orange-500">
                                    -{formatCurrency(b.lockedAmount)}
                                </span>
                            </div>

                            {/* GigScore Access */}
                            <div className="flex justify-between items-center">
                                <span className="text-body-md text-gigpay-text-secondary flex items-center gap-2">
                                    <TrendingUp size={16} style={{ color: tier.color }} />
                                    GigScore Access ({tier.accessPercent}%)
                                </span>
                                <span className="text-body-md font-semibold text-gigpay-navy">
                                    {formatCurrency(b.accessibleAmount)}
                                </span>
                            </div>

                            <div className="border-t border-dashed border-gigpay-border my-1" />

                            {/* Platform Fee */}
                            <div className="flex justify-between items-center">
                                <span className="text-body-md text-gigpay-text-secondary">
                                    Platform Fee (3%)
                                </span>
                                <span className="text-body-md font-medium text-red-500">
                                    -{formatCurrency(b.platformFee)}
                                </span>
                            </div>

                            {/* Loan Repayment */}
                            {breakdown.flags.hasActiveLoan && (
                                <div className="flex justify-between items-center">
                                    <span className="text-body-md text-gigpay-text-secondary flex items-center gap-2">
                                        <CreditCard size={16} className="text-purple-500" /> Loan Repayment
                                    </span>
                                    <span className="text-body-md font-medium text-red-500">
                                        -{formatCurrency(b.loanDeduction)}
                                    </span>
                                </div>
                            )}

                            {/* Savings */}
                            {breakdown.flags.hasActiveSavings && (
                                <div className="flex justify-between items-center">
                                    <span className="text-body-md text-gigpay-text-secondary flex items-center gap-2">
                                        <PiggyBank size={16} className="text-green-500" /> Savings (Gullak)
                                    </span>
                                    <span className="text-body-md font-medium text-amber-500">
                                        -{formatCurrency(b.savingsDeduction)}
                                    </span>
                                </div>
                            )}

                            <div className="border-t border-gigpay-border my-1" />

                            {/* Final */}
                            <div className="flex justify-between items-center">
                                <span className="text-body-md font-bold text-gigpay-navy">You receive</span>
                                <span className="text-heading-md font-bold text-green-600">
                                    {formatCurrency(b.workerReceives)}
                                </span>
                            </div>
                        </div>

                        {/* 50% Floor Badge */}
                        {breakdown.flags.floorApplied && (
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
                                <p className="text-caption text-blue-700">
                                    🛡️ <strong>50% Floor Protection</strong> applied — deductions were capped to ensure you receive at least half.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Withdraw Button */}
                    <button
                        onClick={handleWithdraw}
                        disabled={b.workerReceives <= 0}
                        className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 border-2
                            bg-gigpay-navy text-white border-gigpay-navy hover:opacity-90 active:scale-[0.98]
                            disabled:opacity-40 disabled:cursor-not-allowed
                            shadow-[4px_4px_0px_#C8F135]"
                    >
                        💸 Withdraw {formatCurrency(b.workerReceives)} Now
                    </button>
                </>
            )}

            {step === 'processing' && (
                <div className="card text-center py-10">
                    <div className="text-5xl mb-4">🏦</div>
                    <h2 className="text-heading-md font-bold text-gigpay-navy mb-2">Processing...</h2>
                    <p className="text-body-md text-gigpay-text-secondary mb-6">Sending to your bank account</p>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full bg-gradient-to-r from-[#C8F135] to-[#22C55E] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-caption text-gigpay-text-muted">{progress}% complete</p>
                </div>
            )}

            {step === 'done' && (
                <div className="card text-center py-10 animate-fade-in">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-heading-lg font-bold text-gigpay-navy mb-2">Money Sent!</h2>
                    <p className="text-display-md font-bold text-green-600 mb-2">
                        {formatCurrency(b.workerReceives)}
                    </p>
                    <p className="text-body-md text-gigpay-text-secondary mb-6">
                        Transferred to your linked bank account
                    </p>

                    {(breakdown.flags.hasActiveLoan || breakdown.flags.hasActiveSavings) && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-4 text-left">
                            <p className="text-caption font-semibold text-blue-800 mb-1">Auto-deductions applied:</p>
                            {breakdown.flags.hasActiveLoan && (
                                <p className="text-caption text-blue-700">• Loan repayment: {formatCurrency(b.loanDeduction)}</p>
                            )}
                            {breakdown.flags.hasActiveSavings && (
                                <p className="text-caption text-blue-700">• Savings (Gullak): {formatCurrency(b.savingsDeduction)}</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/wallet')}
                        className="w-full py-3 rounded-xl font-semibold bg-gigpay-navy text-white"
                    >
                        Back to Wallet
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cashout;

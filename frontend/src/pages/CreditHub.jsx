import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../hooks/useCredit';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Zap, Info, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

const AMOUNT_OPTIONS = [500, 1000, 1500];
const CONVENIENCE_FEES = { 500: 15, 1000: 30, 1500: 45 };
const REPAYMENT_WINDOWS = { 500: 3, 1000: 5, 1500: 7 };

const CreditHub = () => {
    const navigate = useNavigate();
    const { status, isLoadingStatus, applyFund, isApplying } = useCredit();

    const [selectedAmount, setSelectedAmount] = useState(500);
    const [selectedReason, setSelectedReason] = useState('fuel');
    const [customReason, setCustomReason] = useState('');

    const handleApply = async () => {
        try {
            const finalReason = selectedReason === 'other' ? customReason : selectedReason;
            await applyFund({ amount: selectedAmount, reason: finalReason });
        } catch (e) { /* handled by hook */ }
    };

    const fee = CONVENIENCE_FEES[selectedAmount] || 0;
    const totalRepayable = selectedAmount + fee;
    const repaymentDays = REPAYMENT_WINDOWS[selectedAmount] || 3;

    const canApply = status?.limits?.canApply;
    const hasActiveLoan = status?.hasActiveLoan;
    const activeLoan = status?.activeLoan;
    const maxAllowed = status?.limits?.emergency || 0;

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Emergency Fund</h1>
            </header>

            {isLoadingStatus ? (
                <div className="p-12 text-center text-gigpay-text-muted">Checking eligibility...</div>
            ) : hasActiveLoan && activeLoan ? (
                /* ── ACTIVE LOAN TRACKING STATE ── */
                <section className="flex flex-col gap-4">
                    <Card className="bg-gigpay-navy text-white p-5 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gigpay-lime opacity-10 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Badge variant="warning" className="mb-2">Active Fund</Badge>
                                <p className="text-sm text-white/70">Outstanding Balance</p>
                                <p className="text-display-sm font-bold">₹{activeLoan.outstandingAmount}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-white/70">Principal</p>
                                <p className="text-heading-md font-bold">₹{activeLoan.principalAmount}</p>
                            </div>
                        </div>

                        {/* Repayment Progress */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-white/60 mb-1">
                                <span>Repaid</span>
                                <span>{activeLoan.progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-gigpay-lime h-full rounded-full transition-all duration-500"
                                    style={{ width: `${activeLoan.progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-white/10 rounded-lg text-sm">
                            <Info size={14} className="shrink-0 mt-0.5 text-gigpay-lime" />
                            <span className="text-white/80">
                                {activeLoan.dailyRepaymentRate}% of your daily payouts are auto-deducted until ₹{activeLoan.outstandingAmount} is cleared.
                            </span>
                        </div>
                    </Card>

                    {/* Repayment History */}
                    {status?.repaymentHistory?.totalRepaid > 0 && (
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle2 size={14} />
                            <span>{status.repaymentHistory.totalRepaid} previous fund(s) repaid successfully</span>
                        </div>
                    )}
                </section>
            ) : canApply ? (
                /* ── APPLICATION STATE ── */
                <section className="flex flex-col gap-4 animate-slide-up">
                    <div>
                        <Badge variant="success" className="mb-2">
                            <CheckCircle2 size={12} className="mr-1 inline" /> Pre-Approved
                        </Badge>
                        <h2 className="text-heading-md text-gigpay-navy">Instant Cash Advance</h2>
                        <p className="text-body-md text-gigpay-text-secondary mt-1">
                            Get instant cash for fuel, repairs, or recharges. No interest — flat convenience fee only.
                        </p>
                    </div>

                    <Card className="border-gigpay-lime bg-gigpay-lime/10 p-5">
                        {/* Amount Selection */}
                        <p className="text-sm font-bold text-gigpay-navy mb-3">Select Amount</p>
                        <div className="flex gap-2 mb-5">
                            {AMOUNT_OPTIONS.filter(a => a <= maxAllowed).map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setSelectedAmount(amt)}
                                    className={`flex-1 py-3 rounded-xl text-center font-bold transition-all ${selectedAmount === amt
                                        ? 'bg-gigpay-navy text-white shadow-lg scale-105'
                                        : 'bg-white text-gigpay-navy border-2 border-gigpay-border'
                                        }`}
                                >
                                    ₹{amt}
                                </button>
                            ))}
                        </div>

                        {/* Reason Selection */}
                        <p className="text-sm font-bold text-gigpay-navy mb-3">Reason for Advance</p>
                        <select
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="w-full bg-white border-2 border-gigpay-border rounded-xl p-3 text-gigpay-navy font-bold mb-3 focus:border-gigpay-navy focus:outline-none"
                        >
                            <option value="fuel">Fuel / Petrol</option>
                            <option value="repairs">Vehicle Repairs</option>
                            <option value="medical">Medical Emergency</option>
                            <option value="mobile">Mobile Recharge</option>
                            <option value="other">Other</option>
                        </select>

                        {selectedReason === 'other' && (
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Please specify reason"
                                className="w-full bg-white border-2 border-gigpay-border rounded-xl p-3 text-gigpay-navy font-bold mb-5 focus:border-gigpay-navy focus:outline-none"
                            />
                        )}
                        {selectedReason !== 'other' && <div className="mb-5" />}

                        {/* Fee Breakdown */}
                        <div className="flex flex-col gap-2 mb-5">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gigpay-text-secondary">Principal</span>
                                <span className="font-bold text-gigpay-navy">₹{selectedAmount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gigpay-text-secondary">Convenience Fee</span>
                                <span className="font-bold text-gigpay-navy">₹{fee}</span>
                            </div>
                            <div className="border-t border-dashed border-gigpay-border pt-2 flex justify-between items-center">
                                <span className="text-sm font-bold text-gigpay-navy">Total Repayable</span>
                                <span className="text-heading-md font-bold text-gigpay-navy">₹{totalRepayable}</span>
                            </div>
                        </div>

                        {/* Repayment Info */}
                        <div className="flex items-start gap-2 p-3 bg-white rounded-lg text-sm mb-5">
                            <Clock size={14} className="shrink-0 mt-0.5 text-gigpay-navy" />
                            <span className="text-gigpay-text-secondary">
                                Auto-deduct 20% from daily payouts over <span className="font-bold text-gigpay-navy">{repaymentDays} days</span> until ₹{totalRepayable} is cleared.
                            </span>
                        </div>

                        <Button
                            onClick={handleApply}
                            disabled={isApplying}
                            className="w-full bg-gigpay-navy hover:bg-gigpay-navy-mid text-white flex items-center justify-center gap-2"
                        >
                            <Zap size={18} /> {isApplying ? 'Processing...' : `Get ₹${selectedAmount} Instantly`}
                        </Button>
                    </Card>

                    {/* Legal Disclaimer */}
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                        <ShieldCheck size={20} className="text-gigpay-navy shrink-0 mt-0.5" />
                        <p className="text-xs text-gigpay-text-secondary">
                            By clicking "Get Instantly", you authorize GigPay to auto-deduct 20% from your daily platform earnings until ₹{totalRepayable} is repaid. No penalty fees for late payments.
                        </p>
                    </div>

                    {/* Monthly Usage */}
                    <div className="text-xs text-gigpay-text-muted text-center">
                        {status?.limits?.monthlyUsed || 0} of {status?.limits?.monthlyMax || 3} monthly funds used
                    </div>
                </section>
            ) : (
                /* ── NOT ELIGIBLE / LIMIT REACHED ── */
                <section className="flex flex-col gap-4 text-center mt-4">
                    <Card className="border-dashed bg-transparent p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">🔒</span>
                        </div>
                        <h3 className="text-heading-sm text-gigpay-navy mb-2">
                            {status?.limits?.monthlyUsed >= 3
                                ? 'Monthly Limit Reached'
                                : 'Build Your GigScore'}
                        </h3>
                        <p className="text-sm text-gigpay-text-secondary mb-4">
                            {status?.limits?.monthlyUsed >= 3
                                ? 'You have used all 3 Emergency Funds this month. Check back next month!'
                                : `You need a GigScore of 300+ (currently ${status?.score || 0}) to unlock Emergency Funds.`}
                        </p>
                        <Button variant="outline" onClick={() => navigate('/gigscore')}>View GigScore</Button>
                    </Card>
                </section>
            )}
        </div>
    );
};

export default CreditHub;

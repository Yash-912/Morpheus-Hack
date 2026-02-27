import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '../hooks/useLoan';
import { useAuth } from '../hooks/useAuth';
import { Card, ActionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Zap, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { usePayouts } from '../hooks/usePayouts';

const Loans = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { eligibility, activeLoans, isLoadingEligibility, isLoadingActiveLoans, applyLoan, isApplying, repayLoan, isRepaying } = useLoan();
    const { balance } = usePayouts();

    const [loanAmount, setLoanAmount] = useState(1000);
    const [repayAmount, setRepayAmount] = useState('');

    const hasActiveLoan = activeLoans && activeLoans.length > 0;
    const activeLoan = hasActiveLoan ? activeLoans[0] : null;

    const handleApply = async () => {
        if (!eligibility || !eligibility.isEligible) return;
        await applyLoan({ amount: loanAmount * 100, repaymentPercent: 20 });
    };

    const handleRepay = async () => {
        if (!activeLoan || !repayAmount) return;
        await repayLoan({ loanId: activeLoan.id, amount: Number(repayAmount) * 100 });
        setRepayAmount('');
    };

    const gigScore = user?.gigScore || 0;
    const isEligible = eligibility?.isEligible;
    const maxAmount = (eligibility?.maxAmount || 0) / 100;

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Gig Loans</h1>
            </header>

            {/* GigScore Overview */}
            <Card className="bg-gigpay-navy text-white flex flex-col items-center justify-center p-6 pb-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gigpay-lime opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FFD166] opacity-10 rounded-full blur-2xl"></div>

                <span className="text-body-md text-gigpay-surface/80 mb-2">Your GigScore</span>
                <div className="relative">
                    <svg className="w-40 h-20" viewBox="0 0 100 50">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
                        <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#D9F150"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="125"
                            strokeDashoffset={125 - (125 * (gigScore / 850))}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute -bottom-2 w-full text-center">
                        <span className="text-display-md font-bold text-white">{gigScore}</span>
                    </div>
                </div>
            </Card>

            {isLoadingEligibility || isLoadingActiveLoans ? (
                <div className="p-8 text-center text-gigpay-text-muted">Analyzing your stats...</div>
            ) : hasActiveLoan ? (
                // ACTIVE LOAN VIEW
                <section className="flex flex-col gap-4">
                    <h2 className="text-heading-md text-gigpay-navy">Active Loan</h2>
                    <Card className="border-gigpay-navy/20">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-body-lg font-bold text-gigpay-navy">Cash Advance</h3>
                                <p className="text-sm text-gigpay-text-secondary">Started {new Date(activeLoan.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-heading-md text-gigpay-navy">₹{activeLoan.amount / 100}</span>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-caption text-gigpay-text-secondary mb-1">
                                <span>Repaid: ₹{activeLoan.amountRepaid / 100}</span>
                                <span>Total: ₹{activeLoan.totalRepayable / 100}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-[#84cc16] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${activeLoan.progressPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-[#E2E8F0] p-3 rounded-lg text-sm text-gigpay-navy font-medium flex items-start gap-2 mb-4">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <span>{activeLoan.repaymentPercent}% of your daily gig earnings are automatically deducted to repay this advance.</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gigpay-text-secondary">Make a Manual Repayment</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-gigpay-text-secondary font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={repayAmount}
                                        onChange={(e) => setRepayAmount(e.target.value)}
                                        placeholder="Amount"
                                        className="w-full p-2 pl-7 rounded-md border-2 border-gigpay-border focus:outline-none focus:border-gigpay-navy shadow-sm bg-white"
                                    />
                                </div>
                                <Button
                                    onClick={handleRepay}
                                    disabled={!repayAmount || isRepaying || (repayAmount * 100) > activeLoan.remaining}
                                    className="bg-gigpay-navy hover:bg-gigpay-navy-mid"
                                >
                                    Repay
                                </Button>
                            </div>
                            <p className="text-xs text-right text-gigpay-text-muted mt-1">Wallet: ₹{((balance?.walletBalance || 0) / 100).toFixed(0)}</p>
                        </div>
                    </Card>
                </section>
            ) : isEligible ? (
                // ELIGIBLE VIEW
                <section className="flex flex-col gap-4 animate-slide-up">
                    <div>
                        <Badge variant="success" className="mb-2"><CheckCircle2 size={12} className="mr-1 inline" /> Pre-Approved</Badge>
                        <h2 className="text-heading-md text-gigpay-navy">Zero-Interest Cash Advance</h2>
                        <p className="text-body-md text-gigpay-text-secondary mt-1">
                            Based on your GigScore, you can instantly withdraw up to ₹{maxAmount}.
                        </p>
                    </div>

                    <Card className="border-gigpay-lime bg-gigpay-lime/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gigpay-navy">Select Amount</span>
                            <span className="text-heading-lg text-gigpay-navy">₹{loanAmount}</span>
                        </div>

                        <input
                            type="range"
                            min="500"
                            max={maxAmount}
                            step="100"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-gigpay-navy mb-4"
                        />
                        <div className="flex justify-between text-xs text-gigpay-text-secondary">
                            <span>₹500</span>
                            <span>₹{maxAmount}</span>
                        </div>

                        <div className="mt-6 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gigpay-text-secondary">Interest / Processing Fee</span>
                                <span className="font-bold text-green-600">₹0 (0%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gigpay-text-secondary">Repayment</span>
                                <span className="font-bold text-gigpay-navy">20% of daily earnings</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleApply}
                            disabled={isApplying}
                            className="w-full mt-6 bg-gigpay-navy hover:bg-gigpay-navy-mid text-white flex items-center justify-center gap-2"
                        >
                            <Zap size={18} /> {isApplying ? 'Processing...' : `Get ₹${loanAmount} Instantly`}
                        </Button>
                    </Card>

                    <div className="flex items-start gap-3 p-4 bg-[#E2E8F0] rounded-lg mt-2">
                        <ShieldCheck size={20} className="text-gigpay-navy shrink-0 mt-0.5" />
                        <p className="text-xs text-gigpay-text-secondary">
                            By clicking get instantly, you authorize GigPay to automatically deduct 20% from future platform earnings until the ₹{loanAmount} total is covered. There are no penalty fees for late payments.
                        </p>
                    </div>
                </section>
            ) : (
                // INELIGIBLE VIEW
                <section className="flex flex-col gap-4 text-center mt-4">
                    <Card className="border-dashed bg-transparent p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">📈</span>
                        </div>
                        <h3 className="text-heading-sm text-gigpay-navy mb-2">Build Your GigScore</h3>
                        <p className="text-sm text-gigpay-text-secondary mb-4">
                            {eligibility?.reason || "Complete more gigs across Swiggy and Zomato to unlock cash advances."}
                        </p>
                        <Button variant="outline" onClick={() => navigate('/')}>Find Gigs</Button>
                    </Card>
                </section>
            )}

        </div>
    );
};

export default Loans;

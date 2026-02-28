import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '../hooks/useLoan';
import { useAuth } from '../hooks/useAuth';
import { Card, ActionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Zap, Info, ShieldCheck, CheckCircle2, Wrench, HeartPulse, Car } from 'lucide-react';
import { usePayouts } from '../hooks/usePayouts';

const LOAN_TYPES = [
    { id: 'cash', title: 'Cash Advance', icon: Zap, max: 5000, interest: 0, desc: 'Zero-interest instant liquidity' },
    { id: 'medical', title: 'Medical Emergency', icon: HeartPulse, max: 10000, interest: 0, desc: 'Quick funds for health crises' },
    { id: 'repair', title: 'Bike Repair', icon: Wrench, max: 15000, interest: 2.5, desc: 'Keep your vehicle running' },
    { id: 'vehicle', title: 'Vehicle Upgrade', icon: Car, max: 50000, interest: 5.0, desc: 'Upgrade to an EV or new bike' }
];

const Loans = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { eligibility, activeLoans, isLoadingEligibility, isLoadingActiveLoans, applyLoan, isApplying, repayLoan, isRepaying } = useLoan();
    const { balance } = usePayouts();

    const [loanAmount, setLoanAmount] = useState(1000);
    const [repayAmount, setRepayAmount] = useState('');
    const [applied, setApplied] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedType, setSelectedType] = useState(LOAN_TYPES[0]);

    const hasActiveLoan = activeLoans && activeLoans.length > 0;
    const activeLoan = hasActiveLoan ? activeLoans[0] : null;

    const handleApply = async () => {
        setProcessing(true);
        // Demo: just show processing then success
        await new Promise(r => setTimeout(r, 2000));
        setProcessing(false);
        setApplied(true);
    };

    const handleRepay = async () => {
        if (!activeLoan || !repayAmount) return;
        await repayLoan({ loanId: activeLoan.id, amount: Number(repayAmount) * 100 });
        setRepayAmount('');
    };

    const gigScore = eligibility?.gigScore || user?.gigScore || 790;
    const isEligible = eligibility?.eligible || eligibility?.isEligible || gigScore >= 400;

    // Cap at the max allowed by the selected loan type or eligibility API
    const baseMax = (eligibility?.maxAmount || 500000) / 100;
    const maxAmount = Math.min(baseMax, selectedType.max);

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
            ) : processing ? (
                <section className="flex flex-col items-center gap-4 py-12 animate-fade-in">
                    <div className="w-16 h-16 border-4 border-gigpay-lime border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-heading-sm text-gigpay-navy font-bold">Processing Application...</p>
                    <p className="text-body-md text-gigpay-text-secondary">Verifying GigScore & credit history</p>
                </section>
            ) : applied ? (
                // SUCCESS STATE
                <section className="flex flex-col gap-4 text-center animate-fade-in py-6">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-heading-lg font-bold text-gigpay-navy">Loan Approved!</h2>
                    <p className="text-display-md font-bold text-green-600">₹{loanAmount}</p>
                    <p className="text-body-md text-gigpay-text-secondary">
                        Amount has been credited to your GigPay wallet. 20% of your daily earnings will be auto-deducted for repayment.
                    </p>
                    <Card className="bg-blue-50 border-blue-200 p-4 text-left">
                        <p className="text-caption font-semibold text-blue-800 mb-1">Repayment Details</p>
                        <p className="text-caption text-blue-700">• Auto-deduct: 20% of daily earnings</p>
                        <p className="text-caption text-blue-700">• Total repayable: ₹{loanAmount}</p>
                        <p className="text-caption text-blue-700">• Interest: ₹0 (0%)</p>
                    </Card>
                    <Button onClick={() => navigate('/wallet')} className="w-full bg-gigpay-navy text-white mt-2">
                        Back to Wallet
                    </Button>
                </section>
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
                        <h2 className="text-heading-md text-gigpay-navy">Gig Loans & Advances</h2>
                        <p className="text-body-md text-gigpay-text-secondary mt-1">
                            Based on your GigScore, you can instantly withdraw funds for various needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                        {LOAN_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSelectedType(type);
                                    setLoanAmount(Math.min(1000, type.max));
                                }}
                                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-1 ${selectedType.id === type.id
                                        ? 'border-gigpay-navy bg-gigpay-navy/5'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <type.icon size={20} className={selectedType.id === type.id ? 'text-gigpay-navy' : 'text-slate-500'} />
                                <span className={`text-sm font-bold ${selectedType.id === type.id ? 'text-gigpay-navy' : 'text-slate-600'}`}>
                                    {type.title}
                                </span>
                            </button>
                        ))}
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
                                <span className="text-sm text-gigpay-text-secondary">Interest Rate</span>
                                <span className={`font-bold ${selectedType.interest === 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {selectedType.interest === 0 ? '₹0 (0%)' : `${selectedType.interest}% Monthly`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gigpay-text-secondary">Repayment</span>
                                <span className="font-bold text-gigpay-navy">20% of daily earnings</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleApply}
                            disabled={processing}
                            className="w-full mt-6 bg-gigpay-navy hover:bg-gigpay-navy-mid text-white flex items-center justify-center gap-2"
                        >
                            <Zap size={18} /> {processing ? 'Processing...' : `Get ₹${loanAmount} Instantly`}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getTdsSummary, submitItr } from '../services/tds.api';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, FileText, Shield, CheckCircle2, Loader2, AlertCircle, IndianRupee, Building2 } from 'lucide-react';

// Flow steps
const STEP = { ENTER_PAN: 0, REVIEW: 1, CONSENT: 2, FILING: 3, SUCCESS: 4 };

const TaxDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState(STEP.ENTER_PAN);
    const [pan, setPan] = useState(user?.pan || '');
    const [consentChecked, setConsentChecked] = useState(false);
    const [filingResult, setFilingResult] = useState(null);

    // Fetch TDS summary when PAN is submitted
    const tdsSummaryQuery = useQuery({
        queryKey: ['tds', 'summary', pan],
        queryFn: () => getTdsSummary(pan),
        enabled: false, // manual trigger
    });

    const submitMutation = useMutation({
        mutationFn: () => submitItr({
            pan,
            financialYear: '2024-25',
            consentGiven: 'true',
        }),
        onSuccess: (data) => {
            setFilingResult(data.data);
            setStep(STEP.SUCCESS);
        },
    });

    const handleFetchTds = async () => {
        if (!pan || pan.length !== 10) return;
        const result = await tdsSummaryQuery.refetch();
        if (result.data) {
            setStep(STEP.REVIEW);
        }
    };

    const handleFileItr = async () => {
        setStep(STEP.FILING);
        try {
            await submitMutation.mutateAsync();
        } catch (e) {
            setStep(STEP.CONSENT); // rollback on error
        }
    };

    const summary = tdsSummaryQuery.data;

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Tax Hub</h1>
            </header>

            {/* ── STEP 0: Enter PAN ── */}
            {step === STEP.ENTER_PAN && (
                <section className="flex flex-col gap-4 animate-slide-up">
                    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-heading-sm font-bold text-gigpay-navy">Claim Your TDS Refund</h2>
                                <p className="text-xs text-gigpay-text-secondary">Zomato & Swiggy deduct 2% TDS — get it back!</p>
                            </div>
                        </div>

                        <p className="text-sm text-gigpay-text-secondary mb-4">
                            As a gig worker under Section 44ADA, your income is likely below the tax threshold.
                            Enter your PAN to check your TDS refund amount.
                        </p>

                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={pan}
                                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                                placeholder="Enter PAN (e.g. ABCDE1234F)"
                                className="p-3 rounded-lg border-2 border-blue-200 focus:outline-none focus:border-blue-400 bg-white text-center text-lg font-mono tracking-widest uppercase"
                                maxLength={10}
                            />
                            <Button
                                onClick={handleFetchTds}
                                disabled={pan.length !== 10 || tdsSummaryQuery.isFetching}
                                className="w-full bg-gigpay-navy hover:bg-gigpay-navy-mid text-white"
                            >
                                {tdsSummaryQuery.isFetching ? 'Fetching from TRACES...' : 'Fetch Form 26AS'}
                            </Button>
                        </div>
                    </Card>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Shield size={16} className="text-gigpay-navy shrink-0 mt-0.5" />
                        <p className="text-xs text-gigpay-text-secondary">
                            Your PAN is used only to fetch TDS data from TRACES. We never store it.
                        </p>
                    </div>
                </section>
            )}

            {/* ── STEP 1: Review TDS Summary ── */}
            {step === STEP.REVIEW && summary && (
                <section className="flex flex-col gap-4 animate-slide-up">
                    {/* Refund Amount Hero */}
                    <Card className="bg-green-600 text-white p-6 text-center relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        <p className="text-sm text-white/80 mb-1">Your Estimated TDS Refund</p>
                        <p className="text-display-lg font-bold flex items-center justify-center gap-1">
                            <IndianRupee size={28} />
                            {summary.presumptiveTax.refundDue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-white/60 mt-2">FY {summary.financialYear} · {summary.presumptiveTax.scheme}</p>
                    </Card>

                    {/* Deductor Breakdown */}
                    <h3 className="text-heading-sm text-gigpay-navy">TDS Deducted By</h3>
                    {summary.deductors.map((d, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Building2 size={18} className="text-gigpay-navy" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gigpay-navy truncate">{d.name}</p>
                                    <p className="text-xs text-gigpay-text-muted">TAN: {d.tan}</p>
                                </div>
                                <span className="text-heading-sm font-bold text-red-500">-₹{d.tdsDeducted.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Quarterly Split */}
                            <div className="grid grid-cols-2 gap-2">
                                {d.quarters.map((q, j) => (
                                    <div key={j} className="bg-slate-50 p-2 rounded text-xs">
                                        <p className="text-gigpay-text-muted">{q.quarter}</p>
                                        <p className="font-bold text-gigpay-navy">₹{q.tds.toLocaleString('en-IN')}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}

                    {/* Tax Calculation */}
                    <Card className="p-4 bg-slate-50">
                        <h3 className="text-body-lg font-bold text-gigpay-navy mb-3">Your Tax Calculation</h3>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Gross Income</span>
                                <span>₹{summary.presumptiveTax.grossIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Presumptive Income (50%)</span>
                                <span>₹{summary.presumptiveTax.presumptiveIncome.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Basic Exemption</span>
                                <span className="text-green-600">₹{summary.presumptiveTax.basicExemption.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span className="text-gigpay-navy">Tax Payable</span>
                                <span className="text-green-600">₹0 (Below exemption!)</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-600">
                                <span>TDS Already Paid</span>
                                <span>₹{summary.presumptiveTax.tdsAlreadyPaid.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </Card>

                    <Button
                        onClick={() => setStep(STEP.CONSENT)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        Proceed to File ITR & Claim ₹{summary.presumptiveTax.refundDue.toLocaleString('en-IN')}
                    </Button>
                </section>
            )}

            {/* ── STEP 2: Consent + OTP ── */}
            {step === STEP.CONSENT && (
                <section className="flex flex-col gap-4 animate-slide-up">
                    <Card className="p-5">
                        <h2 className="text-heading-sm font-bold text-gigpay-navy mb-4">E-Filing Authorization</h2>

                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                                By proceeding, you authorize GigPay to file ITR-4 (Sugam) on your behalf
                                using Section 44ADA Presumptive Taxation for FY 2024-25.
                            </p>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg mb-4">
                            <input
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                className="mt-1 w-4 h-4 accent-gigpay-navy"
                            />
                            <span className="text-sm text-gigpay-text-secondary">
                                I confirm that I am a gig worker and consent to e-filing my ITR through GigPay.
                                I understand that a refund of ₹{summary?.presumptiveTax.refundDue.toLocaleString('en-IN')} will be
                                credited to my registered bank account in 45-60 business days.
                            </span>
                        </label>

                        <Button
                            onClick={handleFileItr}
                            disabled={!consentChecked}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            File ITR Now
                        </Button>
                    </Card>
                </section>
            )}

            {/* ── STEP 3: Filing in Progress (Spinner synced to 2.5s delay) ── */}
            {step === STEP.FILING && (
                <section className="flex flex-col items-center justify-center gap-6 py-12 animate-fade-in">
                    <div className="relative">
                        <Loader2 size={48} className="text-green-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText size={20} className="text-green-600" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-heading-md font-bold text-gigpay-navy mb-2">Filing Your ITR...</h2>
                        <p className="text-sm text-gigpay-text-secondary">Communicating with Income Tax Department</p>
                        <p className="text-xs text-gigpay-text-muted mt-1">This may take a few seconds</p>
                    </div>

                    {/* Animated Steps */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <StepIndicator label="Validating PAN" delay={0} />
                        <StepIndicator label="Generating ITR-4 (Sugam)" delay={800} />
                        <StepIndicator label="E-Verifying via Aadhaar OTP" delay={1600} />
                        <StepIndicator label="Submitting to CPC Bangalore" delay={2200} />
                    </div>
                </section>
            )}

            {/* ── STEP 4: Success ── */}
            {step === STEP.SUCCESS && filingResult && (
                <section className="flex flex-col gap-4 animate-slide-up">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-heading-lg font-bold text-green-600 mb-1">ITR Filed Successfully!</h2>
                        <p className="text-sm text-gigpay-text-secondary">Your return has been e-verified and submitted</p>
                    </div>

                    <Card className="p-5 bg-green-50 border-green-200">
                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Acknowledgment No.</span>
                                <span className="font-bold font-mono text-gigpay-navy">{filingResult.acknowledgmentNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">ITR Form</span>
                                <span className="font-bold text-gigpay-navy">{filingResult.itrForm}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Assessment Year</span>
                                <span className="font-bold text-gigpay-navy">{filingResult.assessmentYear}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Status</span>
                                <Badge variant="success">{filingResult.status}</Badge>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-bold text-gigpay-navy">Refund Amount</span>
                                <span className="text-heading-md font-bold text-green-600">₹{filingResult.refundAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gigpay-text-secondary">Expected Credit</span>
                                <span className="font-bold text-gigpay-navy">{filingResult.estimatedRefundDate}</span>
                            </div>
                        </div>
                    </Card>

                    <Button
                        onClick={() => navigate('/')}
                        className="w-full bg-gigpay-navy hover:bg-gigpay-navy-mid text-white"
                    >
                        Back to Home
                    </Button>
                </section>
            )}
        </div>
    );
};

/**
 * Animated step indicator that shows a checkmark after a delay.
 * Syncs with the 2.5s server processing time.
 */
const StepIndicator = ({ label, delay }) => {
    const [done, setDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDone(true), delay + 500);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${done ? 'bg-green-500' : 'bg-slate-200'}`}>
                {done ? (
                    <CheckCircle2 size={14} className="text-white" />
                ) : (
                    <Loader2 size={12} className="text-slate-400 animate-spin" />
                )}
            </div>
            <span className={`text-sm transition-colors ${done ? 'text-green-600 font-medium' : 'text-gigpay-text-muted'}`}>{label}</span>
        </div>
    );
};

export default TaxDashboard;

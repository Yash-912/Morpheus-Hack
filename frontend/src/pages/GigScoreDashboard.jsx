import { useNavigate } from 'react-router-dom';
import { useGigScore } from '../hooks/useGigScore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, TrendingUp, Shield, Wallet, PiggyBank, Zap } from 'lucide-react';

const tierConfig = {
    1: { label: 'Restricted', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-200' },
    2: { label: 'Emergency Active', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50', border: 'border-yellow-200' },
    3: { label: 'NBFC Active', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50', border: 'border-green-200' },
};

const breakdownLabels = {
    consistency: { label: 'Earnings Consistency', weight: '35%', icon: TrendingUp },
    repayment: { label: 'Repayment History', weight: '30%', icon: Shield },
    tenure: { label: 'Platform Tenure', weight: '15%', icon: Wallet },
    engagement: { label: 'App Engagement', weight: '10%', icon: Zap },
    discipline: { label: 'Financial Discipline', weight: '10%', icon: PiggyBank },
};

const GigScoreDashboard = () => {
    const navigate = useNavigate();
    const { overview, isLoadingOverview, history, eligibility, isLoadingEligibility } = useGigScore();

    const score = overview?.currentScore || 0;
    const maxScore = overview?.maxScore || 850;
    const tier = overview?.tier || 1;
    const tierInfo = tierConfig[tier];
    const breakdown = overview?.breakdown || {};

    // SVG arc calculations for the speedometer
    const arcPercentage = score / maxScore;
    const arcLength = 125; // total arc path length

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">GigScore</h1>
            </header>

            {isLoadingOverview ? (
                <div className="p-12 text-center text-gigpay-text-muted">Calculating your GigScore...</div>
            ) : (
                <>
                    {/* ── Speedometer Card ── */}
                    <Card className="bg-gigpay-navy text-white flex flex-col items-center justify-center p-6 pb-8 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gigpay-lime opacity-10 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FFD166] opacity-10 rounded-full blur-2xl"></div>

                        <span className="text-body-md text-gigpay-surface/80 mb-2">Your GigScore</span>
                        <div className="relative">
                            <svg className="w-48 h-24" viewBox="0 0 100 50">
                                {/* Background arc */}
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
                                {/* Score arc */}
                                <path
                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke="#D9F150"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={arcLength}
                                    strokeDashoffset={arcLength - (arcLength * arcPercentage)}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute -bottom-2 w-full text-center">
                                <span className="text-display-md font-bold text-white">{score}</span>
                                <span className="text-body-sm text-white/50 ml-1">/ {maxScore}</span>
                            </div>
                        </div>

                        {/* Tier Badge */}
                        <div className={`mt-5 px-4 py-1.5 rounded-full ${tierInfo.color} text-white text-xs font-bold tracking-wide`}>
                            Tier {tier} — {tierInfo.label}
                        </div>

                        {/* Next Tier */}
                        {overview?.nextTierThreshold && tier < 3 && (
                            <p className="mt-3 text-xs text-white/60">
                                {overview.nextTierThreshold - score} points to next tier
                            </p>
                        )}
                    </Card>

                    {/* ── Sub-Score Breakdown ── */}
                    <section>
                        <h2 className="text-heading-md text-gigpay-navy mb-3">Score Breakdown</h2>
                        <div className="flex flex-col gap-3">
                            {Object.entries(breakdown).map(([key, value]) => {
                                const meta = breakdownLabels[key];
                                if (!meta) return null;
                                const Icon = meta.icon;
                                return (
                                    <Card key={key} className="p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-gigpay-navy/10 flex items-center justify-center shrink-0">
                                            <Icon size={18} className="text-gigpay-navy" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gigpay-navy truncate">{meta.label}</span>
                                                <span className="text-xs text-gigpay-text-muted ml-2">{meta.weight}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gigpay-lime h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${value}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gigpay-navy w-10 text-right">{value}</span>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Score History Trend ── */}
                    {history.length > 0 && (
                        <section>
                            <h2 className="text-heading-md text-gigpay-navy mb-3">Score Trend</h2>
                            <Card className="p-4">
                                <div className="flex items-end gap-2 h-32">
                                    {history.map((h, i) => {
                                        const heightPercent = (h.totalScore / maxScore) * 100;
                                        const monthLabel = new Date(h.month).toLocaleDateString('en-IN', { month: 'short' });
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs font-bold text-gigpay-navy">{h.totalScore}</span>
                                                <div className="w-full bg-slate-100 rounded-t-md overflow-hidden flex-1 flex items-end">
                                                    <div
                                                        className="w-full bg-gigpay-lime rounded-t-md transition-all duration-500"
                                                        style={{ height: `${heightPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] text-gigpay-text-muted">{monthLabel}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* ── Tier Benefits Section ── */}
                    {!isLoadingEligibility && eligibility && (
                        <section>
                            <h2 className="text-heading-md text-gigpay-navy mb-3">Your Benefits</h2>
                            <div className="flex flex-col gap-3">
                                <Card className={`p-4 ${eligibility.unlocked.emergencyCredit ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50/50 opacity-60'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${eligibility.unlocked.emergencyCredit ? 'bg-green-100' : 'bg-slate-200'}`}>
                                            <Zap size={16} className={eligibility.unlocked.emergencyCredit ? 'text-green-600' : 'text-slate-400'} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gigpay-navy">Emergency Fund</p>
                                            <p className="text-xs text-gigpay-text-secondary">
                                                {eligibility.unlocked.emergencyCredit
                                                    ? `Up to ₹${eligibility.limits.emergencyFundMax} instant advance`
                                                    : 'Reach Tier 2 (300+ score) to unlock'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className={`p-4 ${eligibility.unlocked.nbfcLoans ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50/50 opacity-60'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${eligibility.unlocked.nbfcLoans ? 'bg-green-100' : 'bg-slate-200'}`}>
                                            <Wallet size={16} className={eligibility.unlocked.nbfcLoans ? 'text-green-600' : 'text-slate-400'} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gigpay-navy">NBFC Micro-Loans</p>
                                            <p className="text-xs text-gigpay-text-secondary">
                                                {eligibility.unlocked.nbfcLoans
                                                    ? `Up to ${eligibility.limits.nbfcLoanMultiplier}x monthly income`
                                                    : 'Reach Tier 3 (550+ score) to unlock'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className={`p-4 border-green-200 bg-green-50/50`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                                            <PiggyBank size={16} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gigpay-navy">Micro-Savings</p>
                                            <p className="text-xs text-gigpay-text-secondary">Digital Gold & Target Gullak — Always available</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default GigScoreDashboard;

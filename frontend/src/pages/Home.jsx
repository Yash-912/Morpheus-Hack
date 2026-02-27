import { useEffect } from 'react';
import { useUIStore } from '../store/ui.store';
import { useEarnings } from '../hooks/useEarnings';
import { useCommunity } from '../hooks/useCommunity'; // Added hook
import { useSmsSync } from '../hooks/useSmsSync';
import { EarningWidget } from '../components/ui/EarningWidget';
import { ActionGrid } from '../components/ui/ActionGrid';
import { Card, ActionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import SMSPermission from '../components/expenses/SMSPermission';
import { ArrowRight, Flame, Gauge, PiggyBank, Zap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const { today, isLoadingToday } = useEarnings();
    const navigate = useNavigate();

    // SMS auto-sync
    const { hasPermission, grantPermission, isSyncing, syncResult } = useSmsSync();

    // Fetch live community jobs around Bengaluru center for demo
    const { nearbyJobs, isLoadingNearby } = useCommunity(12.9716, 77.5946, 50);
    const { t } = useLanguage();

    useEffect(() => {
        setActiveTab('home');
    }, [setActiveTab]);

    // Show toast when new transactions are synced
    useEffect(() => {
        if (syncResult?.processing?.created > 0) {
            toast.success(`📲 ${syncResult.processing.created} new transactions detected from SMS`);
        }
    }, [syncResult]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* SMS Permission Banner — shows once until user clicks Allow */}
            {!hasPermission && (
                <section>
                    <SMSPermission
                        onAllow={async () => {
                            const result = await grantPermission();
                            if (result?.synced > 0) {
                                toast.success(`📲 ${result.synced} SMS messages synced`);
                            }
                        }}
                        onDismiss={() => {
                            // Dismiss but don't grant — will show again next visit
                        }}
                        isLoading={isSyncing}
                    />
                </section>
            )}

            {/* Earnings Dashboard */}
            <section>
                <EarningWidget
                    todayAmount={today?.totalAmount || 0}
                    isLoading={isLoadingToday}
                    onClick={() => navigate('/wallet')}
                />
            </section>

            {/* Quick Actions */}
            <section>
                <h2 className="text-heading-md mb-3">{t('quickActions')}</h2>
                <ActionGrid />
            </section>

            {/* Financial Hub */}
            <section>
                <h2 className="text-heading-md mb-3">Financial Hub</h2>
                <div className="grid grid-cols-2 gap-3">
                    <Card
                        onClick={() => navigate('/gigscore')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                            <Gauge size={20} className="text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">GigScore</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">Your credit profile</p>
                    </Card>
                    <Card
                        onClick={() => navigate('/microsavings')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center mb-2">
                            <PiggyBank size={20} className="text-yellow-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">Micro-Savings</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">Gold & Target Gullak</p>
                    </Card>
                    <Card
                        onClick={() => navigate('/credit')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                            <Zap size={20} className="text-green-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">Emergency Fund</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">Instant cash advance</p>
                    </Card>
                    <Card
                        onClick={() => navigate('/tax-hub')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                            <FileText size={20} className="text-purple-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">Tax Hub</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">Claim TDS refund</p>
                    </Card>
                </div>
            </section>

            {/* Recommended for You */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-heading-md">{t('liveOpportunities')}</h2>
                    <Button variant="ghost" size="ghost" className="pe-0" onClick={() => navigate('/community')}>{t('seeAll')} <ArrowRight size={16} className="ml-1" /></Button>
                </div>

                <div className="flex flex-col gap-3">
                    {isLoadingNearby ? (
                        <div className="p-4 text-center text-gigpay-text-muted">{t('loadingGigs')}</div>
                    ) : nearbyJobs && nearbyJobs.length > 0 ? (
                        nearbyJobs.slice(0, 3).map((job) => (
                            <ActionCard key={job.id} className="flex items-start justify-between cursor-pointer" onClick={() => navigate(`/community/${job.id}`)}>
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={job.amount > 500 ? 'warning' : 'info'}>
                                                {job.amount > 500 && <Flame size={12} className="mr-1 inline" />}
                                                {job.type || 'Gig'}
                                            </Badge>
                                            <span className="text-caption text-gigpay-text-muted">~{job.distanceKm} km away</span>
                                        </div>
                                        <span className="text-body-md font-bold text-gigpay-navy">₹{job.amount}</span>
                                    </div>
                                    <h3 className="text-body-lg font-bold text-gigpay-navy mt-1 truncate">{job.title}</h3>
                                    <p className="text-label text-gigpay-text-secondary line-clamp-1">{job.description}</p>
                                </div>
                            </ActionCard>
                        ))
                    ) : (
                        <Card className="p-4 text-center border-dashed bg-transparent border-gigpay-border/60">
                            <p className="text-body-md text-gigpay-text-secondary">{t('noGigsFound')}</p>
                        </Card>
                    )}
                </div>
            </section>

            {/* Testing Neobrutalist Button Component */}
            <section className="mb-8">
                <h2 className="text-heading-md mb-3">Cashout (PRD Test)</h2>
                <Card className="flex flex-col gap-4 items-center bg-[#E5E9DF] border-gigpay-border/50 shadow-none">
                    <p className="text-body-md text-gigpay-text-secondary text-center mb-1">
                        Tap the button below to see the 3px 3px 0px shadow collapse physically on press.
                    </p>
                    <Button variant="primary" className="w-full">
                        Withdraw ₹8,200
                    </Button>
                </Card>
            </section>
        </div>
    );
};

export default Home;

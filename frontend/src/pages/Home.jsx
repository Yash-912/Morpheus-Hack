import { useEffect } from 'react';
import { useUIStore } from '../store/ui.store';
import { useEarnings } from '../hooks/useEarnings';
import { useCommunity } from '../hooks/useCommunity'; // Added hook
import { EarningWidget } from '../components/ui/EarningWidget';
import { ActionGrid } from '../components/ui/ActionGrid';
import { Card, ActionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const { today, isLoadingToday } = useEarnings();
    const navigate = useNavigate();

    // Fetch live community jobs around Bengaluru center for demo
    const { nearbyJobs, isLoadingNearby } = useCommunity(12.9716, 77.5946, 50);

    useEffect(() => {
        setActiveTab('home');
    }, [setActiveTab]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
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
                <h2 className="text-heading-md mb-3">Quick Actions</h2>
                <ActionGrid />
            </section>

            {/* Recommended for You */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-heading-md">Live Opportunities</h2>
                    <Button variant="ghost" size="ghost" className="pe-0" onClick={() => navigate('/community')}>See All <ArrowRight size={16} className="ml-1" /></Button>
                </div>

                <div className="flex flex-col gap-3">
                    {isLoadingNearby ? (
                        <div className="p-4 text-center text-gigpay-text-muted">Loading nearby gigs...</div>
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
                            <p className="text-body-md text-gigpay-text-secondary">No local gigs found right now.</p>
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

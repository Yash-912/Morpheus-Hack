import { useState, useEffect } from 'react';
import { useCommunity } from '../hooks/useCommunity';
import { useUIStore } from '../store/ui.store';
import { Card, ActionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Plus, Flame, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Community = () => {
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const navigate = useNavigate();
    const [tab, setTab] = useState('nearby'); // 'nearby' | 'my-jobs'

    // Dummy coordinates for Bangalore for hackathon demo
    const { nearbyJobs, myJobs, isLoadingNearby, isLoadingMyJobs } = useCommunity(12.9716, 77.5946, 50);

    useEffect(() => {
        // Technically belongs to zones or more, but we can just clear or keep the previous highlight
        setActiveTab('map');
    }, [setActiveTab]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-display-sm font-syne font-bold text-gigpay-navy mb-1">Local Gigs</h1>
                    <p className="text-body-md text-gigpay-text-secondary">Community-powered opportunities</p>
                </div>
                <Button onClick={() => navigate('/post-job')} className="flex items-center gap-1 bg-gigpay-navy text-white hover:bg-gigpay-navy-mid">
                    <Plus size={18} /> Post
                </Button>
            </header>

            {/* Toggle Tabs */}
            <div className="flex bg-[#E2E8F0] p-1 rounded-lg border-2 border-gigpay-navy shadow-brutal w-max">
                <button
                    onClick={() => setTab('nearby')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tab === 'nearby' ? 'bg-white text-gigpay-navy shadow-sm' : 'text-slate-500'}`}
                >
                    Nearby
                </button>
                <button
                    onClick={() => setTab('my-jobs')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tab === 'my-jobs' ? 'bg-white text-gigpay-navy shadow-sm' : 'text-slate-500'}`}
                >
                    My Activity
                </button>
            </div>

            {/* Content Area */}
            <div className="flex flex-col gap-4">
                {tab === 'nearby' && (
                    <>
                        {isLoadingNearby ? (
                            <div className="p-8 text-center text-gigpay-text-muted">Locating nearby jobs...</div>
                        ) : nearbyJobs?.length > 0 ? (
                            nearbyJobs.map(job => (
                                <ActionCard key={job.id} onClick={() => navigate(`/community/${job.id}`)}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={job.amount >= 500 ? 'warning' : 'info'}>
                                                    {job.amount >= 500 && <Flame size={12} className="mr-1 inline" />}
                                                    {job.type || 'Errand'}
                                                </Badge>
                                            </div>
                                            <span className="text-heading-md text-gigpay-navy">₹{job.amount}</span>
                                        </div>
                                        <h3 className="text-body-lg font-bold text-gigpay-navy">{job.title}</h3>
                                        <p className="text-body-sm text-gigpay-text-secondary line-clamp-2 mb-2">{job.description}</p>
                                        <div className="flex items-center gap-4 text-caption text-gigpay-text-muted mt-1">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {job.distanceKm} km away</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> By {job.poster_name || 'Community Member'}</span>
                                        </div>
                                    </div>
                                </ActionCard>
                            ))
                        ) : (
                            <Card className="p-8 text-center bg-transparent border-dashed">
                                <p className="text-body-md text-gigpay-text-secondary mb-3">No jobs posted nearby.</p>
                                <Button variant="outline" onClick={() => navigate('/post-job')}>Be the first to post</Button>
                            </Card>
                        )}
                    </>
                )}

                {tab === 'my-jobs' && (
                    <>
                        {isLoadingMyJobs ? (
                            <div className="p-8 text-center text-gigpay-text-muted">Loading your history...</div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {/* Accepted Jobs */}
                                <div>
                                    <h3 className="font-bold text-gigpay-navy mb-3">Jobs You Accepted</h3>
                                    {myJobs?.accepted?.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {myJobs.accepted.map(job => (
                                                <ActionCard key={job.id} onClick={() => navigate(`/community/${job.id}`)}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-gigpay-navy">{job.title}</h4>
                                                            <Badge className="mt-1 capitalize">{job.status}</Badge>
                                                        </div>
                                                        <span className="font-bold text-gigpay-lime bg-gigpay-navy px-2 py-1 rounded-md text-sm">₹{job.amount}</span>
                                                    </div>
                                                </ActionCard>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gigpay-text-muted">You haven't accepted any community gigs yet.</p>
                                    )}
                                </div>

                                {/* Posted Jobs */}
                                <div>
                                    <h3 className="font-bold text-gigpay-navy mb-3">Gigs You Posted</h3>
                                    {myJobs?.posted?.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {myJobs.posted.map(job => (
                                                <ActionCard key={job.id} onClick={() => navigate(`/community/${job.id}`)}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-gigpay-navy">{job.title}</h4>
                                                            <Badge variant={job.status === 'open' ? 'warning' : 'success'} className="mt-1 capitalize">{job.status}</Badge>
                                                        </div>
                                                        <span className="font-bold text-gigpay-text-muted">-₹{job.amount}</span>
                                                    </div>
                                                </ActionCard>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gigpay-text-muted">You haven't posted any gigs.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Community;

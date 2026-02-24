import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCommunity } from '../hooks/useCommunity';
import { getJobDetailApi } from '../services/community.api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, MapPin, User, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { acceptJob, completeJob, confirmJob } = useCommunity();

    const { data: job, isLoading } = useQuery({
        queryKey: ['community', 'job', id],
        queryFn: () => getJobDetailApi(id),
        enabled: !!id
    });

    if (isLoading) {
        return <div className="p-8 text-center text-gigpay-text-muted mt-20 animate-fade-in">Loading job details...</div>;
    }

    if (!job) {
        return (
            <div className="p-8 text-center mt-20 animate-fade-in">
                <h2 className="text-heading-md text-gigpay-navy mb-2">Job Not Found</h2>
                <Button variant="outline" onClick={() => navigate('/community')}>Back to Community</Button>
            </div>
        );
    }

    const isPoster = user?.id === job.posterId;
    const isWorker = user?.id === job.workerId;
    const canAccept = !isPoster && job.status === 'open';

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'warning';
            case 'assigned': return 'info';
            case 'completed': return 'success'; // Awaiting confirmation
            case 'confirmed': return 'success';
            default: return 'neutral';
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy truncate">Job Detail</h1>
            </header>

            {/* Main Info */}
            <Card className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <Badge variant={getStatusColor(job.status)} className="capitalize">
                        {job.status === 'completed' ? 'Awaiting Confirmation' : job.status}
                    </Badge>
                    <span className="text-heading-lg text-gigpay-navy leading-none">₹{job.amount}</span>
                </div>

                <div>
                    <h2 className="text-heading-md text-gigpay-navy mb-1">{job.title}</h2>
                    <p className="text-body-md text-gigpay-text-secondary">{job.description}</p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gigpay-text-secondary">
                        <User size={16} className="text-gigpay-navy" />
                        <span>Posted by: <strong className="text-gigpay-navy">{isPoster ? 'You' : job.poster?.name || 'Community Member'}</strong></span>
                    </div>
                    {job.address && (
                        <div className="flex items-center gap-2 text-sm text-gigpay-text-secondary">
                            <MapPin size={16} className="text-gigpay-navy" />
                            <span>Location: <strong className="text-gigpay-navy">{job.address}</strong></span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gigpay-text-secondary">
                        <Clock size={16} className="text-gigpay-navy" />
                        <span>Posted at: {new Date(job.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            </Card>

            {/* Escrow Status Panel */}
            <Card className="bg-[#E2E8F0] border-gigpay-navy/20 p-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck size={24} className="text-[#84cc16] shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm text-gigpay-navy mb-1">Escrow Protection</h4>
                        <p className="text-xs text-gigpay-text-secondary">
                            {job.status === 'open' && "₹" + job.escrowAmount + " is securely locked in escrow. It will be released when the job is confirmed."}
                            {job.status === 'assigned' && "Funds are locked. The worker must mark complete before you can release them."}
                            {job.status === 'completed' && "Worker marked as complete. Please inspect and confirm to release the funds."}
                            {job.status === 'confirmed' && "Funds have been released successfully to the worker."}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Actions Panel */}
            <div className="mt-4 flex flex-col gap-3">
                {/* 1. Anyone other than poster can accept an open job */}
                {canAccept && (
                    <Button onClick={() => acceptJob(job.id)} className="w-full bg-[#FFD166] text-gigpay-navy hover:bg-[#F4C455]">
                        Accept Job
                    </Button>
                )}

                {/* 2. Worker can mark as complete */}
                {isWorker && job.status === 'assigned' && (
                    <Button onClick={() => completeJob(job.id)} className="w-full">
                        Mark as Complete
                    </Button>
                )}

                {/* 3. Poster must confirm completion to release escrow */}
                {isPoster && job.status === 'completed' && (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-center text-gigpay-text-secondary mb-2">Did the worker finish the task?</p>
                        <Button onClick={() => confirmJob(job.id)} className="w-full bg-[#84cc16] hover:bg-[#65a30d]">
                            <CheckCircle2 size={18} className="mr-2" /> Confirm & Release Payment
                        </Button>
                    </div>
                )}

                {/* State Displays */}
                {isPoster && job.status === 'assigned' && (
                    <div className="text-center p-4 bg-white rounded-lg border-2 border-dashed border-gigpay-border">
                        <p className="text-sm font-bold text-gigpay-navy">Waiting on Worker</p>
                        <p className="text-xs text-gigpay-text-secondary mt-1">They must mark it complete before you can release payment.</p>
                    </div>
                )}

                {isWorker && job.status === 'completed' && (
                    <div className="text-center p-4 bg-white rounded-lg border-2 border-dashed border-gigpay-border">
                        <p className="text-sm font-bold text-gigpay-navy">Awaiting Poster Confirmation</p>
                        <p className="text-xs text-gigpay-text-secondary mt-1">Escrow will automatically release once they approve.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetail;

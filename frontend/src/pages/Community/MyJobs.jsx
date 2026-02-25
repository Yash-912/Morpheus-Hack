import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import JobCard from '../../components/community/JobCard';
import EmptyState from '../../components/shared/EmptyState';
import { ArrowLeft, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const TAB_KEYS = ['posted', 'accepted'];

const MyJobs = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);
    const [tab, setTab] = useState('posted');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { setActiveTab('community'); }, [setActiveTab]);

    // Demo data — replace with useQuery
    const [postedJobs] = useState([
        {
            id: '1',
            type: 'delivery',
            title: 'Pickup package from Indiranagar to HSR',
            description: 'Small parcel, needs to be delivered before 5 PM.',
            status: 'open',
            amount: 15000,
            distanceKm: 3.2,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            id: '2',
            type: 'shifting',
            title: 'Move furniture to new flat',
            description: '2 chairs and 1 table, ground floor to 3rd floor.',
            status: 'assigned',
            amount: 80000,
            distanceKm: 1.5,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
    ]);

    const [acceptedJobs] = useState([
        {
            id: '3',
            type: 'errand',
            title: 'Pick up dry cleaning from BTM',
            description: 'Already paid, just need collection.',
            status: 'assigned',
            amount: 10000,
            distanceKm: 2.8,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
            id: '4',
            type: 'delivery',
            title: 'Document delivery to Electronic City',
            status: 'completed',
            amount: 25000,
            distanceKm: 8.5,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
    ]);

    const currentJobs = tab === 'posted' ? postedJobs : acceptedJobs;
    const filtered = statusFilter === 'all'
        ? currentJobs
        : currentJobs.filter((j) => j.status === statusFilter);

    const statuses = ['all', 'open', 'assigned', 'completed', 'cancelled'];

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">My Jobs</h1>
                <button
                    onClick={() => navigate('/post-job')}
                    className="btn-icon bg-[#C8F135] border-gigpay-navy"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Posted / Accepted tabs */}
            <div className="flex gap-1 bg-gigpay-surface rounded-xl p-1 border-[1.5px] border-gigpay-border">
                {TAB_KEYS.map((key) => (
                    <button
                        key={key}
                        onClick={() => { setTab(key); setStatusFilter('all'); }}
                        className={`flex-1 py-2.5 rounded-lg text-body-md font-semibold capitalize transition-all duration-150 ${tab === key
                            ? 'bg-white text-gigpay-navy shadow-sm border-[1px] border-gigpay-border'
                            : 'text-gigpay-text-secondary'
                            }`}
                    >
                        {key === 'posted' ? '📝 Posted' : '✅ Accepted'}
                    </button>
                ))}
            </div>

            {/* Status filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold border-[1.5px] transition-all duration-75 capitalize ${statusFilter === s
                            ? 'bg-gigpay-navy text-white border-gigpay-navy'
                            : 'bg-white border-gigpay-border text-gigpay-text-secondary'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Job list */}
            {filtered.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {filtered.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => navigate(`/community/${job.id}`)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={tab === 'posted' ? '📝' : '✅'}
                    title={`No ${statusFilter === 'all' ? '' : statusFilter + ' '}jobs ${tab}`}
                    description={
                        tab === 'posted'
                            ? 'Post a job and find workers nearby to help out.'
                            : 'Browse available jobs in your area to earn extra.'
                    }
                    actionLabel={tab === 'posted' ? 'Post a Job' : 'Browse Jobs'}
                    onAction={() => navigate(tab === 'posted' ? '/post-job' : '/community')}
                />
            )}

            {/* Stats footer */}
            <div className="card bg-gigpay-surface py-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-heading-md font-bold text-gigpay-navy">
                            {postedJobs.length}
                        </p>
                        <p className="text-caption text-gigpay-text-muted">Posted</p>
                    </div>
                    <div>
                        <p className="text-heading-md font-bold text-gigpay-navy">
                            {acceptedJobs.filter((j) => j.status === 'completed').length}
                        </p>
                        <p className="text-caption text-gigpay-text-muted">Completed</p>
                    </div>
                    <div>
                        <p className="text-heading-md font-bold text-green-600">
                            {formatCurrency(
                                acceptedJobs
                                    .filter((j) => j.status === 'completed')
                                    .reduce((sum, j) => sum + j.amount, 0)
                            )}
                        </p>
                        <p className="text-caption text-gigpay-text-muted">Earned</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyJobs;

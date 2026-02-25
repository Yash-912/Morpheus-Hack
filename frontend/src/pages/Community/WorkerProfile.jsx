import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import Avatar from '../../components/shared/Avatar';
import JobCard from '../../components/community/JobCard';
import EmptyState from '../../components/shared/EmptyState';
import { ArrowLeft, Shield, Star } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const WorkerProfile = () => {
    const navigate = useNavigate();
    const { workerId } = useParams();
    const setActiveTab = useUIStore((s) => s.setActiveTab);

    useEffect(() => { setActiveTab('community'); }, [setActiveTab]);

    // Demo data — replace with API call
    const worker = {
        id: workerId || '1',
        name: 'Ramesh Kumar',
        phone: '+91 98XXXXX120',
        selfieUrl: null,
        isKycVerified: true,
        gigScore: 720,
        avgRating: 4.6,
        totalRatings: 43,
        completedJobs: 67,
        joinedDate: '2025-06-15',
        platform: 'Zomato',
        city: 'Bengaluru',
        activeSince: '8 months',
    };

    const reviews = [
        { id: '1', reviewer: 'Priya S.', rating: 5, comment: 'Very punctual delivery, handled the package carefully.', date: '2 days ago' },
        { id: '2', reviewer: 'Amit R.', rating: 4, comment: 'Good worker, took slightly longer than expected.', date: '1 week ago' },
        { id: '3', reviewer: 'Neha M.', rating: 5, comment: 'Excellent work! Highly recommended.', date: '2 weeks ago' },
    ];

    const activeListings = [
        {
            id: 'a1',
            type: 'delivery',
            title: 'Available for evening deliveries',
            status: 'open',
            amount: 20000,
            distanceKm: 5.0,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
    ];

    const stars = Math.round(worker.avgRating);

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Worker Profile</h1>
            </div>

            {/* Profile card */}
            <div className="card text-center">
                <div className="flex flex-col items-center mb-4">
                    <Avatar name={worker.name} src={worker.selfieUrl} size="xl" />
                    <div className="mt-3">
                        <div className="flex items-center justify-center gap-1.5">
                            <h2 className="text-heading-lg text-gigpay-navy">{worker.name}</h2>
                            {worker.isKycVerified && (
                                <Shield size={18} className="text-green-500 fill-green-500" />
                            )}
                        </div>
                        <p className="text-body-md text-gigpay-text-secondary mt-0.5">
                            {worker.platform} • {worker.city}
                        </p>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gigpay-surface rounded-xl">
                        <p className="text-heading-md font-bold text-gigpay-navy">{worker.gigScore}</p>
                        <p className="text-caption text-gigpay-text-muted">GigScore</p>
                    </div>
                    <div className="p-3 bg-gigpay-surface rounded-xl">
                        <div className="flex items-center justify-center gap-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <p className="text-heading-md font-bold text-gigpay-navy">{worker.avgRating}</p>
                        </div>
                        <p className="text-caption text-gigpay-text-muted">{worker.totalRatings} reviews</p>
                    </div>
                    <div className="p-3 bg-gigpay-surface rounded-xl">
                        <p className="text-heading-md font-bold text-gigpay-navy">{worker.completedJobs}</p>
                        <p className="text-caption text-gigpay-text-muted">Jobs done</p>
                    </div>
                </div>

                <p className="text-caption text-gigpay-text-muted mt-3">
                    Active for {worker.activeSince}
                </p>
            </div>

            {/* Reviews */}
            <div>
                <h3 className="text-heading-md mb-3">Reviews</h3>
                <div className="flex flex-col gap-2">
                    {reviews.map((review) => (
                        <div key={review.id} className="card py-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-body-md font-semibold text-gigpay-navy">
                                    {review.reviewer}
                                </span>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={12}
                                            className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-body-md text-gigpay-text-secondary">{review.comment}</p>
                            <p className="text-caption text-gigpay-text-muted mt-1">{review.date}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Active listings */}
            <div>
                <h3 className="text-heading-md mb-3">Active Listings</h3>
                {activeListings.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {activeListings.map((job) => (
                            <JobCard key={job.id} job={job} onClick={() => { }} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="📋"
                        title="No active listings"
                        description="This worker doesn't have any open listings right now."
                    />
                )}
            </div>
        </div>
    );
};

export default WorkerProfile;

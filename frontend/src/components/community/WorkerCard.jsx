import Avatar from '../shared/Avatar';

/**
 * WorkerCard — Compact worker profile card.
 * Shows name, rating, completed jobs, and verified badge.
 *
 * @param {object} props
 * @param {object} props.worker
 * @param {Function} [props.onClick]
 */
const WorkerCard = ({ worker, onClick }) => {
    const rating = worker.avgRating || 0;
    const stars = Math.round(rating);

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-white border-[1.5px] border-gigpay-border rounded-2xl w-full text-left transition-all active:scale-[0.98] duration-75 hover:shadow-md"
        >
            <Avatar name={worker.name} src={worker.selfieUrl} size="lg" />

            <div className="flex-1">
                <div className="flex items-center gap-1.5">
                    <p className="text-body-md font-bold text-gigpay-navy">{worker.name}</p>
                    {worker.isKycVerified && (
                        <span className="text-sm" title="KYC Verified">✅</span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                    {/* Star rating */}
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`text-xs ${star <= stars ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                ★
                            </span>
                        ))}
                        <span className="text-caption text-gigpay-text-muted ml-1">
                            {rating > 0 ? rating.toFixed(1) : 'New'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 mt-1 text-caption text-gigpay-text-muted">
                    {worker.completedJobs > 0 && (
                        <span>{worker.completedJobs} jobs done</span>
                    )}
                    {worker.platform && (
                        <span>• {worker.platform}</span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default WorkerCard;

import { formatCurrency } from '../../utils/formatCurrency';
import { timeAgo } from '../../utils/formatDate';
import { Badge } from '../ui/Badge';

/**
 * JobCard — Community job listing card.
 *
 * @param {object} props
 * @param {object} props.job — Job from community API
 * @param {Function} [props.onClick]
 */
const JobCard = ({ job, onClick }) => {
    const typeColors = {
        delivery: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        shifting: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        repair: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
        errand: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        other: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    };

    const statusConfig = {
        open: 'badge-success',
        assigned: 'badge-warning',
        completed: 'badge-info',
        cancelled: 'badge-danger',
    };

    const typeConfig = typeColors[job.type] || typeColors.other;

    return (
        <button
            onClick={onClick}
            className="card w-full text-left transition-all active:scale-[0.98] duration-75"
        >
            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-caption font-bold px-2 py-0.5 rounded-lg border-[1.5px] ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                        {job.type || 'Gig'}
                    </span>
                    {job.distanceKm != null && (
                        <span className="text-caption text-gigpay-text-muted">
                            📍 {job.distanceKm.toFixed(1)} km
                        </span>
                    )}
                </div>
                <span className={`badge ${statusConfig[job.status] || 'badge-info'}`}>
                    {job.status}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-body-lg font-bold text-gigpay-navy mb-1 line-clamp-1">
                {job.title}
            </h3>

            {/* Description */}
            {job.description && (
                <p className="text-body-md text-gigpay-text-secondary line-clamp-2 mb-3">
                    {job.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span className="text-heading-md font-bold text-gigpay-navy">
                    {formatCurrency(job.amount)}
                </span>
                <span className="text-caption text-gigpay-text-muted">
                    {timeAgo(job.createdAt)}
                </span>
            </div>
        </button>
    );
};

export default JobCard;

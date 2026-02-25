import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { timeAgo } from '../../utils/formatDate';
import { ArrowRight } from 'lucide-react';

/**
 * RecentTransactions — Last 5 payouts preview on home dashboard.
 *
 * @param {object} props
 * @param {Array} props.transactions — Array of payout objects
 * @param {boolean} [props.isLoading]
 */
const RecentTransactions = ({ transactions = [], isLoading = false }) => {
    const navigate = useNavigate();

    const statusConfig = {
        completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
        processing: { label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-50' },
        pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-50' },
        failed: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50' },
        reversed: { label: 'Reversed', color: 'text-gray-600', bg: 'bg-gray-50' },
    };

    const typeIcons = {
        instant: '⚡',
        same_day: '📅',
        scheduled: '🕐',
    };

    if (isLoading) {
        return (
            <div className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-36 mb-4" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="h-4 bg-gray-200 rounded w-24" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="card text-center py-6">
                <p className="text-body-md text-gigpay-text-secondary">No payouts yet</p>
                <button onClick={() => navigate('/cashout')} className="btn-ghost mt-2">
                    Make your first cashout →
                </button>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-heading-md">Recent Payouts</h3>
                <button
                    onClick={() => navigate('/wallet')}
                    className="text-caption font-semibold text-gigpay-navy flex items-center gap-1"
                >
                    View All <ArrowRight size={14} />
                </button>
            </div>

            <div className="flex flex-col divide-y divide-gigpay-border/50">
                {transactions.slice(0, 5).map((tx) => {
                    const status = statusConfig[tx.status] || statusConfig.pending;
                    const icon = typeIcons[tx.type] || '💸';

                    return (
                        <div key={tx.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{icon}</span>
                                <div>
                                    <p className="text-body-md font-medium">
                                        {tx.type === 'instant' ? 'Instant' : tx.type === 'same_day' ? 'Same Day' : 'Scheduled'}
                                    </p>
                                    <p className="text-caption text-gigpay-text-muted">
                                        {timeAgo(tx.initiatedAt || tx.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-body-md font-bold">{formatCurrency(tx.amount)}</p>
                                <span className={`text-caption font-semibold ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentTransactions;

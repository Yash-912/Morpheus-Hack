import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateIST, timeAgo } from '../../utils/formatDate';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner, { FullPageLoader } from '../../components/shared/LoadingSpinner';
import { ArrowLeft, Filter, ChevronDown } from 'lucide-react';

const FILTER_TYPES = [
    { key: 'all', label: 'All' },
    { key: 'payout', label: 'Payouts' },
    { key: 'loan', label: 'Loans' },
    { key: 'savings', label: 'Savings' },
];

const STATUS_FILTERS = [
    { key: 'all', label: 'All Status' },
    { key: 'completed', label: 'Completed' },
    { key: 'processing', label: 'Processing' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
];

const Transactions = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);

    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Demo data — replace with useQuery when backend is wired
    const [transactions] = useState([
        { id: '1', type: 'payout', status: 'completed', amount: 82000, description: 'Instant cashout', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', type: 'payout', status: 'processing', amount: 150000, description: 'Same day transfer', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', type: 'loan', status: 'completed', amount: -250000, description: 'Loan repayment', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '4', type: 'savings', status: 'completed', amount: -5000, description: 'Round-up savings', createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: '5', type: 'insurance', status: 'completed', amount: -100, description: 'Daily accident premium', createdAt: new Date(Date.now() - 345600000).toISOString() },
        { id: '6', type: 'payout', status: 'failed', amount: 50000, description: 'Instant cashout', createdAt: new Date(Date.now() - 432000000).toISOString() },
    ]);

    useEffect(() => { setActiveTab('wallet'); }, [setActiveTab]);

    const filtered = transactions.filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
        return true;
    });

    const typeIcons = {
        payout: '💸',
        loan: '🏦',
        savings: '🐷',
    };

    const statusStyles = {
        completed: 'text-green-600',
        processing: 'text-blue-600',
        pending: 'text-yellow-600',
        failed: 'text-red-600',
    };

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Transactions</h1>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-icon ${showFilters ? 'bg-[#C8F135] border-gigpay-navy' : ''}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filter bar */}
            {showFilters && (
                <div className="card animate-fade-in">
                    {/* Type filter pills */}
                    <p className="text-label text-gigpay-text-secondary mb-2">Type</p>
                    <div className="flex gap-2 flex-wrap mb-3">
                        {FILTER_TYPES.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setTypeFilter(f.key)}
                                className={`px-3 py-1.5 rounded-full text-caption font-semibold border-[1.5px] transition-all duration-75 ${typeFilter === f.key
                                    ? 'bg-[#C8F135]/20 border-gigpay-navy text-gigpay-navy'
                                    : 'bg-white border-gigpay-border text-gigpay-text-secondary'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Status filter pills */}
                    <p className="text-label text-gigpay-text-secondary mb-2">Status</p>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`px-3 py-1.5 rounded-full text-caption font-semibold border-[1.5px] transition-all duration-75 ${statusFilter === f.key
                                    ? 'bg-[#C8F135]/20 border-gigpay-navy text-gigpay-navy'
                                    : 'bg-white border-gigpay-border text-gigpay-text-secondary'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Transaction list */}
            {isLoading ? (
                <FullPageLoader message="Loading transactions..." />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="📋"
                    title="No transactions found"
                    description="Try adjusting your filters or check back later."
                />
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((tx) => (
                        <div key={tx.id} className="card flex items-center gap-3 py-3">
                            <span className="text-2xl">{typeIcons[tx.type] || '💰'}</span>

                            <div className="flex-1">
                                <p className="text-body-md font-semibold text-gigpay-navy">
                                    {tx.description}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-caption text-gigpay-text-muted capitalize">
                                        {tx.type}
                                    </span>
                                    <span className="text-caption text-gigpay-text-muted">•</span>
                                    <span className="text-caption text-gigpay-text-muted">
                                        {timeAgo(tx.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className={`text-body-md font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-gigpay-navy'}`}>
                                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                                </p>
                                <span className={`text-caption font-semibold capitalize ${statusStyles[tx.status]}`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Transactions;

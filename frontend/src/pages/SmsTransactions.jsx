import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ArrowLeft, TrendingUp, TrendingDown, Filter, Loader2, MessageSquare } from 'lucide-react';
import api from '../services/api.service';

const CATEGORIES = ['All', 'INCOME', 'FOOD', 'FUEL', 'TOLL', 'MOBILE_RECHARGE', 'MAINTENANCE', 'TRANSFER', 'UNKNOWN'];

const CATEGORY_COLORS = {
    INCOME: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Income' },
    FOOD: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Food' },
    FUEL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Fuel' },
    TOLL: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Toll' },
    MOBILE_RECHARGE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Recharge' },
    MAINTENANCE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Maint.' },
    TRANSFER: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Transfer' },
    PARKING: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Parking' },
    UNKNOWN: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Unknown' },
};

const SmsTransactions = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = React.useState([]);
    const [summary, setSummary] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState('All');

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txRes, sumRes] = await Promise.all([
                api.get('/sms/transactions'),
                api.get('/sms/transactions/summary'),
            ]);
            if (txRes.data?.transactions) setTransactions(txRes.data.transactions);
            if (sumRes.data?.summary) setSummary(sumRes.data.summary);
        } catch (e) {
            console.error('Failed to fetch transactions:', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = filter === 'All'
        ? transactions
        : transactions.filter((t) => t.category === filter);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
                <p className="font-dm-sans text-sm text-gigpay-text-muted">Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 animate-fade-in pb-8">
            {/* Header */}
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ArrowLeft size={24} className="text-gigpay-navy" />
                </button>
                <h1 className="font-syne font-bold text-display-sm text-gigpay-navy">Transactions</h1>
            </header>

            {/* Summary Bar */}
            {summary && summary.transaction_count > 0 && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <TrendingUp size={16} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gigpay-text-muted font-dm-sans uppercase tracking-wider">Income</p>
                                <p className="font-syne font-bold text-emerald-600 text-lg leading-tight">
                                    {formatAmount(summary.total_income)}
                                </p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gigpay-card-border" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <TrendingDown size={16} className="text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gigpay-text-muted font-dm-sans uppercase tracking-wider">Expenses</p>
                                <p className="font-syne font-bold text-red-500 text-lg leading-tight">
                                    {formatAmount(summary.total_expenses)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gigpay-card-border flex items-center justify-between">
                        <span className="text-xs text-gigpay-text-muted font-dm-sans">{summary.transaction_count} transactions</span>
                        <span className="text-xs text-gigpay-text-muted font-dm-sans">{summary.period === 'all_time' ? 'All time' : summary.period}</span>
                    </div>
                </Card>
            )}

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                    const active = filter === cat;
                    const conf = CATEGORY_COLORS[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-dm-sans font-semibold transition-all ${active
                                    ? 'bg-gigpay-navy text-white shadow-sm'
                                    : 'bg-white text-gigpay-text-secondary border border-gigpay-card-border'
                                }`}
                        >
                            {cat === 'All' ? 'All' : conf?.label || cat}
                        </button>
                    );
                })}
            </div>

            {/* Transaction List */}
            {filtered.length === 0 ? (
                <Card className="p-8 flex flex-col items-center gap-3">
                    <MessageSquare size={40} className="text-gigpay-text-muted" />
                    <p className="font-dm-sans text-sm text-gigpay-text-secondary text-center">
                        {transactions.length === 0
                            ? 'Sync your SMS to see transactions'
                            : `No ${filter} transactions found`}
                    </p>
                </Card>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((tx) => {
                        const catConf = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.UNKNOWN;
                        const isCredit = tx.direction === 'credit';
                        return (
                            <Card key={tx.id} className="p-3.5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catConf.bg} ${catConf.text}`}>
                                                {catConf.label}
                                            </span>
                                            {tx.confidence >= 0.9 && (
                                                <span className="text-[9px] text-gigpay-text-muted">✓ High confidence</span>
                                            )}
                                        </div>
                                        <p className="font-dm-sans font-semibold text-sm text-gigpay-navy truncate">
                                            {tx.merchant || tx.sender}
                                        </p>
                                        <p className="text-[11px] text-gigpay-text-muted font-dm-sans mt-0.5">
                                            {formatDate(tx.smsTimestamp)} • {formatTime(tx.smsTimestamp)}
                                        </p>
                                    </div>
                                    <div className="text-right ml-3 flex-shrink-0">
                                        <p className={`font-syne font-bold text-base ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {isCredit ? '+' : '-'}{formatAmount(tx.amount)}
                                        </p>
                                        <p className="text-[10px] text-gigpay-text-muted font-dm-sans mt-0.5">
                                            {isCredit ? 'Credit' : 'Debit'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SmsTransactions;

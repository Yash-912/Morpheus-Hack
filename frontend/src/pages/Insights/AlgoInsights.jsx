import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Fuel, Coffee, Calendar, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api.service';

const CATEGORY_META = {
    fuel: { icon: '⛽', label: 'Fuel', color: '#F59E0B' },
    food: { icon: '🍔', label: 'Food', color: '#EF4444' },
    vehicle_maintenance: { icon: '🔧', label: 'Vehicle', color: '#6366F1' },
    phone_recharge: { icon: '📱', label: 'Phone', color: '#3B82F6' },
    toll: { icon: '🛣️', label: 'Toll', color: '#8B5CF6' },
    other: { icon: '📦', label: 'Other', color: '#6B7280' },
};

const PLATFORM_COLORS = {
    swiggy: '#FC8019',
    zomato: '#E23744',
    ola: '#8CC63F',
    uber: '#000000',
    other: '#6B7280',
};

const AlgoInsights = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setActiveTab('insights');
        fetchSummary();
    }, [setActiveTab]);

    const fetchSummary = async () => {
        try {
            const res = await api.get('/insights/weekly-summary');
            setData(res.data?.data || null);
        } catch (err) {
            console.error('Failed to fetch insights:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-3 border-gigpay-navy border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data || data.totalEarned === 0) {
        return (
            <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} /></button>
                    <h1 className="text-heading-lg flex-1">AI Insights</h1>
                </div>
                <div className="card text-center py-10">
                    <p className="text-4xl mb-3">📊</p>
                    <h3 className="text-heading-md font-bold text-gigpay-navy mb-2">No data yet</h3>
                    <p className="text-body-md text-gigpay-text-secondary">Start earning to see your weekly insights here!</p>
                </div>
            </div>
        );
    }

    const isUp = data.weekChange >= 0;

    return (
        <div className="flex flex-col gap-4 animate-fade-in pb-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy flex-1">AI Insights</h1>
            </div>

            {/* Headline Banner */}
            <div className="card bg-gradient-to-br from-[#0D1B3E] to-[#1a2d5a] text-white">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C8F135] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap size={20} className="text-gigpay-navy" />
                    </div>
                    <div>
                        <p className="text-label text-white/50 mb-1">Weekly Summary</p>
                        <p className="text-body-md font-medium leading-relaxed">{data.headline}</p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card">
                    <p className="text-caption text-gigpay-text-muted mb-1">Total Earned</p>
                    <p className="text-heading-md font-bold text-gigpay-navy">{formatCurrency(data.totalEarned)}</p>
                    <div className={`flex items-center gap-1 mt-1 text-caption font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{Math.abs(data.weekChange)}% vs last week</span>
                    </div>
                </div>
                <div className="card">
                    <p className="text-caption text-gigpay-text-muted mb-1">Total Spent</p>
                    <p className="text-heading-md font-bold text-red-500">{formatCurrency(data.totalExpenses)}</p>
                    <p className="text-caption text-gigpay-text-muted mt-1">
                        Net: <span className="font-semibold text-green-600">{formatCurrency(data.netIncome)}</span>
                    </p>
                </div>
                <div className="card">
                    <p className="text-caption text-gigpay-text-muted mb-1">Working Days</p>
                    <p className="text-heading-md font-bold text-gigpay-navy">{data.workingDays} <span className="text-caption font-normal">/ 7</span></p>
                </div>
                <div className="card">
                    <p className="text-caption text-gigpay-text-muted mb-1">Daily Avg</p>
                    <p className="text-heading-md font-bold text-gigpay-navy">{formatCurrency(data.dailyAvg)}</p>
                </div>
            </div>

            {/* Best & Worst Day */}
            {data.bestDay && data.worstDay && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="card border-l-4 border-green-500">
                        <p className="text-caption text-gigpay-text-muted mb-1">🏆 Best Day</p>
                        <p className="text-body-md font-bold text-gigpay-navy">{data.bestDay.day}</p>
                        <p className="text-caption font-semibold text-green-600">{formatCurrency(data.bestDay.amount)}</p>
                    </div>
                    <div className="card border-l-4 border-orange-400">
                        <p className="text-caption text-gigpay-text-muted mb-1">📉 Slowest Day</p>
                        <p className="text-body-md font-bold text-gigpay-navy">{data.worstDay.day}</p>
                        <p className="text-caption font-semibold text-orange-500">{formatCurrency(data.worstDay.amount)}</p>
                    </div>
                </div>
            )}

            {/* Platform Split */}
            {data.platformSplit.length > 0 && (
                <div className="card">
                    <p className="text-label text-gigpay-text-secondary mb-3">📊 Earnings by Platform</p>
                    {/* Bar visualization */}
                    <div className="flex h-4 rounded-full overflow-hidden mb-3">
                        {data.platformSplit.map(p => (
                            <div
                                key={p.platform}
                                style={{
                                    width: `${p.percent}%`,
                                    backgroundColor: PLATFORM_COLORS[p.platform] || '#6B7280'
                                }}
                                className="transition-all duration-300"
                            />
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                        {data.platformSplit.map(p => (
                            <div key={p.platform} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: PLATFORM_COLORS[p.platform] || '#6B7280' }}
                                    />
                                    <span className="text-body-md capitalize font-medium">{p.platform}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-body-md font-bold">{formatCurrency(p.amount)}</span>
                                    <span className="text-caption text-gigpay-text-muted ml-1.5">({p.percent}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expense Breakdown */}
            {data.expenseBreakdown.length > 0 && (
                <div className="card">
                    <p className="text-label text-gigpay-text-secondary mb-3">💸 Expenses by Category</p>
                    <div className="flex flex-col gap-2.5">
                        {data.expenseBreakdown.map(exp => {
                            const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
                            const pct = data.totalExpenses > 0 ? Math.round((exp.amount / data.totalExpenses) * 100) : 0;
                            return (
                                <div key={exp.category} className="flex items-center gap-3">
                                    <span className="text-lg w-6 text-center">{meta.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-body-md font-medium">{meta.label}</span>
                                            <span className="text-body-md font-bold">{formatCurrency(exp.amount)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: meta.color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlgoInsights;

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    BarChart3, MessageSquare, Database, Loader2, CheckCircle,
    AlertCircle, Lightbulb, TrendingUp, PiggyBank, Receipt, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../services/api.service';

// ── Realistic Mumbai delivery worker SMS (matching Jan-Feb 2026 earnings period) ─
const DEMO_SMS = [
    { body: 'Rs.450 debited at HP PETROL PUMP via UPI on 12-Jan', timestamp: '2026-01-12T10:30:00' },
    { body: 'FASTag: Rs.85 deducted at WESTERN EXPRESS HIGHWAY toll', timestamp: '2026-01-20T07:30:00' },
    { body: 'Rs.1200 paid to HERO HONDA SERVICE CENTER via UPI on 05-Feb', timestamp: '2026-02-05T11:30:00' },
    { body: 'Rs.299 debited for Jio recharge, validity 28 days. -JioCare', timestamp: '2026-02-18T10:00:00' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatRupee = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toFixed(0)}`;
};

// ── Insight type → icon + color mapping ─────────────────────────
const INSIGHT_META = {
    spending: { icon: Receipt, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    savings: { icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    tax: { icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    earnings_pattern: { icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    advice: { icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export default function ExpenseEarningsChart() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);

    // Action states
    const [simulating, setSimulating] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [toast, setToast] = useState(null);

    // Insights state
    const [insights, setInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insightsOpen, setInsightsOpen] = useState(false);

    // ── Fetch data ─────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [earningsRes, expensesRes] = await Promise.all([
                api.get('/forecast/earnings-trend').catch(() => ({ data: { data: [] } })),
                api.get('/expenses', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
            ]);

            const earningsRows = earningsRes.data?.data || [];
            const expenses = expensesRes.data?.data || [];

            if (earningsRows.length === 0 && expenses.length === 0) {
                setIsEmpty(true);
                setChartData([]);
                setLoading(false);
                return;
            }

            setIsEmpty(false);

            const monthMap = {};

            earningsRows.forEach((e) => {
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[key]) {
                    monthMap[key] = { month: MONTHS[d.getMonth()], earnings: 0, expenses: 0 };
                }
                monthMap[key].earnings += (e.totalEarnings || 0) / 100; // paise → rupees
            });

            expenses.forEach((e) => {
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[key]) {
                    monthMap[key] = { month: MONTHS[d.getMonth()], earnings: 0, expenses: 0 };
                }
                monthMap[key].expenses += Number(e.amount || 0) / 100;
            });

            const sorted = Object.entries(monthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([, v]) => v);

            setChartData(sorted);
        } catch (err) {
            console.error('Failed to fetch chart data:', err);
            setIsEmpty(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Seed earnings handler ──────────────────────────────────
    const handleSeed = useCallback(async () => {
        setSeeding(true);
        setToast(null);
        try {
            const res = await api.post('/forecast/seed');
            const count = res.data?.rowCount || 0;
            setToast({ type: 'success', msg: `${count} days of earnings data loaded` });
            fetchData();
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to seed earnings data' });
        } finally {
            setSeeding(false);
            setTimeout(() => setToast(null), 5000);
        }
    }, [fetchData]);

    // ── SMS simulation handler ─────────────────────────────────
    const handleSimulate = useCallback(async () => {
        setSimulating(true);
        setToast(null);
        try {
            const res = await api.post('/expenses/sms-batch', { messages: DEMO_SMS });
            const created = res.data?.data?.created || 0;
            setToast({ type: 'success', msg: `${created} SMS expenses imported successfully` });
            fetchData();
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.error?.message || 'Import failed, please try again' });
        } finally {
            setSimulating(false);
            setTimeout(() => setToast(null), 5000);
        }
    }, [fetchData]);

    // ── AI Insights handler ────────────────────────────────────
    const handleInsights = useCallback(async () => {
        if (insights && insightsOpen) {
            setInsightsOpen(false);
            return;
        }
        if (insights) {
            setInsightsOpen(true);
            return;
        }

        setInsightsLoading(true);
        setInsightsOpen(true);
        try {
            const res = await api.get('/insights/financial');
            const data = res.data?.data;
            setInsights(data?.insights || []);
        } catch (err) {
            console.error('Failed to fetch insights:', err);
            setInsights(null);
            setToast({ type: 'error', msg: 'Failed to generate insights' });
            setTimeout(() => setToast(null), 5000);
        } finally {
            setInsightsLoading(false);
        }
    }, [insights, insightsOpen]);

    // ── Custom tooltip ─────────────────────────────────────────
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white border border-gigpay-border rounded-xl p-3 shadow-lg text-sm">
                <p className="font-semibold text-gigpay-navy mb-1">{label}</p>
                {payload.map((p) => (
                    <p key={p.dataKey} style={{ color: p.color }}>
                        {p.name}: {formatRupee(p.value)}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-heading-md flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-500" /> Expense vs Earnings
                </h2>
            </div>

            <Card className="bg-white p-5">
                {/* ── Chart ──────────────────────────────────────── */}
                {loading ? (
                    <div className="h-52 flex items-center justify-center text-gigpay-text-muted">
                        <Loader2 size={20} className="animate-spin mr-2" /> Loading chart…
                    </div>
                ) : isEmpty ? (
                    <div className="py-10 text-center">
                        <BarChart3 size={40} className="mx-auto text-gigpay-neutral-300 mb-3" />
                        <p className="text-body-md text-gigpay-text-secondary">
                            No data yet — seed earnings or import SMS to see your expense vs earnings trend
                        </p>
                    </div>
                ) : (
                    <div className="h-52 w-full mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={formatRupee} width={55} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" height={32} iconType="circle" iconSize={8}
                                    formatter={(v) => <span className="text-xs text-gigpay-text-secondary">{v}</span>} />
                                <Line type="monotone" dataKey="earnings" name="Earnings" stroke="#1e293b" strokeWidth={2.5}
                                    dot={{ r: 4, fill: '#1e293b' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5}
                                    strokeDasharray="5 5" dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* ── Action Buttons ─────────────────────────────── */}
                <div className="mt-4 pt-4 border-t border-gigpay-border flex flex-col gap-2">
                    <button onClick={handleSeed} disabled={seeding || simulating}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all
                            ${seeding ? 'bg-gray-200 text-gray-400 cursor-wait' : 'bg-gigpay-navy text-white hover:bg-gray-800 shadow-brutal-sm active:translate-y-0.5'}`}>
                        {seeding ? <><Loader2 size={16} className="animate-spin" /> Seeding data…</> : <><Database size={16} /> Seed Earnings Data</>}
                    </button>

                    <button onClick={handleSimulate} disabled={simulating || seeding}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all
                            ${simulating ? 'bg-gray-200 text-gray-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-brutal-sm active:translate-y-0.5'}`}>
                        {simulating ? <><Loader2 size={16} className="animate-spin" /> Processing SMS…</> : <><MessageSquare size={16} /> Simulate SMS Import</>}
                    </button>

                    {/* ── AI Insights Button ─────────────────────── */}
                    <button onClick={handleInsights} disabled={insightsLoading}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all
                            ${insightsLoading
                                ? 'bg-gray-200 text-gray-400 cursor-wait'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-brutal-sm active:translate-y-0.5'
                            }`}>
                        {insightsLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Generating insights…</>
                        ) : (
                            <><Sparkles size={16} /> {insightsOpen ? 'Hide AI Insights' : 'Get AI Insights'}
                                {insightsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </>
                        )}
                    </button>

                    {/* Toast */}
                    {toast && (
                        <div className={`mt-1 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm
                            ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {toast.msg}
                        </div>
                    )}
                </div>

                {/* ── Insights Display ───────────────────────────── */}
                {insightsOpen && (
                    <div className="mt-4 pt-4 border-t border-gigpay-border">
                        {insightsLoading ? (
                            <div className="flex items-center justify-center py-8 text-gigpay-text-muted">
                                <Loader2 size={20} className="animate-spin mr-2" /> Analysing your financial data…
                            </div>
                        ) : insights && insights.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-heading-sm flex items-center gap-2 mb-1">
                                    <Sparkles size={16} className="text-purple-500" /> Personalised Insights
                                </h3>
                                {insights.map((insight, i) => {
                                    const meta = INSIGHT_META[insight.type] || INSIGHT_META.advice;
                                    const Icon = meta.icon;
                                    return (
                                        <div key={i} className={`rounded-xl p-4 border ${meta.border} ${meta.bg}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 ${meta.color}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-gigpay-navy mb-1">{insight.title}</h4>
                                                    <p className="text-sm text-gigpay-text-secondary leading-relaxed mb-2">{insight.body}</p>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gigpay-navy bg-white/60 rounded-lg px-3 py-1.5 w-fit">
                                                        <Lightbulb size={12} />
                                                        {insight.action}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-sm text-gigpay-text-muted">
                                No insights available — try seeding data first
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </section>
    );
}

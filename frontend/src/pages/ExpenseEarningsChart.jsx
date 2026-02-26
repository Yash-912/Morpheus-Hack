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

// ── Realistic Mumbai delivery worker SMS pool (24 messages across all expense categories) ─
const SMS_POOL = [
    // ── Fuel (6) ──
    { body: 'Rs.450 debited at HP PETROL PUMP via UPI on 12-Jan', timestamp: '2026-01-12T10:30:00' },
    { body: '₹520 paid to IOCL FUEL STATION Andheri via UPI', timestamp: '2026-01-18T08:15:00' },
    { body: 'Rs.380 debited at NAYARA ENERGY PUMP Bandra', timestamp: '2026-01-25T09:00:00' },
    { body: '₹610 paid to BPCL PETROL PUMP Dadar via UPI', timestamp: '2026-02-03T07:45:00' },
    { body: 'Rs.475 debited at SHELL PETROL PUMP Powai', timestamp: '2026-02-10T08:30:00' },
    { body: '₹550 paid to HP PETROLEUM Goregaon via UPI on 19-Feb', timestamp: '2026-02-19T09:20:00' },
    // ── Toll (4) ──
    { body: 'FASTag: Rs.85 deducted at WESTERN EXPRESS HIGHWAY toll', timestamp: '2026-01-20T07:30:00' },
    { body: 'FASTag: ₹45 deducted at BANDRA WORLI SEALINK toll plaza', timestamp: '2026-01-28T06:50:00' },
    { body: 'FASTag: Rs.35 deducted at AIROLI BRIDGE toll plaza', timestamp: '2026-02-08T07:10:00' },
    { body: 'NETC FASTag: ₹65 deducted at VASHI BRIDGE toll', timestamp: '2026-02-15T18:40:00' },
    // ── Maintenance (4) ──
    { body: 'Rs.1200 paid to HERO HONDA SERVICE CENTER via UPI on 05-Feb', timestamp: '2026-02-05T11:30:00' },
    { body: '₹350 paid to PUNCTURE REPAIR WORKSHOP Kurla via UPI', timestamp: '2026-01-15T14:20:00' },
    { body: 'Rs.2500 debited at BAJAJ AUTO SERVICE GARAGE Thane', timestamp: '2026-02-12T10:00:00' },
    { body: '₹800 paid to TVS SERVICING CENTER Malad via UPI', timestamp: '2026-02-20T13:00:00' },
    // ── Food (4) ──
    { body: '₹120 paid to SHARMA DHABA Andheri via UPI', timestamp: '2026-01-14T13:30:00' },
    { body: 'Rs.90 debited at MUMBAI CAFE Bandra for food', timestamp: '2026-01-22T12:45:00' },
    { body: '₹150 paid to DOMINOS PIZZA Powai via UPI', timestamp: '2026-02-01T20:00:00' },
    { body: 'Rs.65 debited at CHAI POINT Kurla via UPI on 14-Feb', timestamp: '2026-02-14T16:30:00' },
    // ── Mobile Recharge (3) ──
    { body: 'Rs.299 debited for Jio recharge, validity 28 days. -JioCare', timestamp: '2026-02-18T10:00:00' },
    { body: '₹239 debited for Airtel prepaid recharge, validity 28 days', timestamp: '2026-01-10T09:00:00' },
    { body: 'Rs.179 debited for Vi recharge plan, validity 24 days', timestamp: '2026-02-06T11:15:00' },
    // ── Parking (3) ──
    { body: '₹30 paid for parking at ANDHERI STATION PARKING lot', timestamp: '2026-01-16T08:00:00' },
    { body: 'Rs.50 debited at BANDRA KURLA COMPLEX PARKING via UPI', timestamp: '2026-02-09T10:45:00' },
    { body: '₹40 paid for parking at DADAR STATION PARKING lot', timestamp: '2026-02-22T07:30:00' },
];

// Pick N random unique SMS from the pool
function pickRandomSms(n = 3) {
    const shuffled = [...SMS_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

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
            const res = await api.post('/expenses/sms-batch', { messages: pickRandomSms(3) });
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

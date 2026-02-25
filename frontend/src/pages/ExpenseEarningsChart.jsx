import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api.service';

// ── Hardcoded realistic Mumbai delivery worker SMS for simulation ─
const DEMO_SMS = [
    { body: 'Rs.450 debited at HP PETROL PUMP via UPI on 15-Jan', timestamp: '2023-01-15T10:30:00' },
    { body: 'FASTag: Rs.65 deducted at MUMBAI-PUNE EXPRESSWAY toll plaza', timestamp: '2023-01-15T11:00:00' },
    { body: 'Rs.486 paid to Zomato via UPI ref 302912837. -HDFC Bank', timestamp: '2023-01-16T13:20:00' },
    { body: 'Rs.239 paid to Airtel via UPI — recharge successful', timestamp: '2023-01-17T09:15:00' },
    { body: 'Rs.60 parking fee collected at BKC PARKING MUMBAI via FASTag', timestamp: '2023-01-18T14:45:00' },
    { body: 'Rs.1200 paid to HERO HONDA SERVICE CENTER via UPI on 20-Jan', timestamp: '2023-01-20T11:30:00' },
    { body: 'Rs.380 debited at BHARAT PETROLEUM, Andheri on 22-Jan', timestamp: '2023-01-22T08:00:00' },
    { body: 'FASTag: Rs.85 deducted at WESTERN EXPRESS HIGHWAY on 24-Jan', timestamp: '2023-01-24T07:30:00' },
    { body: 'Rs.340 paid to Swiggy India via UPI ref 837462910', timestamp: '2023-01-25T19:00:00' },
    { body: 'Rs.299 debited for Jio recharge, validity 28 days. -JioCare', timestamp: '2023-01-28T10:00:00' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatRupee = (val) => `₹${(val / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function ExpenseEarningsChart() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);

    // SMS simulation state
    const [simulating, setSimulating] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg }

    // ── Fetch data ─────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch last 6 months of expense and earnings data
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
            const endDate = now.toISOString();

            const [expensesRes, earningsRes] = await Promise.all([
                api.get('/expenses', {
                    params: { startDate, endDate, limit: 100 },
                }).catch(() => ({ data: { data: [] } })),
                api.get('/earnings/history', {
                    params: { startDate, endDate, limit: 100 },
                }).catch(() => ({ data: { data: [] } })),
            ]);

            const expenses = expensesRes.data?.data || [];
            const earnings = earningsRes.data?.data || [];

            if (expenses.length === 0 && earnings.length === 0) {
                setIsEmpty(true);
                setChartData([]);
                setLoading(false);
                return;
            }

            setIsEmpty(false);

            // Aggregate by month
            const monthMap = {};
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthMap[key] = { month: MONTHS[d.getMonth()], earnings: 0, expenses: 0 };
            }

            earnings.forEach((e) => {
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthMap[key]) monthMap[key].earnings += Number(e.totalAmount || e.netAmount || 0);
            });

            expenses.forEach((e) => {
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthMap[key]) monthMap[key].expenses += Number(e.amount || 0);
            });

            setChartData(Object.values(monthMap));
        } catch (err) {
            console.error('Failed to fetch chart data:', err);
            setIsEmpty(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── SMS simulation handler ─────────────────────────────────
    const handleSimulate = useCallback(async () => {
        setSimulating(true);
        setToast(null);
        try {
            const res = await api.post('/expenses/sms-batch', { messages: DEMO_SMS });
            const created = res.data?.data?.created || 0;
            setToast({ type: 'success', msg: `${created} SMS expenses imported successfully` });
            // Refresh chart data
            fetchData();
        } catch (err) {
            setToast({
                type: 'error',
                msg: err.response?.data?.error?.message || 'Import failed, please try again',
            });
        } finally {
            setSimulating(false);
            // Auto-dismiss toast after 5 seconds
            setTimeout(() => setToast(null), 5000);
        }
    }, [fetchData]);

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
                {loading ? (
                    <div className="h-52 flex items-center justify-center text-gigpay-text-muted">
                        <Loader2 size={20} className="animate-spin mr-2" /> Loading chart…
                    </div>
                ) : isEmpty ? (
                    <div className="py-10 text-center">
                        <BarChart3 size={40} className="mx-auto text-gigpay-neutral-300 mb-3" />
                        <p className="text-body-md text-gigpay-text-secondary">
                            No data yet — import your SMS or add earnings to see your expense vs earnings trend
                        </p>
                    </div>
                ) : (
                    <div className="h-52 w-full mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    tickFormatter={(v) => `₹${(v / 100).toFixed(0)}`}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    height={32}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(v) => <span className="text-xs text-gigpay-text-secondary">{v}</span>}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="earnings"
                                    name="Earnings"
                                    stroke="#1e293b"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: '#1e293b' }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    name="Expenses"
                                    stroke="#ef4444"
                                    strokeWidth={2.5}
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, fill: '#ef4444' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* ── Simulate SMS Import ────────────────────────── */}
                <div className="mt-4 pt-4 border-t border-gigpay-border">
                    <button
                        onClick={handleSimulate}
                        disabled={simulating}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all
                            ${simulating
                                ? 'bg-gray-200 text-gray-400 cursor-wait'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-brutal-sm active:translate-y-0.5'
                            }`}
                    >
                        {simulating ? (
                            <><Loader2 size={16} className="animate-spin" /> Processing SMS…</>
                        ) : (
                            <><MessageSquare size={16} /> Simulate SMS Import</>
                        )}
                    </button>

                    {/* Toast */}
                    {toast && (
                        <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm
                            ${toast.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                        >
                            {toast.type === 'success'
                                ? <CheckCircle size={16} />
                                : <AlertCircle size={16} />
                            }
                            {toast.msg}
                        </div>
                    )}
                </div>
            </Card>
        </section>
    );
}

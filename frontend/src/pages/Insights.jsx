import { useState, useEffect } from 'react';
import { useInsights } from '../hooks/useInsights';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useUIStore } from '../store/ui.store';
import { Activity, Lightbulb, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatRupee = (val) => `₹${(val / 100).toFixed(0)}`;

// Dummy sparkline data since backend currently returns aggregates only
const dummyChartData = [
    { day: 'Mon', earnings: 120000 },
    { day: 'Tue', earnings: 180000 },
    { day: 'Wed', earnings: 80000 },
    { day: 'Thu', earnings: 210000 },
    { day: 'Fri', earnings: 260000 },
    { day: 'Sat', earnings: 310000 },
    { day: 'Sun', earnings: 290000 },
];

const Insights = () => {
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const { performance, algoInsights, isLoadingPerformance, isLoadingAlgo } = useInsights(null, 'bangalore');

    useEffect(() => {
        setActiveTab('more'); // Fits under the "More" or "Community" tab
    }, [setActiveTab]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header>
                <h1 className="text-display-sm font-syne font-bold text-gigpay-navy mb-1">Insights & Analytics</h1>
                <p className="text-body-md text-gigpay-text-secondary">AI-powered earnings forecast</p>
            </header>

            {/* Performance Overview */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-heading-md flex items-center gap-2">
                        <Activity size={20} className="text-gigpay-lime" /> Performance vs City
                    </h2>
                </div>

                <Card className="bg-white p-4">
                    {isLoadingPerformance ? (
                        <div className="h-40 flex items-center justify-center text-gigpay-text-muted">Analyzing...</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-caption text-gigpay-text-secondary mb-1">Your 30-Day Avg</p>
                                    <h3 className="text-display-sm font-bold text-gigpay-navy">
                                        {formatRupee(performance?.user?.avgPerEntry || 0)}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <Badge variant={performance?.comparison?.percentVsCity >= 0 ? 'success' : 'warning'} className="mb-1">
                                        {performance?.comparison?.percentVsCity >= 0 ? <TrendingUp size={12} className="mr-1 inline" /> : <TrendingDown size={12} className="mr-1 inline" />}
                                        {Math.abs(performance?.comparison?.percentVsCity || 0)}%
                                    </Badge>
                                    <p className="text-caption text-gigpay-text-secondary">
                                        vs City Average
                                    </p>
                                </div>
                            </div>

                            <div className="h-40 w-full mb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dummyChartData}>
                                        <defs>
                                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#b5e02e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#b5e02e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <Tooltip
                                            formatter={(value) => [formatRupee(value), 'Earnings']}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '4px 4px 0px rgba(30, 41, 59, 1)' }}
                                        />
                                        <Area type="monotone" dataKey="earnings" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </Card>
            </section>

            {/* Algorithmic Hacks Feed */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-heading-md flex items-center gap-2">
                        <Lightbulb size={20} className="text-[#FFD166]" fill="#FFD166" /> Algorithmic Hacks
                    </h2>
                </div>

                <div className="flex flex-col gap-3">
                    {isLoadingAlgo ? (
                        <Card className="p-4 text-center text-gigpay-text-muted">Loading insights...</Card>
                    ) : algoInsights && algoInsights.length > 0 ? (
                        algoInsights.map((insight) => (
                            <Card key={insight.id} className="p-4 bg-[#FFFAEB] border-[#FFD166]">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className="bg-white border-gigpay-border text-gigpay-navy">{insight.platform}</Badge>
                                    <div className="flex items-center gap-1 text-gigpay-text-secondary text-caption bg-white px-2 py-0.5 rounded-full border border-gigpay-border shadow-sm">
                                        <Users size={12} /> {insight.upvotes}
                                    </div>
                                </div>
                                <p className="text-body-md font-bold text-gigpay-navy mb-1">{insight.pattern}</p>
                                <p className="text-caption text-gigpay-text-secondary flex items-center justify-between">
                                    <span>Added exactly {new Date(insight.createdAt).toLocaleDateString()}</span>
                                    <span className="capitalize px-2 py-0.5 bg-gigpay-surface rounded-md">{insight.type.replace('_', ' ')}</span>
                                </p>
                            </Card>
                        ))
                    ) : (
                        <Card className="p-6 text-center">
                            <Lightbulb size={32} className="mx-auto text-gigpay-neutral-300 mb-2" />
                            <p className="text-body-md text-gigpay-text-secondary">No algorithmic insights found for your city right now.</p>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Insights;

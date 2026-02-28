import { useState, useEffect, useCallback } from 'react';
import { useInsights } from '../hooks/useInsights';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useUIStore } from '../store/ui.store';
import { Activity, Lightbulb, TrendingUp, TrendingDown, Users, Upload, Zap, CheckCircle, AlertCircle, Loader2, ArrowRight, Calculator } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api.service';
import ExpenseEarningsChart from './ExpenseEarningsChart';
import InsightExplanation from '../components/insights/InsightExplanation';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';

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
    const { t } = useLanguage();

    // ── Forecast state ──────────────────────────────────────────
    const [hasData, setHasData] = useState(false);
    const [checkingData, setCheckingData] = useState(true);
    const [uploadStatus, setUploadStatus] = useState(null); // null | 'success' | 'error'
    const [uploadMsg, setUploadMsg] = useState('');
    const [uploading, setUploading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [forecast, setForecast] = useState(null);
    const [forecastError, setForecastError] = useState(null);

    useEffect(() => {
        setActiveTab('more');
    }, [setActiveTab]);

    // Check if user already has forecast data
    useEffect(() => {
        const check = async () => {
            try {
                const res = await api.get('/forecast/has-data');
                setHasData(res.data.hasData);
            } catch {
                // silent — user may not be logged in
            } finally {
                setCheckingData(false);
            }
        };
        check();
    }, []);

    // ── CSV Upload handler ──────────────────────────────────────
    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus(null);
        setUploadMsg('');
        setForecast(null);
        setForecastError(null);

        try {
            const form = new FormData();
            form.append('file', file);

            const res = await api.post('/forecast/upload-csv', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUploadStatus('success');
            setUploadMsg(res.data.message || 'CSV uploaded successfully');
            setHasData(true);
        } catch (err) {
            setUploadStatus('error');
            const errorData = err.response?.data?.error;
            const msg = typeof errorData === 'string' ? errorData : errorData?.message || 'Upload failed — please check your CSV format';
            setUploadMsg(msg);
        } finally {
            setUploading(false);
            // Reset the file input so same file can be re-selected
            e.target.value = '';
        }
    }, []);

    // ── Forecast handler ────────────────────────────────────────
    const handleForecast = useCallback(async () => {
        setPredicting(true);
        setForecast(null);
        setForecastError(null);

        try {
            const res = await api.post('/forecast/predict');
            setForecast(res.data.data);
        } catch (err) {
            const errorData = err.response?.data?.error;
            const msg = typeof errorData === 'string' ? errorData : errorData?.message || 'Prediction failed — make sure the ML service is running';
            setForecastError(msg);
        } finally {
            setPredicting(false);
        }
    }, []);

    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header>
                <h1 className="text-display-sm font-syne font-bold text-gigpay-navy mb-1">{t('insightsAnalytics')}</h1>
                <p className="text-body-md text-gigpay-text-secondary">{t('aiPoweredForecast')}</p>
            </header>

            {/* ═══════════════════════════════════════════════════
                Explainable AI Summary + Chart
                ═══════════════════════════════════════════════════ */}
            <div>
                {/* AI Summary Banner */}
                <InsightExplanation insightData={{
                    trend: 'Last 7 Days Earnings',
                    data: dummyChartData,
                    totalWeekly: dummyChartData.reduce((acc, d) => acc + d.earnings, 0) / 100
                }} />

                <ExpenseEarningsChart />
            </div>

            {/* Tax Assistant card — link to /insights/tax */}
            <Card
                onClick={() => navigate('/tax-hub')}
                className="p-4 bg-gradient-to-r from-[#FFFAEB] to-[#FEF3C7] border-[#FFD166] cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-[#FFD166] shadow-sm">
                        <Calculator size={22} className="text-[#D97706]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-syne font-bold text-gigpay-navy text-sm">{t('taxAssistant')}</h3>
                        <p className="text-xs text-gigpay-text-secondary">{t('taxAssistantDesc')}</p>
                    </div>
                    <ArrowRight size={18} className="text-gigpay-text-muted" />
                </div>
            </Card>

            {/* ═══════════════════════════════════════════════════
                Forecast Earnings Section
                ═══════════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-heading-md flex items-center gap-2">
                        <Zap size={20} className="text-teal-500" /> {t('forecastEarnings')}
                    </h2>
                </div>

                <Card className="bg-white p-5">
                    {checkingData ? (
                        <div className="flex items-center justify-center py-6 text-gigpay-text-muted">
                            <Loader2 size={20} className="animate-spin mr-2" /> {t('checkingData')}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* Upload CSV */}
                            <div>
                                <p className="text-caption text-gigpay-text-secondary mb-2">
                                    {hasData
                                        ? t('dataLoaded')
                                        : t('uploadCsvPrompt')}
                                </p>

                                <label
                                    htmlFor="forecast-csv"
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all
                                        ${uploading
                                            ? 'bg-gray-100 text-gray-400 cursor-wait'
                                            : 'bg-gigpay-surface text-gigpay-navy border border-gigpay-border hover:border-teal-400 hover:shadow-sm'
                                        }`}
                                >
                                    {uploading ? (
                                        <><Loader2 size={16} className="animate-spin" /> {t('uploading')}</>
                                    ) : (
                                        <><Upload size={16} /> {t('uploadEarningsCsv')}</>
                                    )}
                                </label>
                                <input
                                    id="forecast-csv"
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                            </div>

                            {/* Upload status message */}
                            {uploadStatus === 'success' && (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                                    <CheckCircle size={16} /> {uploadMsg}
                                </div>
                            )}
                            {uploadStatus === 'error' && (
                                <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
                                    <AlertCircle size={16} /> {uploadMsg}
                                </div>
                            )}

                            {/* Forecast button */}
                            {hasData && (
                                <button
                                    onClick={handleForecast}
                                    disabled={predicting}
                                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all
                                        ${predicting
                                            ? 'bg-gray-200 text-gray-400 cursor-wait'
                                            : 'bg-gigpay-navy text-white hover:bg-gigpay-navy/90 shadow-brutal-sm active:translate-y-0.5'
                                        }`}
                                >
                                    {predicting ? (
                                        <><Loader2 size={16} className="animate-spin" /> {t('predicting')}</>
                                    ) : (
                                        <><Zap size={16} /> {t('forecastTomorrow')}</>
                                    )}
                                </button>
                            )}

                            {/* Forecast error */}
                            {forecastError && (
                                <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
                                    <AlertCircle size={16} /> {forecastError}
                                </div>
                            )}

                            {/* Forecast result */}
                            {forecast && (
                                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 mt-1">
                                    <p className="text-caption text-teal-700 font-semibold mb-1">
                                        {t('tomorrowPredicted')}
                                    </p>
                                    <h3 className="text-display-sm font-bold text-gigpay-navy mb-3">
                                        ₹{forecast.predicted_earnings_rupees?.toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={
                                                forecast.confidence >= 0.85 ? 'success'
                                                    : forecast.confidence >= 0.75 ? 'warning'
                                                        : 'default'
                                            }
                                        >
                                            {(forecast.confidence * 100).toFixed(0)}% {t('confidence')}
                                        </Badge>
                                        <span className="text-caption text-gigpay-text-secondary">
                                            ≈ ₹{Math.round(forecast.predicted_earnings_rupees)} {t('perDay')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </section>

            {/* Performance Overview */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-heading-md flex items-center gap-2">
                        <Activity size={20} className="text-gigpay-lime" /> {t('performanceVsCity')}
                    </h2>
                </div>

                <Card className="bg-white p-4">
                    {isLoadingPerformance ? (
                        <div className="h-40 flex items-center justify-center text-gigpay-text-muted">{t('analyzing')}</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-caption text-gigpay-text-secondary mb-1">{t('your30DayAvg')}</p>
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
                                        {t('vsCityAverage')}
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
                        <Lightbulb size={20} className="text-[#FFD166]" fill="#FFD166" /> {t('algorithmicHacks')}
                    </h2>
                    <Button variant="ghost" size="ghost" className="pe-0" onClick={() => navigate('/insights/algo')}>{t('seeAll')} <ArrowRight size={16} className="ml-1" /></Button>
                </div>

                <div className="flex flex-col gap-3">
                    {isLoadingAlgo ? (
                        <Card className="p-4 text-center text-gigpay-text-muted">{t('loadingInsights')}</Card>
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
                            <p className="text-body-md text-gigpay-text-secondary">{t('noAlgoInsights')}</p>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Insights;

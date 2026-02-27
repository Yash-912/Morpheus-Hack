import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ArrowLeft, TrendingUp, TrendingDown, Filter, Loader2, MessageSquare, ClipboardPaste, Send, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api.service';
import toast from 'react-hot-toast';

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
    const [pasteText, setPasteText] = React.useState('');
    const [pasteSender, setPasteSender] = React.useState('AX-HDFCBK');
    const [isPasting, setIsPasting] = React.useState(false);
    const [showPaste, setShowPaste] = React.useState(false);

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

    const handlePasteSubmit = async () => {
        if (!pasteText.trim()) return;
        setIsPasting(true);
        try {
            // Split by double-newline or treat entire text as one message
            const lines = pasteText.split(/\n{2,}/).filter(l => l.trim());
            const messages = lines.map((body) => ({
                sender: pasteSender,
                body: body.trim(),
                timestamp: new Date().toISOString(),
            }));

            const { data } = await api.post('/sms/sync', {
                messages,
                totalScanned: messages.length,
            });

            const synced = data.synced || data.data?.detected || 0;
            toast.success(`Processed ${messages.length} SMS → ${synced} new transactions`);
            setPasteText('');
            setShowPaste(false);
            await fetchData(); // Refresh transaction list
        } catch (e) {
            console.error('Paste SMS failed:', e);
            toast.error('Failed to process pasted SMS');
        } finally {
            setIsPasting(false);
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
                <button
                    onClick={() => setShowPaste(!showPaste)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-dm-sans font-semibold hover:bg-blue-100 transition-all"
                >
                    <ClipboardPaste size={14} />
                    Paste SMS
                    {showPaste ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </header>

            {/* Paste SMS Panel */}
            {showPaste && (
                <Card className="p-4 border-2 border-blue-200 border-dashed bg-blue-50/30">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-dm-sans font-semibold text-gigpay-text-secondary">Sender ID:</label>
                            <select
                                value={pasteSender}
                                onChange={(e) => setPasteSender(e.target.value)}
                                className="text-xs px-2 py-1 rounded-md border border-gray-300 bg-white font-dm-sans"
                            >
                                <option value="AX-HDFCBK">AX-HDFCBK (HDFC)</option>
                                <option value="VD-ICICIB">VD-ICICIB (ICICI)</option>
                                <option value="JD-SBIINB">JD-SBIINB (SBI)</option>
                                <option value="AD-ZOMATO">AD-ZOMATO (Zomato)</option>
                                <option value="BX-SWIGGY">BX-SWIGGY (Swiggy)</option>
                                <option value="CP-OLARIDE">CP-OLARIDE (Ola)</option>
                                <option value="DM-UBERIND">DM-UBERIND (Uber)</option>
                                <option value="VM-DUNZOW">VM-DUNZOW (Dunzo)</option>
                                <option value="HP-FASTAG">HP-FASTAG (FASTag)</option>
                                <option value="JD-GPAY">JD-GPAY (Google Pay)</option>
                            </select>
                        </div>
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder={"Paste SMS messages here...\nSeparate multiple messages with a blank line.\n\nExample:\nRs 1,250.00 debited from A/c XX4523 at PVR Cinemas.\n\nYou earned Rs 1,847.00 today (12 deliveries)."}
                            rows={5}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-dm-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        />
                        <button
                            onClick={handlePasteSubmit}
                            disabled={isPasting || !pasteText.trim()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gigpay-navy text-white text-sm font-dm-sans font-semibold disabled:opacity-50 hover:bg-opacity-90 transition-all"
                        >
                            {isPasting ? (
                                <><Loader2 size={16} className="animate-spin" /> Processing...</>
                            ) : (
                                <><Send size={16} /> Sync Pasted SMS</>
                            )}
                        </button>
                    </div>
                </Card>
            )}

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

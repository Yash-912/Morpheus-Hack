import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMicroSavings } from '../hooks/useMicroSavings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Coins, Target, Plus, AlertTriangle, TrendingUp, ArrowDownToLine } from 'lucide-react';

const GOLD_BUY_OPTIONS = [10, 15, 25];

const MicroSavingsHub = () => {
    const navigate = useNavigate();
    const {
        portfolio,
        isLoadingPortfolio,
        buyGold,
        isBuyingGold,
        sellGold,
        isSellingGold,
        createGullak,
        isCreatingGullak,
        createGullakError,
    } = useMicroSavings();

    const [showGullakForm, setShowGullakForm] = useState(false);
    const [gullakTitle, setGullakTitle] = useState('');
    const [gullakTarget, setGullakTarget] = useState('');
    const [gullakDaily, setGullakDaily] = useState('');
    const [capError, setCapError] = useState(null);
    const [sellAmount, setSellAmount] = useState('');
    const [showSell, setShowSell] = useState(false);

    const handleBuyGold = async (amount) => {
        try {
            await buyGold(amount);
        } catch (e) { /* handled by hook */ }
    };

    const handleSellGold = async () => {
        if (!sellAmount) return;
        try {
            await sellGold(Number(sellAmount));
            setSellAmount('');
            setShowSell(false);
        } catch (e) { /* handled by hook */ }
    };

    const handleCreateGullak = async () => {
        setCapError(null);
        try {
            await createGullak({
                title: gullakTitle,
                targetAmount: Number(gullakTarget),
                dailyDeductionLimit: Number(gullakDaily),
            });
            setShowGullakForm(false);
            setGullakTitle('');
            setGullakTarget('');
            setGullakDaily('');
        } catch (error) {
            const errData = error?.response?.data?.error;
            if (errData?.code === 'AFFORDABILITY_CAP_EXCEEDED') {
                setCapError(errData.message);
            }
        }
    };

    const gold = portfolio?.gold;
    const activeGullaks = portfolio?.activeGullaks || [];
    const estimatedDays = gullakDaily && gullakTarget ? Math.ceil(Number(gullakTarget) / Number(gullakDaily)) : null;

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Micro-Savings</h1>
            </header>

            {isLoadingPortfolio ? (
                <div className="p-12 text-center text-gigpay-text-muted">Loading your savings...</div>
            ) : (
                <>
                    {/* ── Digital Gold Locker ── */}
                    <section>
                        <h2 className="text-heading-md text-gigpay-navy mb-3 flex items-center gap-2">
                            <Coins size={20} className="text-yellow-500" /> Digital Gold Locker
                        </h2>
                        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gigpay-text-secondary">Your Gold</p>
                                    <p className="text-display-sm font-bold text-gigpay-navy">{(gold?.grams || 0).toFixed(3)}g</p>
                                    <p className="text-xs text-gigpay-text-muted mt-0.5">@ ₹{gold?.ratePerGram}/g</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gigpay-text-secondary">Live Value</p>
                                    <p className="text-heading-lg font-bold text-green-600">₹{gold?.liveInrValue || 0}</p>
                                </div>
                            </div>

                            {/* Quick Buy */}
                            <div className="flex gap-2 mb-3">
                                {GOLD_BUY_OPTIONS.map((amt) => (
                                    <Button
                                        key={amt}
                                        onClick={() => handleBuyGold(amt)}
                                        disabled={isBuyingGold}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2"
                                    >
                                        Buy ₹{amt}
                                    </Button>
                                ))}
                            </div>

                            {/* Emergency Sell */}
                            {!showSell ? (
                                <button
                                    onClick={() => setShowSell(true)}
                                    className="text-xs text-red-500 underline"
                                >
                                    Emergency Liquidation
                                </button>
                            ) : (
                                <div className="flex gap-2 mt-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-2.5 text-gigpay-text-secondary font-bold text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={sellAmount}
                                            onChange={(e) => setSellAmount(e.target.value)}
                                            placeholder="Amount"
                                            className="w-full p-2 pl-7 rounded-md border-2 border-red-200 focus:outline-none focus:border-red-400 shadow-sm bg-white text-sm"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSellGold}
                                        disabled={!sellAmount || isSellingGold}
                                        className="bg-red-500 hover:bg-red-600 text-white text-sm"
                                    >
                                        <ArrowDownToLine size={14} className="mr-1" /> Sell
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </section>

                    {/* ── Target Gullak Section ── */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-heading-md text-gigpay-navy flex items-center gap-2">
                                <Target size={20} className="text-gigpay-navy" /> Target Gullak
                            </h2>
                            <button
                                onClick={() => setShowGullakForm(!showGullakForm)}
                                className="flex items-center gap-1 text-sm font-bold text-gigpay-navy bg-gigpay-lime px-3 py-1.5 rounded-full"
                            >
                                <Plus size={14} /> New Goal
                            </button>
                        </div>

                        {/* Deduction Summary */}
                        <div className="flex items-center gap-2 mb-3 text-xs text-gigpay-text-secondary bg-slate-50 px-3 py-2 rounded-lg">
                            <TrendingUp size={14} />
                            <span>
                                Daily deductions: ₹{portfolio?.totalDailyDeductions || 0}/day
                                {portfolio?.totalDailyDeductions > 0 && ' (auto-deducted from payouts)'}
                            </span>
                        </div>

                        {/* Create Gullak Form */}
                        {showGullakForm && (
                            <Card className="p-4 mb-4 border-gigpay-navy/20 bg-white">
                                <h3 className="text-body-lg font-bold text-gigpay-navy mb-3">Create New Gullak</h3>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={gullakTitle}
                                        onChange={(e) => setGullakTitle(e.target.value)}
                                        placeholder="Goal name (e.g. Bike Insurance)"
                                        className="p-2.5 rounded-md border-2 border-gigpay-border focus:outline-none focus:border-gigpay-navy bg-white text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-gigpay-text-secondary font-bold text-sm">₹</span>
                                            <input
                                                type="number"
                                                value={gullakTarget}
                                                onChange={(e) => setGullakTarget(e.target.value)}
                                                placeholder="Target amount"
                                                className="w-full p-2.5 pl-7 rounded-md border-2 border-gigpay-border focus:outline-none focus:border-gigpay-navy bg-white text-sm"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-gigpay-text-secondary font-bold text-sm">₹</span>
                                            <input
                                                type="number"
                                                value={gullakDaily}
                                                onChange={(e) => setGullakDaily(e.target.value)}
                                                placeholder="Daily deduction"
                                                className="w-full p-2.5 pl-7 rounded-md border-2 border-gigpay-border focus:outline-none focus:border-gigpay-navy bg-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    {estimatedDays && (
                                        <p className="text-xs text-gigpay-text-muted">
                                            Estimated completion: <span className="font-bold text-gigpay-navy">{estimatedDays} days</span>
                                        </p>
                                    )}

                                    {/* 10% Affordability Cap Error */}
                                    {capError && (
                                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-600 font-medium">{capError}</p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleCreateGullak}
                                        disabled={!gullakTitle || !gullakTarget || !gullakDaily || isCreatingGullak}
                                        className="w-full bg-gigpay-navy hover:bg-gigpay-navy-mid text-white"
                                    >
                                        {isCreatingGullak ? 'Creating...' : 'Create Gullak'}
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Active Gullaks List */}
                        {activeGullaks.length === 0 ? (
                            <Card className="p-6 text-center border-dashed">
                                <p className="text-sm text-gigpay-text-muted">No active goals yet. Tap "New Goal" to start saving!</p>
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {activeGullaks.map((g) => (
                                    <Card key={g.id} className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-body-md font-bold text-gigpay-navy">{g.title}</h3>
                                                <p className="text-xs text-gigpay-text-muted">₹{g.dailyDeduction}/day auto-deduction</p>
                                            </div>
                                            <Badge variant={g.progress >= 80 ? 'success' : 'default'}>
                                                {g.progress}%
                                            </Badge>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gigpay-lime h-full rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${Math.min(g.progress, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gigpay-text-secondary mt-1.5">
                                            <span>₹{g.currentAmount}</span>
                                            <span>₹{g.targetAmount}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default MicroSavingsHub;

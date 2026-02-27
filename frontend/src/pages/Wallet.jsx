import { usePayouts } from '../hooks/usePayouts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowRight, History, ArrowUpRight, ArrowDownLeft, Shield, ShieldCheck, PiggyBank, Zap, ShieldAlert, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/ui.store';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import StripeCheckoutModal from '../components/payment/StripeCheckoutModal';
import { useLanguage } from '../context/LanguageContext';

const formatRupee = (paise) => {
    if (paise == null) return '0.00';
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

const Wallet = () => {
    const { balance, history, isLoadingBalance } = usePayouts();
    const navigate = useNavigate();
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        setActiveTab('wallet');
    }, [setActiveTab]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-display-sm font-syne font-bold text-gigpay-navy mb-1">{t('passbook')}</h1>
                <p className="text-body-md text-gigpay-text-secondary">{t('earningsAndWithdrawals')}</p>
            </div>

            {/* Balance Card Section */}
            <Card className="bg-gigpay-navy text-white border-0 shadow-brutal-sm p-6 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="text-body-sm text-white/70 mb-1">{t('availableForWithdrawal')}</p>
                        <h2 className="text-display-md font-syne font-bold text-white" style={{ color: '#FFFFFF' }}>
                            {isLoadingBalance ? '₹---' : formatRupee(balance?.walletBalance)}
                        </h2>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 relative z-10">
                    <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/20">
                        <p className="text-caption text-white/70 mb-0.5">{t('pendingSettlement')}</p>
                        <p className="text-body-lg font-bold">
                            {isLoadingBalance ? '₹---' : formatRupee(balance?.pendingEarnings)}
                        </p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/20">
                        <p className="text-caption text-white/70 mb-0.5">{t('withdrawnToday')}</p>
                        <p className="text-body-lg font-bold">
                            {isLoadingBalance ? '₹---' : formatRupee(balance?.todayWithdrawn)}
                        </p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full bg-gigpay-lime text-gigpay-navy hover:bg-[#b5e02e] border-gigpay-lime mt-2 relative z-10"
                    onClick={() => navigate('/cashout')}
                    disabled={balance?.walletBalance <= 0}
                >
                    {t('withdrawNow')}
                </Button>
            </Card>

            {/* Financial Services */}
            <div className="grid grid-cols-3 gap-3">
                <div onClick={() => navigate('/loans')} className="bg-white p-3 rounded-xl border-2 border-gigpay-border shadow-brutal-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-gigpay-navy transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#FFD166]/20 text-[#FFD166] flex items-center justify-center mb-2">
                        <Zap size={20} className="fill-current" />
                    </div>
                    <h4 className="font-bold text-gigpay-navy text-xs sm:text-sm">{t('loans')}</h4>
                    <p className="text-[10px] sm:text-xs text-gigpay-text-secondary mt-1">{t('zeroInterestAdvance')}</p>
                </div>
                <div onClick={() => navigate('/credit')} className="bg-white p-3 rounded-xl border-2 border-gigpay-border shadow-brutal-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-gigpay-navy transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-2">
                        <ShieldAlert size={20} />
                    </div>
                    <h4 className="font-bold text-gigpay-navy text-xs sm:text-sm">{t('emergency')}</h4>
                    <p className="text-[10px] sm:text-xs text-gigpay-text-secondary mt-1">₹500-5k</p>
                </div>
                <div onClick={() => navigate('/savings')} className="bg-white p-3 rounded-xl border-2 border-gigpay-border shadow-brutal-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-gigpay-navy transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-2">
                        <PiggyBank size={20} />
                    </div>
                    <h4 className="font-bold text-gigpay-navy text-sm">{t('savings')}</h4>
                    <p className="text-xs text-gigpay-text-secondary mt-1">{t('autoStash')}</p>
                </div>

            </div>

            {/* Escrow/Safety Notice */}
            <div className="flex items-center gap-3 bg-gigpay-lime-soft p-4 rounded-xl border border-gigpay-lime">
                <ShieldCheck size={24} className="text-gigpay-navy shrink-0" />
                <p className="text-body-sm text-gigpay-navy">
                    {t('escrowNotice')}
                </p>
            </div>

            {/* Transactions List */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-heading-md">{t('recentTransactions')}</h3>
                    <Button variant="ghost" size="sm" className="text-gigpay-navy font-bold flex items-center gap-1" onClick={() => navigate('/wallet/transactions')}>
                        <History size={16} /> {t('viewAll')}
                    </Button>
                </div>

                <div className="flex flex-col gap-3">
                    {history && history.length > 0 ? (
                        history.slice(0, 5).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gigpay-border shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'earning' ? 'bg-[#E5F5E5] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                                        }`}>
                                        {tx.type === 'earning' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-body-md font-bold text-gigpay-navy">
                                            {tx.type === 'earning' ? t('platformEarning') : t('instantWithdrawal')}
                                        </p>
                                        <p className="text-caption text-gigpay-text-secondary">
                                            {new Date(tx.createdAt).toLocaleDateString()} • {tx.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-body-md font-bold ${tx.type === 'earning' ? 'text-gigpay-navy' : 'text-gigpay-text-primary'}`}>
                                        {tx.type === 'earning' ? '+' : '-'}{formatRupee(tx.amount)}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-white rounded-xl border border-gigpay-border">
                            <p className="text-gigpay-text-secondary">{t('noTransactions')}</p>
                        </div>
                    )}
                </div>
            </section>

            <StripeCheckoutModal
                isOpen={isStripeModalOpen}
                onClose={() => setIsStripeModalOpen(false)}
                amount={500} // Hardcoded ₹500 for demo
                onSuccess={() => {
                    setIsStripeModalOpen(false);
                    toast.success('Payment successful! ₹500 added to wallet.');
                    setTimeout(() => window.location.reload(), 2000);
                }}
            />
        </div>
    );
};

export default Wallet;

import { useEffect } from 'react';
import { useUIStore } from '../store/ui.store';
import { useEarnings } from '../hooks/useEarnings';
import { useSmsSync } from '../hooks/useSmsSync';
import { EarningWidget } from '../components/ui/EarningWidget';
import { AssistantBanner } from '../components/ui/AssistantBanner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SMSPermission from '../components/expenses/SMSPermission';
import { ArrowRight, Gauge, PiggyBank, Zap, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const { today, isLoadingToday } = useEarnings();
    const navigate = useNavigate();

    // SMS auto-sync
    const { hasPermission, grantPermission, isSyncing, syncResult, lastSync, triggerSync } = useSmsSync();

    const { t } = useLanguage();

    useEffect(() => {
        setActiveTab('home');
    }, [setActiveTab]);

    // Show toast when new transactions are synced
    useEffect(() => {
        if (syncResult?.processing?.created > 0) {
            toast.success(`📲 ${syncResult.processing.created} new transactions detected from SMS`);
        }
    }, [syncResult]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* SMS Permission Banner — shows once until user clicks Allow */}
            {!hasPermission && (
                <section>
                    <SMSPermission
                        onAllow={async () => {
                            const result = await grantPermission();
                            if (result?.synced > 0) {
                                toast.success(`📲 ${result.synced} SMS messages synced`);
                            }
                        }}
                        onDismiss={() => {
                            // Dismiss but don't grant — will show again next visit
                        }}
                        isLoading={isSyncing}
                    />
                </section>
            )}

            {/* Earnings Dashboard */}
            <section>
                <EarningWidget
                    todayAmount={today?.totalAmount || 0}
                    isLoading={isLoadingToday}
                    onClick={() => navigate('/wallet')}
                />
            </section>

            {/* SMS Sync Status */}
            {hasPermission && (
                <section>
                    <Card
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors"
                        onClick={() => navigate('/sms-transactions')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <MessageSquare size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-dm-sans font-semibold text-gigpay-navy">{t('smsTransactions')}</p>
                                <p className="text-[10px] text-gigpay-text-muted font-dm-sans">
                                    {isSyncing ? t('syncing') :
                                        syncResult?.processing?.created > 0 ? `${syncResult.processing.created} ${t('newTransactions')}` :
                                            lastSync ? `${t('lastSyncAt')} ${new Date(lastSync).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}` :
                                                t('tapToView')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSyncing ? (
                                <Loader2 size={14} className="text-blue-500 animate-spin" />
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); triggerSync().then(r => r?.synced > 0 && toast.success(`📲 ${r.synced} SMS synced`)); }}
                                    className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-dm-sans font-semibold hover:bg-blue-100 transition-all"
                                >
                                    {t('reSync')}
                                </button>
                            )}
                            <ArrowRight size={14} className="text-gigpay-text-muted" />
                        </div>
                    </Card>
                </section>
            )}

            {/* Quick Actions */}
            <section>
                <AssistantBanner />
            </section>

            {/* Financial Hub */}
            <section>
                <h2 className="text-heading-md mb-3">{t('financialHub')}</h2>
                <div className="grid grid-cols-2 gap-3">
                    <Card
                        onClick={() => navigate('/gigscore')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                            <Gauge size={20} className="text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">{t('gigScore')}</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">{t('yourCreditProfile')}</p>
                    </Card>
                    <Card
                        onClick={() => navigate('/microsavings')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center mb-2">
                            <PiggyBank size={20} className="text-yellow-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">{t('microSavings')}</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">{t('goldTargetGullak')}</p>
                    </Card>
                    <Card
                        onClick={() => navigate('/credit')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                            <Zap size={20} className="text-green-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">{t('emergencyFund')}</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">{t('instantCashAdvance')}</p>
                    </Card>
                    <Card
                        onClick={() => navigate('/tax-hub')}
                        className="p-4 cursor-pointer active:translate-y-0.5 transition-all bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                    >
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                            <FileText size={20} className="text-purple-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gigpay-navy">{t('taxHub')}</h3>
                        <p className="text-[11px] text-gigpay-text-muted mt-0.5">{t('claimTdsRefund')}</p>
                    </Card>
                </div>
            </section>


        </div>
    );
};

export default Home;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import { formatCurrency } from '../../utils/formatCurrency';
import InsuranceCard from '../../components/financial/InsuranceCard';
import EmptyState from '../../components/shared/EmptyState';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { ArrowLeft, Shield } from 'lucide-react';

const TAB_KEYS = ['plans', 'active', 'claims'];

const AVAILABLE_PLANS = [
    {
        type: 'daily_accident',
        name: 'Accident Cover',
        icon: '🤕',
        coverageAmount: 10000000,
        premiumAmount: 100,
        premiumFrequency: 'day',
        description: 'Covers medical expenses from road accidents during deliveries.',
        color: 'bg-red-50 border-red-200',
    },
    {
        type: 'weekly_health',
        name: 'Health Guard',
        icon: '💊',
        coverageAmount: 5000000,
        premiumAmount: 4900,
        premiumFrequency: 'week',
        description: 'OPD visits, medicines, and basic diagnostics covered.',
        color: 'bg-blue-50 border-blue-200',
    },
    {
        type: 'device',
        name: 'Device Protection',
        icon: '📱',
        coverageAmount: 2000000,
        premiumAmount: 1500,
        premiumFrequency: 'month',
        description: 'Covers phone damage, theft, and screen replacement.',
        color: 'bg-purple-50 border-purple-200',
    },
    {
        type: 'vehicle_breakdown',
        name: 'Vehicle Breakdown',
        icon: '🔧',
        coverageAmount: 3000000,
        premiumAmount: 2000,
        premiumFrequency: 'month',
        description: 'Roadside assistance, towing, and minor repairs.',
        color: 'bg-orange-50 border-orange-200',
    },
];

const Insurance = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);
    const [tab, setTab] = useState('plans');
    const [activateModal, setActivateModal] = useState(null);
    const [isActivating, setIsActivating] = useState(false);

    // Demo active policies
    const [activePolicies] = useState([
        {
            id: '1',
            type: 'daily_accident',
            status: 'active',
            coverageAmount: 10000000,
            premiumAmount: 100,
            premiumFrequency: 'day',
            startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
            endDate: new Date(Date.now() + 23 * 86400000).toISOString(),
        },
    ]);

    // Demo claims
    const [claims] = useState([]);

    useEffect(() => { setActiveTab('wallet'); }, [setActiveTab]);

    const handleActivate = (plan) => {
        setActivateModal(plan);
    };

    const confirmActivate = async () => {
        setIsActivating(true);
        // TODO: Call insurance.api.activate()
        setTimeout(() => {
            setIsActivating(false);
            setActivateModal(null);
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Insurance</h1>
                <Shield size={22} className="text-gigpay-text-muted" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gigpay-surface rounded-xl p-1 border-[1.5px] border-gigpay-border">
                {TAB_KEYS.map((key) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 py-2.5 rounded-lg text-body-md font-semibold capitalize transition-all duration-150 ${tab === key
                                ? 'bg-white text-gigpay-navy shadow-sm border-[1px] border-gigpay-border'
                                : 'text-gigpay-text-secondary'
                            }`}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* Plans Tab */}
            {tab === 'plans' && (
                <div className="flex flex-col gap-3">
                    <p className="text-body-md text-gigpay-text-secondary">
                        Micro-insurance designed for gig workers. Pay as little as ₹1/day.
                    </p>
                    {AVAILABLE_PLANS.map((plan) => (
                        <div key={plan.type} className={`card border-[1.5px] ${plan.color}`}>
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">{plan.icon}</span>
                                <div className="flex-1">
                                    <h3 className="text-body-md font-bold text-gigpay-navy">{plan.name}</h3>
                                    <p className="text-caption text-gigpay-text-secondary mt-0.5 mb-2">
                                        {plan.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-heading-md font-bold text-gigpay-navy">
                                                {formatCurrency(plan.coverageAmount)}
                                            </span>
                                            <span className="text-caption text-gigpay-text-muted ml-1">cover</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-body-md font-bold text-gigpay-navy">
                                                {formatCurrency(plan.premiumAmount)}
                                            </span>
                                            <span className="text-caption text-gigpay-text-muted">/{plan.premiumFrequency}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleActivate(plan)}
                                        className="btn-primary w-full mt-3 text-sm py-2.5"
                                    >
                                        Activate
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Active Tab */}
            {tab === 'active' && (
                <div className="flex flex-col gap-3">
                    {activePolicies.length > 0 ? (
                        activePolicies.map((policy) => (
                            <InsuranceCard key={policy.id} policy={policy} />
                        ))
                    ) : (
                        <EmptyState
                            icon="🛡️"
                            title="No active policies"
                            description="Activate a plan to get covered today."
                            actionLabel="View Plans"
                            onAction={() => setTab('plans')}
                        />
                    )}
                </div>
            )}

            {/* Claims Tab */}
            {tab === 'claims' && (
                <div className="flex flex-col gap-3">
                    {claims.length > 0 ? (
                        claims.map((claim) => (
                            <div key={claim.id} className="card">
                                <p className="text-body-md font-semibold">{claim.description}</p>
                            </div>
                        ))
                    ) : (
                        <EmptyState
                            icon="📋"
                            title="No claims yet"
                            description="If you need to file a claim, your active policies will appear here."
                        />
                    )}
                </div>
            )}

            {/* Activation confirmation modal */}
            <ConfirmModal
                isOpen={!!activateModal}
                onClose={() => setActivateModal(null)}
                onConfirm={confirmActivate}
                isLoading={isActivating}
                title={`Activate ${activateModal?.name}?`}
                message={`You'll be charged ${formatCurrency(activateModal?.premiumAmount || 0)}/${activateModal?.premiumFrequency || 'day'} from your wallet.`}
                confirmText="Activate Now"
            />
        </div>
    );
};

export default Insurance;

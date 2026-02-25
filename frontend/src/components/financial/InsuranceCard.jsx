import { formatCurrency } from '../../utils/formatCurrency';

/**
 * InsuranceCard — Displays an active insurance policy.
 *
 * @param {object} props
 * @param {object} props.policy — Insurance policy from API
 */
const InsuranceCard = ({ policy }) => {
    const typeConfig = {
        daily_accident: { icon: '🤕', label: 'Accident', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
        weekly_health: { icon: '💊', label: 'Health', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
        device: { icon: '📱', label: 'Device', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
        vehicle_breakdown: { icon: '🔧', label: 'Vehicle', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
    };

    const config = typeConfig[policy.type] || typeConfig.daily_accident;

    const isExpiringSoon = policy.endDate && (
        new Date(policy.endDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
    );

    const daysRemaining = policy.endDate
        ? Math.max(0, Math.ceil((new Date(policy.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <div className={`card border-[1.5px] ${config.color}`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-3xl">{config.icon}</div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-body-md font-bold ${config.textColor}`}>
                            {config.label} Cover
                        </h4>
                        {policy.status === 'active' && (
                            <span className="badge badge-success">Active</span>
                        )}
                    </div>

                    {/* Coverage amount */}
                    <p className="text-heading-md text-gigpay-navy">
                        {formatCurrency(policy.coverageAmount)}
                    </p>
                    <p className="text-caption text-gigpay-text-muted">
                        Coverage • {formatCurrency(policy.premiumAmount)}/{policy.premiumFrequency || 'day'}
                    </p>

                    {/* Expiry warning */}
                    {isExpiringSoon && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-caption font-semibold text-yellow-700">
                                ⚠️ Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {/* Days remaining */}
                    {daysRemaining !== null && !isExpiringSoon && (
                        <p className="text-caption text-gigpay-text-muted mt-1">
                            📅 {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InsuranceCard;

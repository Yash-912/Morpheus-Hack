import { formatCurrency, formatPercent } from '../../utils/formatCurrency';

/**
 * SavingsGoal — Individual savings goal card with progress.
 *
 * @param {object} props
 * @param {object} props.goal — Savings goal from API
 */
const SavingsGoal = ({ goal }) => {
    const progress = goal.goalAmount > 0
        ? Math.min(100, Math.round((Number(goal.currentAmount || 0) / Number(goal.goalAmount)) * 100))
        : 0;

    const typeIcons = {
        emergency_fund: '🛟',
        festival: '🎉',
        education: '📚',
        vehicle: '🏍️',
        general: '🏦',
        custom: '🎯',
    };

    const icon = typeIcons[goal.type] || typeIcons.general;

    return (
        <div className="card">
            <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-body-md font-bold text-gigpay-navy">
                            {goal.goalName || goal.type}
                        </h4>
                        {goal.autoSaveEnabled && (
                            <span className="text-caption bg-[#C8F135]/30 text-gigpay-navy px-2 py-0.5 rounded-full font-semibold">
                                🔄 Auto
                            </span>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="mb-2">
                        <div className="flex justify-between text-caption mb-1">
                            <span className="text-green-600 font-semibold">
                                {formatCurrency(goal.currentAmount || 0)}
                            </span>
                            <span className="text-gigpay-text-muted">
                                of {formatCurrency(goal.goalAmount)}
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-green-400 to-green-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-caption text-gigpay-text-muted">
                        <span>{progress}% complete</span>
                        {goal.interestEarned > 0 && (
                            <span className="text-green-600">
                                +{formatCurrency(goal.interestEarned)} interest
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingsGoal;

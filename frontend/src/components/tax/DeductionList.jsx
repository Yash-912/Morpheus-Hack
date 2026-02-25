import { formatCurrency } from '../../utils/formatCurrency';
import { DEDUCTIBLE_CATEGORIES } from '../../constants/taxRules';

/**
 * DeductionList — Itemized deductions breakdown.
 *
 * @param {object} props
 * @param {Array<{category: string, label: string, amount: number, isDeductible: boolean}>} props.deductions
 */
const DeductionList = ({ deductions = [] }) => {
    const categoryIcons = {
        fuel: '⛽',
        toll: '🛣️',
        maintenance: '🔧',
        mobile_recharge: '📱',
        vehicle_depreciation: '📉',
        insurance_premium: '🛡️',
        section_80c: '💰',
        food: '🍕',
        parking: '🅿️',
        other: '📋',
    };

    const deductibleTotal = deductions
        .filter((d) => d.isDeductible)
        .reduce((sum, d) => sum + d.amount, 0);

    const nonDeductibleTotal = deductions
        .filter((d) => !d.isDeductible)
        .reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="flex flex-col gap-4">
            {/* Summary banner */}
            <div className="card bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-caption text-green-600">Tax-Deductible Expenses</p>
                        <p className="text-heading-lg font-bold text-green-700">
                            {formatCurrency(deductibleTotal)}
                        </p>
                    </div>
                    <span className="text-4xl">🧾</span>
                </div>
                <p className="text-caption text-green-600 mt-1">
                    These reduce your taxable income under business expenses
                </p>
            </div>

            {/* Deductible items */}
            <div>
                <h4 className="text-label text-gigpay-text-secondary mb-2">
                    ✅ Deductible ({deductions.filter((d) => d.isDeductible).length})
                </h4>
                <div className="flex flex-col gap-2">
                    {deductions
                        .filter((d) => d.isDeductible)
                        .sort((a, b) => b.amount - a.amount)
                        .map((d, i) => (
                            <div key={i} className="card py-3 flex items-center gap-3">
                                <span className="text-xl">{categoryIcons[d.category] || '📋'}</span>
                                <div className="flex-1">
                                    <p className="text-body-md font-semibold text-gigpay-navy">{d.label}</p>
                                    {DEDUCTIBLE_CATEGORIES.find((c) => c.key === d.category) && (
                                        <p className="text-caption text-gigpay-text-muted">
                                            {DEDUCTIBLE_CATEGORIES.find((c) => c.key === d.category)?.section}
                                        </p>
                                    )}
                                </div>
                                <span className="text-body-md font-bold text-green-600">
                                    {formatCurrency(d.amount)}
                                </span>
                            </div>
                        ))}
                </div>
            </div>

            {/* Non-deductible items */}
            {deductions.filter((d) => !d.isDeductible).length > 0 && (
                <div>
                    <h4 className="text-label text-gigpay-text-secondary mb-2">
                        ❌ Non-Deductible ({deductions.filter((d) => !d.isDeductible).length})
                    </h4>
                    <div className="flex flex-col gap-2">
                        {deductions
                            .filter((d) => !d.isDeductible)
                            .map((d, i) => (
                                <div key={i} className="card py-3 flex items-center gap-3 opacity-60">
                                    <span className="text-xl">{categoryIcons[d.category] || '📋'}</span>
                                    <div className="flex-1">
                                        <p className="text-body-md font-semibold text-gigpay-navy">{d.label}</p>
                                        <p className="text-caption text-gigpay-text-muted">Personal expense</p>
                                    </div>
                                    <span className="text-body-md font-medium text-gigpay-text-secondary">
                                        {formatCurrency(d.amount)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Missed deduction tip */}
            <div className="card bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-2">
                    <span className="text-xl">💡</span>
                    <div>
                        <p className="text-body-md font-semibold text-yellow-800">Missed Deductions?</p>
                        <p className="text-caption text-yellow-700 mt-0.5">
                            Make sure to log vehicle depreciation and phone insurance premiums — these are commonly missed deductions for gig workers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeductionList;

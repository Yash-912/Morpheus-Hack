import { formatCurrency, formatPercent } from '../../utils/formatCurrency';
import {
    calculateTax,
    compareRegimes,
    getCurrentFY,
    PRESUMPTIVE_44AD,
} from '../../constants/taxRules';

/**
 * TaxSummary — Tax overview card for gig workers.
 *
 * @param {object} props
 * @param {number} props.totalIncome — Gross income in paise for current FY
 * @param {number} props.totalExpenses — Total expenses in paise
 * @param {number} props.totalDeductions — 80C + other deductions in paise (rupees internally)
 * @param {boolean} [props.isPresumptive] — Using Section 44AD
 */
const TaxSummary = ({
    totalIncome = 0,
    totalExpenses = 0,
    totalDeductions = 0,
    isPresumptive = true,
}) => {
    const fy = getCurrentFY();

    // Convert paise to rupees for tax calculation
    const grossRupees = Number(totalIncome) / 100;
    const expensesRupees = Number(totalExpenses) / 100;
    const deductionsRupees = Number(totalDeductions) / 100;

    // Presumptive: only 6% of digital income is taxable
    const taxableIncome = isPresumptive
        ? grossRupees * PRESUMPTIVE_44AD.digitalIncomeRate
        : grossRupees - expensesRupees;

    const comparison = compareRegimes(taxableIncome, deductionsRupees);

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-heading-md">Tax Summary</h3>
                <span className="badge badge-info">{fy}</span>
            </div>

            {/* Income overview */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-caption text-green-600">Gross Earnings</p>
                    <p className="text-body-md font-bold text-green-700">
                        {formatCurrency(totalIncome, { compact: true })}
                    </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                    <p className="text-caption text-red-600">Expenses</p>
                    <p className="text-body-md font-bold text-red-700">
                        {formatCurrency(totalExpenses, { compact: true })}
                    </p>
                </div>
            </div>

            {/* Presumptive taxation info */}
            {isPresumptive && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                    <p className="text-body-md font-semibold text-blue-700 mb-1">
                        📋 Section 44AD Applied
                    </p>
                    <p className="text-caption text-blue-600">
                        Only 6% of digital earnings (₹{taxableIncome.toLocaleString('en-IN')})
                        is treated as taxable profit
                    </p>
                </div>
            )}

            {/* Regime comparison */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border-[1.5px] ${comparison.recommended === 'new'
                        ? 'bg-[#C8F135]/10 border-[#C8F135]'
                        : 'bg-white border-gigpay-border'
                    }`}>
                    <div className="flex items-center gap-1 mb-1">
                        <p className="text-caption font-semibold text-gigpay-navy">New Regime</p>
                        {comparison.recommended === 'new' && <span className="text-caption">✅</span>}
                    </div>
                    <p className="text-heading-md text-gigpay-navy">
                        ₹{comparison.newRegime.totalTax.toLocaleString('en-IN')}
                    </p>
                </div>

                <div className={`p-3 rounded-xl border-[1.5px] ${comparison.recommended === 'old'
                        ? 'bg-[#C8F135]/10 border-[#C8F135]'
                        : 'bg-white border-gigpay-border'
                    }`}>
                    <div className="flex items-center gap-1 mb-1">
                        <p className="text-caption font-semibold text-gigpay-navy">Old Regime</p>
                        {comparison.recommended === 'old' && <span className="text-caption">✅</span>}
                    </div>
                    <p className="text-heading-md text-gigpay-navy">
                        ₹{comparison.oldRegime.totalTax.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Savings note */}
            {comparison.savings > 0 && (
                <p className="text-caption text-green-600 font-semibold mt-3 text-center">
                    💰 Save ₹{comparison.savings.toLocaleString('en-IN')} with {comparison.recommended} regime
                </p>
            )}
        </div>
    );
};

export default TaxSummary;

import { formatCurrency, formatPercent } from '../../utils/formatCurrency';

/**
 * EligibilityMeter — Visual GigScore-based loan eligibility display.
 *
 * @param {object} props
 * @param {number} props.gigScore — 0-1000 score
 * @param {number} props.maxLoanAmount — Max eligible amount in paise
 * @param {number} [props.interestRate] — 0-1 decimal
 * @param {boolean} [props.isEligible]
 */
const EligibilityMeter = ({
    gigScore = 0,
    maxLoanAmount = 0,
    interestRate = 0,
    isEligible = true,
}) => {
    const scorePercent = Math.min(100, (gigScore / 1000) * 100);
    const scoreColor = gigScore >= 700 ? '#22C55E' : gigScore >= 400 ? '#F59E0B' : '#EF4444';
    const scoreLabel = gigScore >= 700 ? 'Excellent' : gigScore >= 400 ? 'Good' : 'Building';

    return (
        <div className="card">
            <h3 className="text-heading-md mb-4">Loan Eligibility</h3>

            {/* GigScore gauge */}
            <div className="flex items-center gap-5 mb-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle
                            cx="18" cy="18" r="15.9155"
                            fill="none" stroke="#e5e7eb" strokeWidth="3"
                        />
                        <circle
                            cx="18" cy="18" r="15.9155"
                            fill="none" stroke={scoreColor} strokeWidth="3"
                            strokeDasharray={`${scorePercent} ${100 - scorePercent}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-heading-md font-bold text-gigpay-navy leading-none">
                            {gigScore}
                        </span>
                        <span className="text-caption text-gigpay-text-muted">/ 1000</span>
                    </div>
                </div>

                <div>
                    <p className="text-body-md font-semibold" style={{ color: scoreColor }}>
                        {scoreLabel}
                    </p>
                    <p className="text-caption text-gigpay-text-muted">GigScore</p>
                </div>
            </div>

            {/* Eligibility details */}
            {isEligible ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex justify-between mb-1">
                        <span className="text-body-md text-green-700">Max Amount</span>
                        <span className="text-body-md font-bold text-green-700">
                            {formatCurrency(maxLoanAmount)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-body-md text-green-700">Interest Rate</span>
                        <span className="text-body-md font-bold text-green-700">
                            {formatPercent(interestRate)}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-body-md text-red-700">
                        Currently not eligible. Earn more consistently to improve your GigScore.
                    </p>
                </div>
            )}
        </div>
    );
};

export default EligibilityMeter;

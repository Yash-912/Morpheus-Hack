import { formatCurrency } from '../../utils/formatCurrency';

/**
 * LoanCard — Displays a single active or past loan.
 *
 * @param {object} props
 * @param {object} props.loan — Loan object from API
 */
const LoanCard = ({ loan }) => {
    const statusConfig = {
        active: { label: 'Active', css: 'badge-success' },
        repaid: { label: 'Repaid', css: 'badge-info' },
        defaulted: { label: 'Defaulted', css: 'badge-danger' },
        pending: { label: 'Pending', css: 'badge-warning' },
    };

    const status = statusConfig[loan.status] || statusConfig.pending;
    const progress = loan.totalRepayable > 0
        ? Math.min(100, Math.round((Number(loan.amountRepaid || 0) / Number(loan.totalRepayable)) * 100))
        : 0;

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-3">
                <span className={`badge ${status.css}`}>{status.label}</span>
                <span className="text-caption text-gigpay-text-muted">
                    {loan.tenure} day{loan.tenure !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Amount */}
            <p className="text-heading-lg text-gigpay-navy">
                {formatCurrency(loan.totalRepayable)}
            </p>
            <p className="text-caption text-gigpay-text-muted mb-3">
                at {((Number(loan.interestRate) || 0) * 100).toFixed(1)}% interest
            </p>

            {/* Repayment progress */}
            {loan.status === 'active' && (
                <div className="mb-2">
                    <div className="flex justify-between text-caption mb-1">
                        <span className="text-gigpay-text-secondary">
                            Repaid: {formatCurrency(loan.amountRepaid || 0)}
                        </span>
                        <span className="font-semibold text-gigpay-navy">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Outstanding */}
            {loan.status === 'active' && (
                <div className="flex justify-between mt-3 pt-3 border-t border-gigpay-border/50">
                    <span className="text-body-md text-gigpay-text-secondary">Outstanding</span>
                    <span className="text-body-md font-bold text-red-600">
                        {formatCurrency(Number(loan.totalRepayable) - Number(loan.amountRepaid || 0))}
                    </span>
                </div>
            )}
        </div>
    );
};

export default LoanCard;

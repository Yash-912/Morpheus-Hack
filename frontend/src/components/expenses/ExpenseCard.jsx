import { formatCurrency } from '../../utils/formatCurrency';
import { timeAgo } from '../../utils/formatDate';

/**
 * ExpenseCard — Individual expense list item.
 *
 * @param {object} props
 * @param {object} props.expense — Expense from API
 * @param {Function} [props.onDelete]
 */
const ExpenseCard = ({ expense, onDelete }) => {
    const categoryIcons = {
        fuel: '⛽',
        toll: '🛣️',
        food: '🍕',
        mobile_recharge: '📱',
        maintenance: '🔧',
        parking: '🅿️',
        other: '📋',
    };

    const sourceLabels = {
        sms_auto: { label: 'SMS', bg: 'bg-purple-100 text-purple-700' },
        manual: { label: 'Manual', bg: 'bg-gray-100 text-gray-700' },
        ocr: { label: 'OCR', bg: 'bg-blue-100 text-blue-700' },
    };

    const icon = categoryIcons[expense.category] || '📋';
    const source = sourceLabels[expense.source] || sourceLabels.manual;

    return (
        <div className="card py-3 flex items-center gap-3">
            {/* Category icon */}
            <span className="text-2xl">{icon}</span>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-body-md font-semibold text-gigpay-navy truncate">
                        {expense.merchant || expense.category}
                    </p>
                    {/* Source badge */}
                    <span className={`text-caption font-semibold px-1.5 py-0.5 rounded-md ${source.bg}`}>
                        {source.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-caption text-gigpay-text-muted">
                    <span className="capitalize">{expense.category?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{timeAgo(expense.date || expense.createdAt)}</span>
                </div>
            </div>

            {/* Amount + deductible */}
            <div className="text-right flex-shrink-0">
                <p className="text-body-md font-bold text-gigpay-navy">
                    {formatCurrency(expense.amount)}
                </p>
                {expense.isTaxDeductible && (
                    <span className="text-caption text-green-600 font-semibold">
                        ✅ Deductible
                    </span>
                )}
            </div>
        </div>
    );
};

export default ExpenseCard;

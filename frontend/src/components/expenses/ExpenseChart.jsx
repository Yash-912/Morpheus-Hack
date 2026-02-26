import { formatCurrency, formatPercent } from '../../utils/formatCurrency';

/**
 * ExpenseChart — CSS-only donut chart showing expense category breakdown.
 *
 * @param {object} props
 * @param {Array<{category: string, label: string, amount: number}>} props.data — grouped by category
 * @param {number} props.total — total in paise
 */
const ExpenseChart = ({ data = [], total = 0 }) => {
    const categoryColors = {
        fuel: '#EF4444',
        toll: '#F59E0B',
        food: '#F97316',
        mobile_recharge: '#8B5CF6',
        maintenance: '#3B82F6',
        parking: '#06B6D4',
        other: '#6B7280',
    };

    const categoryIcons = {
        fuel: '⛽',
        toll: '🛣️',
        food: '🍕',
        mobile_recharge: '📱',
        maintenance: '🔧',
        parking: '🅿️',
        other: '📋',
    };

    if (data.length === 0 || total === 0) {
        return (
            <div className="card text-center py-8">
                <span className="text-4xl block mb-3">📊</span>
                <p className="text-body-md text-gigpay-text-secondary">No expense data yet</p>
            </div>
        );
    }

    const sorted = [...data].sort((a, b) => b.amount - a.amount);

    // Build conic gradient
    let cumulative = 0;
    const gradientParts = sorted.map((item) => {
        const pct = (item.amount / total) * 100;
        const color = categoryColors[item.category] || categoryColors.other;
        const start = cumulative;
        cumulative += pct;
        return `${color} ${start}% ${cumulative}%`;
    });
    const gradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="card">
            <h3 className="text-heading-md mb-4">Expense Breakdown</h3>

            <div className="flex items-center gap-6">
                {/* Donut chart */}
                <div
                    className="w-28 h-28 rounded-full flex-shrink-0 relative"
                    style={{ background: gradient }}
                >
                    <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                        <span className="text-heading-md font-bold text-gigpay-navy leading-tight">
                            {formatCurrency(total, { compact: true })}
                        </span>
                        <span className="text-caption text-gigpay-text-muted">Total</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-1.5 flex-1">
                    {sorted.map((item) => {
                        const pct = item.amount / total;
                        const color = categoryColors[item.category] || categoryColors.other;
                        const icon = categoryIcons[item.category] || '📋';

                        return (
                            <div key={item.category} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-caption flex-1 truncate">
                                    {icon} {item.label}
                                </span>
                                <span className="text-caption text-gigpay-text-muted">
                                    {formatPercent(pct, 0)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ExpenseChart;

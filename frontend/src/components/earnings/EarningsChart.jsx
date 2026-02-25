import { formatCurrency } from '../../utils/formatCurrency';
import { getPlatform } from '../../constants/platforms';

/**
 * EarningsChart — Lightweight bar chart for weekly/monthly trends.
 * Uses pure CSS bars (no Recharts dependency needed for basic view).
 *
 * @param {object} props
 * @param {Array<{label: string, amount: number}>} props.data — e.g., [{label: "Mon", amount: 85000}]
 * @param {string} [props.title]
 */
const EarningsChart = ({ data = [], title = 'This Week' }) => {
    const maxAmount = Math.max(...data.map((d) => d.amount), 1);

    return (
        <div className="card">
            <h3 className="text-heading-md mb-4">{title}</h3>

            <div className="flex items-end gap-2 h-32">
                {data.map((item, i) => {
                    const height = Math.max(4, (item.amount / maxAmount) * 100);
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-caption text-gigpay-text-muted font-mono">
                                {item.amount > 0 ? formatCurrency(item.amount, { compact: true }) : ''}
                            </span>
                            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                                <div
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-[#0D1B3E] to-[#2E4A8A] rounded-t-lg transition-all duration-500"
                                    style={{ height: `${height}%` }}
                                />
                            </div>
                            <span className="text-caption text-gigpay-text-secondary font-medium">
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EarningsChart;

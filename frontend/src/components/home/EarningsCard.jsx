import { getPlatform } from '../../constants/platforms';
import { formatCurrency } from '../../utils/formatCurrency';
import { cn } from '../ui/Skeletons';

/**
 * EarningsCard — Today's earnings across all platforms.
 * Shows total, per-platform breakdown, and comparison to 7-day avg.
 *
 * @param {object} props
 * @param {number} props.totalAmount — Today's total in paise
 * @param {number} props.tripCount — Total trips today
 * @param {object} props.byPlatform — { zomato: 45000, swiggy: 30000, ... } in paise
 * @param {number} [props.weeklyAvg] — 7-day average in paise
 * @param {boolean} [props.isLoading]
 */
const EarningsCard = ({
    totalAmount = 0,
    tripCount = 0,
    byPlatform = {},
    weeklyAvg = 0,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-28 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-32 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
        );
    }

    const platforms = Object.entries(byPlatform).filter(([, amt]) => amt > 0);
    const percentOfAvg = weeklyAvg > 0 ? Math.round((totalAmount / weeklyAvg) * 100) : 0;
    const isAboveAvg = percentOfAvg >= 100;

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <p className="text-label text-gigpay-text-secondary">Today's Earnings</p>
                <span className="text-caption text-gigpay-text-muted">{tripCount} trips</span>
            </div>

            {/* Total */}
            <p className="text-display-md text-gigpay-navy font-bold">
                {formatCurrency(totalAmount)}
            </p>

            {/* vs 7-day avg */}
            {weeklyAvg > 0 && (
                <div className="flex items-center gap-1.5 mt-1 mb-3">
                    <span className={cn(
                        'text-caption font-semibold',
                        isAboveAvg ? 'text-green-600' : 'text-orange-500'
                    )}>
                        {isAboveAvg ? '↑' : '↓'} {percentOfAvg}% of weekly avg
                    </span>
                </div>
            )}

            {/* Platform breakdown */}
            {platforms.length > 0 && (
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gigpay-border/50">
                    {platforms.map(([platformId, amount]) => {
                        const platform = getPlatform(platformId);
                        const pct = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
                        return (
                            <div key={platformId} className="flex items-center gap-2">
                                <span className="text-lg">{platform.icon}</span>
                                <span className="text-body-md font-medium flex-1">{platform.name}</span>
                                <span className="text-body-md font-bold">{formatCurrency(amount)}</span>
                                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${pct}%`, backgroundColor: platform.color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EarningsCard;

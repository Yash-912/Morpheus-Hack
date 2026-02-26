import { getPlatform } from '../../constants/platforms';
import { formatCurrency, formatPercent } from '../../utils/formatCurrency';

/**
 * PlatformBreakdown — Donut-style platform earnings split.
 * Pure CSS implementation — no Recharts dependency needed.
 *
 * @param {object} props
 * @param {object} props.byPlatform — { zomato: 45000, swiggy: 30000, ... } in paise
 * @param {number} props.total — Total earnings in paise
 */
const PlatformBreakdown = ({ byPlatform = {}, total = 0 }) => {
    const platforms = Object.entries(byPlatform)
        .filter(([, amt]) => amt > 0)
        .sort(([, a], [, b]) => b - a);

    if (platforms.length === 0) {
        return (
            <div className="card text-center py-6">
                <p className="text-body-md text-gigpay-text-secondary">No earnings data yet</p>
            </div>
        );
    }

    // Build conic-gradient segments
    let cumulativePercent = 0;
    const gradientParts = platforms.map(([platformId, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const platform = getPlatform(platformId);
        const start = cumulativePercent;
        cumulativePercent += pct;
        return `${platform.color} ${start}% ${cumulativePercent}%`;
    });
    const gradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="card">
            <h3 className="text-heading-md mb-4">Platform Split</h3>

            <div className="flex items-center gap-6">
                {/* Donut chart */}
                <div
                    className="w-24 h-24 rounded-full flex-shrink-0 relative"
                    style={{ background: gradient }}
                >
                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                        <span className="text-caption font-bold text-gigpay-navy">
                            {platforms.length}
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2 flex-1">
                    {platforms.map(([platformId, amount]) => {
                        const platform = getPlatform(platformId);
                        const pct = total > 0 ? amount / total : 0;
                        return (
                            <div key={platformId} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: platform.color }}
                                />
                                <span className="text-body-md flex-1">{platform.name}</span>
                                <span className="text-caption text-gigpay-text-muted">
                                    {formatPercent(pct)}
                                </span>
                                <span className="text-body-md font-bold">
                                    {formatCurrency(amount, { compact: true })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlatformBreakdown;

import { formatCurrency } from '../../utils/formatCurrency';

/**
 * ForecastBanner — AI earnings prediction card.
 * Shows predicted range, confidence level, and influencing factors.
 *
 * @param {object} props
 * @param {number} props.minAmount — Lower bound prediction in paise
 * @param {number} props.maxAmount — Upper bound prediction in paise
 * @param {number} [props.confidence] — Confidence 0-1
 * @param {Array<string>} [props.factors] — Influencing factors, e.g. ["☀️ Clear weather", "📅 Saturday"]
 * @param {boolean} [props.isLoading]
 */
const ForecastBanner = ({
    minAmount = 0,
    maxAmount = 0,
    confidence = 0,
    factors = [],
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="card bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] animate-pulse">
                <div className="h-4 bg-blue-100 rounded w-28 mb-3" />
                <div className="h-8 bg-blue-100 rounded w-48 mb-2" />
                <div className="h-4 bg-blue-100 rounded w-full" />
            </div>
        );
    }

    const confidencePercent = Math.round(confidence * 100);
    const confidenceLabel = confidencePercent >= 80 ? 'High' : confidencePercent >= 50 ? 'Medium' : 'Low';
    const confidenceColor = confidencePercent >= 80 ? 'text-green-600' : confidencePercent >= 50 ? 'text-yellow-600' : 'text-orange-600';

    return (
        <div className="card bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] border-blue-200 shadow-[4px_4px_0px_#BFDBFE]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <p className="text-label text-blue-700">Tomorrow's Forecast</p>
                </div>
                <span className={`text-caption font-semibold ${confidenceColor}`}>
                    {confidenceLabel} confidence
                </span>
            </div>

            {/* Prediction range */}
            <p className="text-heading-lg text-gigpay-navy">
                {formatCurrency(minAmount)} – {formatCurrency(maxAmount)}
            </p>

            {/* Confidence bar */}
            <div className="w-full h-2 bg-blue-100 rounded-full mt-2 mb-3 overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${confidencePercent}%` }}
                />
            </div>

            {/* Factor chips */}
            {factors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {factors.map((factor, i) => (
                        <span
                            key={i}
                            className="text-caption bg-white/70 border border-blue-200 rounded-full px-2.5 py-1"
                        >
                            {factor}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ForecastBanner;

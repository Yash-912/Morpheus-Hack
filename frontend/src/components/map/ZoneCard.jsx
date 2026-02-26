/**
 * ZoneCard — Individual zone info card.
 *
 * @param {object} props
 * @param {string} props.name — Zone name
 * @param {number} props.demandScore — 0-10 score
 * @param {number} [props.estimatedWait] — Minutes
 * @param {number} [props.distanceKm] — From user
 * @param {Function} [props.onClick]
 */
const ZoneCard = ({ name, demandScore = 0, estimatedWait, distanceKm, onClick }) => {
    const demandColor = demandScore >= 8
        ? 'text-red-600 bg-red-50 border-red-200'
        : demandScore >= 5
            ? 'text-orange-600 bg-orange-50 border-orange-200'
            : 'text-green-600 bg-green-50 border-green-200';

    const demandLabel = demandScore >= 8 ? '🔥 Very High' : demandScore >= 5 ? '⚡ High' : '✅ Normal';

    return (
        <button
            onClick={onClick}
            className="card w-full text-left flex items-center gap-3 transition-all active:scale-[0.98] duration-75"
        >
            {/* Demand score badge */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-[1.5px] font-bold text-lg ${demandColor}`}>
                {demandScore}
            </div>

            {/* Info */}
            <div className="flex-1">
                <p className="text-body-md font-bold text-gigpay-navy">{name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-caption text-gigpay-text-muted">{demandLabel}</span>
                    {estimatedWait != null && (
                        <span className="text-caption text-gigpay-text-muted">• ~{estimatedWait} min wait</span>
                    )}
                </div>
            </div>

            {/* Distance */}
            {distanceKm != null && (
                <div className="text-right">
                    <p className="text-body-md font-semibold">{distanceKm.toFixed(1)} km</p>
                    <p className="text-caption text-gigpay-text-muted">away</p>
                </div>
            )}
        </button>
    );
};

export default ZoneCard;

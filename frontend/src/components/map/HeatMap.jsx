/**
 * HeatMap — Placeholder for Google Maps heatmap.
 * Renders a static visualization when Google Maps API key is unavailable.
 * Replace with @vis.gl/react-google-maps when API key is configured.
 *
 * @param {object} props
 * @param {Array} [props.zones] — Array of { lat, lng, weight, name }
 * @param {object} [props.userLocation] — { lat, lng }
 * @param {Function} [props.onZoneClick] — Callback when zone is tapped
 * @param {string} [props.className]
 */
const HeatMap = ({
    zones = [],
    userLocation = null,
    onZoneClick,
    className = '',
}) => {
    return (
        <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border-[1.5px] border-gigpay-border overflow-hidden ${className}`}
            style={{ minHeight: '300px' }}
        >
            {/* Map placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <span className="text-5xl block mb-3">🗺️</span>
                    <p className="text-body-md text-gigpay-text-secondary">
                        Demand Heatmap
                    </p>
                    <p className="text-caption text-gigpay-text-muted mt-1">
                        {zones.length > 0
                            ? `${zones.length} hot zones detected`
                            : 'Scanning for hot zones...'}
                    </p>
                </div>
            </div>

            {/* Zone dots overlay */}
            {zones.length > 0 && (
                <div className="absolute inset-0 p-4">
                    {zones.slice(0, 8).map((zone, i) => {
                        // Distribute zones around the card area for visual demo
                        const angle = (i / Math.min(zones.length, 8)) * Math.PI * 2;
                        const radius = 25 + Math.random() * 15;
                        const x = 50 + Math.cos(angle) * radius;
                        const y = 50 + Math.sin(angle) * radius;
                        const size = 20 + (zone.weight || 0.5) * 30;
                        const opacity = 0.3 + (zone.weight || 0.5) * 0.5;

                        return (
                            <button
                                key={i}
                                onClick={() => onZoneClick?.(zone)}
                                className="absolute rounded-full animate-pulse"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    background: `radial-gradient(circle, rgba(239, 68, 68, ${opacity}) 0%, transparent 70%)`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                title={zone.name}
                            />
                        );
                    })}
                </div>
            )}

            {/* User location dot */}
            {userLocation && (
                <div
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg z-10"
                    style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                >
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-50" />
                </div>
            )}
        </div>
    );
};

export default HeatMap;

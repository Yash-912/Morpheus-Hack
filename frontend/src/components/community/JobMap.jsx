/**
 * JobMap — Placeholder map for community job locations.
 * Shows job markers and user location.
 * Replace with Google Maps API integration when API key is available.
 *
 * @param {object} props
 * @param {Array} props.jobs — Array of job objects with lat/lng
 * @param {{lat: number, lng: number}} [props.userLocation]
 * @param {Function} [props.onJobClick] — Called with job when marker is tapped
 */
const JobMap = ({ jobs = [], userLocation, onJobClick }) => {
    const typeColors = {
        delivery: '#3B82F6',
        shifting: '#8B5CF6',
        repair: '#F59E0B',
        errand: '#22C55E',
        other: '#6B7280',
    };

    return (
        <div className="relative w-full h-[300px] bg-gradient-to-br from-[#E8F4F8] to-[#F0F7EB] border-[1.5px] border-gigpay-border rounded-2xl overflow-hidden">
            {/* Grid pattern background */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
            linear-gradient(#0D1B3E 1px, transparent 1px),
            linear-gradient(90deg, #0D1B3E 1px, transparent 1px)
          `,
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Simulated road lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300" />
            <div
                className="absolute top-0 bottom-0 w-px bg-gray-300/50"
                style={{ left: '30%' }}
            />
            <div
                className="absolute left-0 right-0 h-px bg-gray-300/50"
                style={{ top: '35%' }}
            />

            {/* User location */}
            {userLocation && (
                <div
                    className="absolute z-20"
                    style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                >
                    <div className="relative">
                        <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg z-10 relative" />
                        <div className="absolute inset-[-6px] bg-blue-400/30 rounded-full animate-ping" />
                    </div>
                </div>
            )}

            {/* Job markers */}
            {jobs.map((job, i) => {
                const color = typeColors[job.type] || typeColors.other;
                // Distribute markers around the map
                const angle = (i / jobs.length) * Math.PI * 2;
                const radius = 25 + Math.random() * 15;
                const left = 50 + Math.cos(angle) * radius;
                const top = 50 + Math.sin(angle) * radius;

                return (
                    <button
                        key={job.id}
                        onClick={() => onJobClick?.(job)}
                        className="absolute z-10 group"
                        style={{
                            left: `${Math.min(85, Math.max(15, left))}%`,
                            top: `${Math.min(85, Math.max(15, top))}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold transition-transform group-active:scale-110"
                            style={{ backgroundColor: color }}
                        >
                            ₹
                        </div>
                        {/* Tooltip on hover focus */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gigpay-navy text-white text-caption rounded-lg whitespace-nowrap opacity-0 group-focus:opacity-100 transition-opacity pointer-events-none">
                            {job.title?.slice(0, 20)}...
                        </div>
                    </button>
                );
            })}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                {Object.entries(typeColors).slice(0, 4).map(([type, color]) => (
                    <div
                        key={type}
                        className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-200"
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-caption capitalize">{type}</span>
                    </div>
                ))}
            </div>

            {/* "Placeholder" badge */}
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200">
                <p className="text-caption font-semibold text-gigpay-text-muted">
                    🗺️ Map Preview
                </p>
            </div>
        </div>
    );
};

export default JobMap;

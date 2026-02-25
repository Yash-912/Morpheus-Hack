import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * HotZonePreview — Small map preview widget on home dashboard.
 * Shows nearest hot zone info. Links to full /zones page.
 *
 * @param {object} props
 * @param {object} [props.nearestZone] — { name, demandScore, distanceKm }
 * @param {boolean} [props.isLoading]
 */
const HotZonePreview = ({ nearestZone, isLoading = false }) => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="card bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] animate-pulse">
                <div className="h-4 bg-orange-100 rounded w-24 mb-3" />
                <div className="h-6 bg-orange-100 rounded w-40 mb-2" />
                <div className="h-4 bg-orange-100 rounded w-full" />
            </div>
        );
    }

    return (
        <button
            onClick={() => navigate('/zones')}
            className="card bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] border-orange-200 shadow-[4px_4px_0px_#FDE68A] w-full text-left transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] duration-75"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <p className="text-label text-orange-700">Hot Zones</p>
                </div>
                <ArrowRight size={16} className="text-orange-400" />
            </div>

            {nearestZone ? (
                <div>
                    <p className="text-heading-md text-gigpay-navy">{nearestZone.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-caption text-orange-600 font-semibold">
                            Demand: {nearestZone.demandScore}/10
                        </span>
                        <span className="text-caption text-gigpay-text-muted">
                            {nearestZone.distanceKm?.toFixed(1)} km away
                        </span>
                    </div>
                </div>
            ) : (
                <p className="text-body-md text-orange-700/70">
                    Tap to view demand heatmap near you
                </p>
            )}
        </button>
    );
};

export default HotZonePreview;

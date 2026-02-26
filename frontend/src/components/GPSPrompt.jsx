import { MapPin, X, ShieldCheck } from 'lucide-react';
import { useGPSContext } from '../context/GPSContext';

/**
 * GPSPrompt — one-time modal shown after login asking the worker
 * to enable location tracking. Shows only once, then saves to localStorage.
 */
export default function GPSPrompt() {
    const { showPrompt, enableTracking, dismissPrompt } = useGPSContext();

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in">
            <div className="w-full max-w-[420px] bg-white rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-gigpay-navy shadow-brutal p-6 pb-8 animate-slide-up">
                {/* Close */}
                <button
                    onClick={dismissPrompt}
                    className="absolute top-4 right-4 text-gigpay-text-muted hover:text-gigpay-navy p-1"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin size={32} className="text-blue-600" />
                </div>

                {/* Title */}
                <h2 className="font-syne font-bold text-xl text-gigpay-navy text-center mb-2">
                    Enable Live Location
                </h2>

                {/* Description */}
                <p className="text-sm text-gigpay-text-secondary text-center leading-relaxed mb-5">
                    GigPay uses your location <strong>only while you are working</strong> to
                    show nearby high-demand zones and optimize your earnings.
                    We never track you in the background.
                </p>

                {/* Privacy note */}
                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-3 mb-6">
                    <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-emerald-700">
                        You can turn this off anytime from <strong>Profile → Settings</strong>
                    </p>
                </div>

                {/* Buttons */}
                <button
                    onClick={enableTracking}
                    className="w-full py-4 rounded-xl bg-gigpay-navy text-white font-bold text-base border-[1.5px] border-gigpay-navy shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all mb-3"
                >
                    Enable Location
                </button>

                <button
                    onClick={dismissPrompt}
                    className="w-full py-3 rounded-xl text-gigpay-text-secondary font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                    Not now
                </button>
            </div>
        </div>
    );
}

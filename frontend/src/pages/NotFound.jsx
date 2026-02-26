import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

/**
 * NotFound — 404 page with illustration and navigation home.
 */
const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fade-in">
            {/* Illustration */}
            <div className="relative mb-6">
                <div className="text-[120px] leading-none font-bold text-gigpay-navy/10">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">🗺️</span>
                </div>
            </div>

            {/* Text */}
            <h1 className="text-heading-lg text-gigpay-navy mb-2">
                Lost on the road?
            </h1>
            <p className="text-body-md text-gigpay-text-secondary mb-6 max-w-xs">
                This page doesn't exist. Even the best navigators take wrong turns sometimes.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={() => navigate(ROUTES.HOME)}
                    className="btn-primary w-full"
                >
                    🏠 Go Home
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="btn-secondary w-full"
                >
                    ← Go Back
                </button>
            </div>

            {/* Fun stats */}
            <div className="mt-8 p-4 bg-gigpay-surface rounded-2xl border border-gigpay-border max-w-xs w-full">
                <p className="text-caption text-gigpay-text-muted">
                    💡 Did you know? India has 15M+ gig workers, and GigPay helps them earn,
                    save, and grow — one cashout at a time.
                </p>
            </div>
        </div>
    );
};

export default NotFound;

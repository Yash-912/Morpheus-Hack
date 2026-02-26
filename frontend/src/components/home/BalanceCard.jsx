import { useNavigate } from 'react-router-dom';
import CurrencyDisplay from '../shared/CurrencyDisplay';
import { cn } from '../ui/Skeletons';

/**
 * BalanceCard — Large wallet balance display on home dashboard.
 * Shows balance, locked amount, lifetime stats, and Cash Out CTA.
 *
 * @param {object} props
 * @param {number} props.balance — Wallet balance in paise
 * @param {number} [props.lockedBalance] — Locked (in escrow/processing) in paise
 * @param {number} [props.lifetimeEarned] — Total lifetime earned in paise
 * @param {number} [props.lifetimeWithdrawn] — Total lifetime withdrawn in paise
 * @param {boolean} [props.isLoading]
 */
const BalanceCard = ({
    balance = 0,
    lockedBalance = 0,
    lifetimeEarned = 0,
    lifetimeWithdrawn = 0,
    isLoading = false,
}) => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="card bg-gradient-to-br from-[#0D1B3E] to-[#1A2D5A] text-white animate-pulse">
                <div className="h-4 bg-white/20 rounded w-24 mb-3" />
                <div className="h-10 bg-white/20 rounded w-40 mb-4" />
                <div className="h-12 bg-white/10 rounded w-full" />
            </div>
        );
    }

    return (
        <div className="card bg-gradient-to-br from-[#0D1B3E] to-[#1A2D5A] text-white border-[#2E4A8A] shadow-[4px_4px_0px_#1A2D5A]">
            {/* Label */}
            <p className="text-label text-white/60 mb-1">Available Balance</p>

            {/* Big balance */}
            <div className="text-display-md text-white font-bold mb-1">
                <CurrencyDisplay amount={balance} size="xl" className="text-white" />
            </div>

            {/* Locked balance */}
            {lockedBalance > 0 && (
                <p className="text-caption text-white/50 mb-4">
                    🔒 <CurrencyDisplay amount={lockedBalance} size="sm" className="text-white/50" /> locked
                </p>
            )}

            {/* Cash Out CTA */}
            <button
                onClick={() => navigate('/cashout')}
                className="w-full mt-3 bg-[#C8F135] text-[#0D1B3E] font-bold py-3.5 rounded-xl border-2 border-[#0D1B3E] shadow-[3px_3px_0px_rgba(200,241,53,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-75 text-base"
            >
                💸 Cash Out Now
            </button>

            {/* Lifetime stats row */}
            {(lifetimeEarned > 0 || lifetimeWithdrawn > 0) && (
                <div className="flex justify-between mt-4 pt-3 border-t border-white/10">
                    <div>
                        <p className="text-caption text-white/40">Lifetime Earned</p>
                        <CurrencyDisplay amount={lifetimeEarned} size="sm" compact className="text-white/70" />
                    </div>
                    <div className="text-right">
                        <p className="text-caption text-white/40">Total Withdrawn</p>
                        <CurrencyDisplay amount={lifetimeWithdrawn} size="sm" compact className="text-white/70" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceCard;

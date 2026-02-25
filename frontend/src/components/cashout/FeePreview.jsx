import { formatCurrency } from '../../utils/formatCurrency';

/**
 * FeePreview — Live fee breakdown for cashout.
 * Updates in real-time as the user adjusts the amount slider.
 *
 * @param {object} props
 * @param {number} props.amount — Withdrawal amount in paise
 * @param {'instant'|'same_day'|'scheduled'} [props.type] — Payout type
 * @param {boolean} [props.isGigPro] — GigPro subscriber (reduced fee)
 */
const FeePreview = ({ amount = 0, type = 'instant', isGigPro = false }) => {
    // Fee rates
    const feeRates = {
        instant: isGigPro ? 0.012 : 0.015,    // 1.2% GigPro, 1.5% free
        same_day: isGigPro ? 0.008 : 0.01,     // 0.8% GigPro, 1.0% free
        scheduled: 0,                            // Free for scheduled
    };

    const feeRate = feeRates[type] || feeRates.instant;
    const fee = Math.round(amount * feeRate);
    const netAmount = amount - fee;

    const typeLabels = {
        instant: '⚡ Instant (< 1 min)',
        same_day: '📅 Same Day (by 6 PM)',
        scheduled: '🕐 Scheduled (next day)',
    };

    return (
        <div className="card bg-gigpay-surface border-dashed">
            {/* Type label */}
            <p className="text-label text-gigpay-text-secondary mb-3">
                {typeLabels[type]}
            </p>

            {/* Breakdown rows */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="text-body-md text-gigpay-text-secondary">Amount</span>
                    <span className="text-body-md font-medium">{formatCurrency(amount)}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-body-md text-gigpay-text-secondary">
                        Fee ({(feeRate * 100).toFixed(1)}%)
                        {isGigPro && (
                            <span className="ml-1 text-caption bg-[#C8F135] text-gigpay-navy px-1.5 py-0.5 rounded-full font-bold">
                                PRO
                            </span>
                        )}
                    </span>
                    <span className="text-body-md font-medium text-red-500">
                        {fee > 0 ? `- ${formatCurrency(fee)}` : 'FREE'}
                    </span>
                </div>

                <div className="border-t border-gigpay-border my-1" />

                <div className="flex justify-between">
                    <span className="text-body-md font-bold text-gigpay-navy">You'll receive</span>
                    <span className="text-heading-md font-bold text-green-600">
                        {formatCurrency(netAmount)}
                    </span>
                </div>
            </div>

            {/* GigPro upsell */}
            {!isGigPro && fee > 0 && (
                <div className="mt-3 p-2.5 bg-[#C8F135]/10 border border-[#C8F135]/30 rounded-xl">
                    <p className="text-caption text-gigpay-navy">
                        💡 <strong>GigPro members</strong> save {formatCurrency(Math.round(amount * 0.003))} on this withdrawal
                    </p>
                </div>
            )}
        </div>
    );
};

export default FeePreview;

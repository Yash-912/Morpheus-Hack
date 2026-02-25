import { useState } from 'react';
import { formatCurrency, paiseToRupees } from '../../utils/formatCurrency';

/**
 * AmountSlider — Cashout amount selector with slider and quick buttons.
 *
 * @param {object} props
 * @param {number} props.maxAmount — Max withdrawable in paise
 * @param {number} props.value — Current selected amount in paise
 * @param {Function} props.onChange — Called with new amount in paise
 * @param {number} [props.minAmount] — Minimum withdrawal in paise (default ₹10 = 1000)
 */
const AmountSlider = ({ maxAmount, value, onChange, minAmount = 1000 }) => {
    const maxRupees = paiseToRupees(maxAmount);
    const minRupees = paiseToRupees(minAmount);
    const currentRupees = paiseToRupees(value);

    const quickAmounts = [10000, 50000, 100000]; // ₹100, ₹500, ₹1000

    const handleSliderChange = (e) => {
        const rupees = parseFloat(e.target.value);
        onChange(Math.round(rupees * 100));
    };

    const handleQuickSelect = (paise) => {
        const clamped = Math.min(paise, maxAmount);
        onChange(clamped);
    };

    return (
        <div className="card">
            <p className="text-label text-gigpay-text-secondary mb-2">Withdrawal Amount</p>

            {/* Big amount display */}
            <div className="text-center mb-4">
                <span className="text-display-lg text-gigpay-navy">
                    {formatCurrency(value)}
                </span>
            </div>

            {/* Slider */}
            <div className="relative mb-4">
                <input
                    type="range"
                    min={minRupees}
                    max={maxRupees}
                    step={1}
                    value={currentRupees}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #C8F135 0%, #C8F135 ${((currentRupees - minRupees) / (maxRupees - minRupees)) * 100
                            }%, #e5e7eb ${((currentRupees - minRupees) / (maxRupees - minRupees)) * 100
                            }%, #e5e7eb 100%)`,
                    }}
                />
                <div className="flex justify-between mt-1">
                    <span className="text-caption text-gigpay-text-muted">₹{minRupees}</span>
                    <span className="text-caption text-gigpay-text-muted">₹{maxRupees}</span>
                </div>
            </div>

            {/* Quick select buttons */}
            <div className="flex gap-2">
                {quickAmounts
                    .filter((amt) => amt <= maxAmount)
                    .map((amt) => (
                        <button
                            key={amt}
                            onClick={() => handleQuickSelect(amt)}
                            className={`flex-1 py-2.5 rounded-xl border-[1.5px] text-body-md font-semibold transition-all duration-75 ${value === amt
                                    ? 'bg-[#C8F135]/20 border-gigpay-navy shadow-[2px_2px_0px_#0D1B3E]'
                                    : 'bg-white border-gigpay-border active:scale-[0.97]'
                                }`}
                        >
                            {formatCurrency(amt)}
                        </button>
                    ))}
                <button
                    onClick={() => handleQuickSelect(maxAmount)}
                    className={`flex-1 py-2.5 rounded-xl border-[1.5px] text-body-md font-semibold transition-all duration-75 ${value === maxAmount
                            ? 'bg-[#C8F135]/20 border-gigpay-navy shadow-[2px_2px_0px_#0D1B3E]'
                            : 'bg-white border-gigpay-border active:scale-[0.97]'
                        }`}
                >
                    Max
                </button>
            </div>
        </div>
    );
};

export default AmountSlider;

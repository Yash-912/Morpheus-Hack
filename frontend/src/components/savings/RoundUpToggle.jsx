import { useState } from 'react';

/**
 * RoundUpToggle — Toggle automatic round-up savings.
 * Every cashout is rounded up to nearest ₹10 and the difference is saved.
 *
 * @param {object} props
 * @param {boolean} props.enabled — Current toggle state
 * @param {Function} props.onToggle — Called with new boolean state
 * @param {boolean} [props.isLoading]
 */
const RoundUpToggle = ({ enabled = false, onToggle, isLoading = false }) => {
    const [showExample, setShowExample] = useState(false);

    return (
        <div className="card">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                        <h4 className="text-body-md font-bold text-gigpay-navy">Round-Up Savings</h4>
                        <p className="text-caption text-gigpay-text-muted">
                            Auto-save change from every cashout
                        </p>
                    </div>
                </div>

                {/* Toggle switch */}
                <button
                    onClick={() => onToggle?.(!enabled)}
                    disabled={isLoading}
                    className={`relative w-14 h-8 rounded-full border-2 transition-all duration-200 ${enabled
                            ? 'bg-[#C8F135] border-gigpay-navy'
                            : 'bg-gray-200 border-gray-300'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <div
                        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white border-[1.5px] shadow-sm transition-all duration-200 ${enabled
                                ? 'left-[26px] border-gigpay-navy'
                                : 'left-0.5 border-gray-300'
                            }`}
                    />
                </button>
            </div>

            {/* Description */}
            <p className="text-body-md text-gigpay-text-secondary mb-3">
                When enabled, every cashout amount is rounded up to the nearest ₹10.
                The difference is automatically deposited into your savings goal.
            </p>

            {/* Example toggle */}
            <button
                onClick={() => setShowExample(!showExample)}
                className="text-caption font-semibold text-gigpay-navy"
            >
                {showExample ? 'Hide example ↑' : 'See how it works ↓'}
            </button>

            {showExample && (
                <div className="mt-3 p-3 bg-gigpay-surface rounded-xl border border-gigpay-border animate-fade-in">
                    <div className="flex flex-col gap-2 text-body-md">
                        <div className="flex justify-between">
                            <span className="text-gigpay-text-secondary">You cashout</span>
                            <span className="font-semibold">₹847</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gigpay-text-secondary">Rounded to</span>
                            <span className="font-semibold">₹850</span>
                        </div>
                        <div className="border-t border-gigpay-border my-1" />
                        <div className="flex justify-between">
                            <span className="text-green-600 font-semibold">Auto-saved</span>
                            <span className="text-green-600 font-bold">₹3</span>
                        </div>
                    </div>
                    <p className="text-caption text-gigpay-text-muted mt-2">
                        💡 At ~15 cashouts/month, that's ~₹40–₹80 saved effortlessly!
                    </p>
                </div>
            )}
        </div>
    );
};

export default RoundUpToggle;

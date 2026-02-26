/**
 * SMSPermission — Banner requesting SMS read permission for auto expense tracking.
 *
 * @param {object} props
 * @param {Function} props.onAllow — Called when user grants permission
 * @param {Function} [props.onDismiss] — Called when user dismisses
 * @param {boolean} [props.isLoading]
 */
const SMSPermission = ({ onAllow, onDismiss, isLoading = false }) => {
    return (
        <div className="card bg-gradient-to-r from-[#EFF6FF] to-[#F5F3FF] border-blue-200 shadow-[4px_4px_0px_#BFDBFE]">
            {/* Illustration */}
            <div className="text-center mb-3">
                <span className="text-5xl block mb-2">📱</span>
                <h3 className="text-heading-md text-gigpay-navy">Auto-Track Expenses</h3>
            </div>

            {/* Description */}
            <p className="text-body-md text-gigpay-text-secondary text-center mb-3">
                Allow GigPay to read your SMS messages and automatically detect fuel, toll,
                and other work-related expenses for tax deductions.
            </p>

            {/* Privacy note */}
            <div className="p-2.5 bg-white/70 rounded-xl border border-blue-100 mb-4">
                <div className="flex items-start gap-2">
                    <span className="text-lg">🔒</span>
                    <div>
                        <p className="text-caption font-semibold text-gigpay-navy">Privacy First</p>
                        <p className="text-caption text-gigpay-text-muted">
                            We only read transaction SMS (bank alerts). Personal messages are
                            never accessed or stored. All processing happens on your device.
                        </p>
                    </div>
                </div>
            </div>

            {/* What we detect */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { icon: '⛽', label: 'Fuel' },
                    { icon: '🛣️', label: 'Tolls' },
                    { icon: '📱', label: 'Recharge' },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg border border-blue-100"
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-caption font-medium text-gigpay-navy">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={onAllow}
                    disabled={isLoading}
                    className="btn-primary w-full"
                >
                    {isLoading ? 'Setting up...' : '📲 Allow SMS Access'}
                </button>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="btn-ghost text-center w-full"
                    >
                        I'll add expenses manually
                    </button>
                )}
            </div>
        </div>
    );
};

export default SMSPermission;

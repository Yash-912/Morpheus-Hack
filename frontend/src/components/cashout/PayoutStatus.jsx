import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * PayoutStatus — Real-time payout progress tracker.
 * Listens for socket events and shows step-by-step progress.
 *
 * @param {object} props
 * @param {'pending'|'processing'|'completed'|'failed'} props.status
 * @param {number} [props.amount] — Payout amount in paise
 * @param {string} [props.upiId] — Target UPI ID
 * @param {string} [props.failureReason]
 * @param {Function} [props.onDone] — Called when completed or failed
 */
const PayoutStatus = ({
    status = 'pending',
    amount = 0,
    upiId = '',
    failureReason,
    onDone,
}) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (status === 'completed') {
            setShowConfetti(true);
            const timer = setTimeout(() => {
                setShowConfetti(false);
                onDone?.();
            }, 3000);
            return () => clearTimeout(timer);
        }
        if (status === 'failed') {
            onDone?.();
        }
    }, [status, onDone]);

    const steps = [
        { key: 'pending', label: 'Initiated', icon: '📝' },
        { key: 'processing', label: 'Processing', icon: '🏦' },
        { key: 'completed', label: 'Completed', icon: '✅' },
    ];

    const currentIndex = steps.findIndex((s) => s.key === status);
    const isFailed = status === 'failed';

    return (
        <div className="card text-center relative overflow-hidden">
            {/* Confetti overlay */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10px',
                                backgroundColor: ['#C8F135', '#0D1B3E', '#22C55E', '#F59E0B', '#3B82F6'][i % 5],
                                animation: `confettiFall ${1 + Math.random() * 2}s ease-out forwards`,
                                animationDelay: `${Math.random() * 0.5}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Amount */}
            <p className="text-display-md text-gigpay-navy mb-1">
                {formatCurrency(amount)}
            </p>
            {upiId && (
                <p className="text-caption text-gigpay-text-muted mb-6">
                    → {upiId}
                </p>
            )}

            {/* Progress steps */}
            {!isFailed ? (
                <div className="flex items-center justify-center gap-2 mb-6">
                    {steps.map((step, i) => {
                        const isActive = i <= currentIndex;
                        const isCurrent = i === currentIndex;
                        return (
                            <div key={step.key} className="flex items-center gap-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive
                                            ? 'border-[#C8F135] bg-[#C8F135]/20'
                                            : 'border-gray-200 bg-gray-50'
                                        } ${isCurrent ? 'scale-110 shadow-md' : ''}`}
                                >
                                    {isCurrent && i < steps.length - 1 ? (
                                        <div className="w-4 h-4 border-2 border-gigpay-navy border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-lg">{step.icon}</span>
                                    )}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`h-0.5 w-8 rounded ${isActive ? 'bg-[#C8F135]' : 'bg-gray-200'} transition-colors duration-500`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-5xl mb-4">❌</div>
            )}

            {/* Status message */}
            <p className={`text-body-md font-semibold ${isFailed ? 'text-red-600' : 'text-gigpay-navy'}`}>
                {isFailed
                    ? 'Payout Failed'
                    : status === 'completed'
                        ? '🎉 Money sent successfully!'
                        : status === 'processing'
                            ? 'Sending to your bank...'
                            : 'Queued for processing...'}
            </p>

            {/* Failure reason */}
            {isFailed && failureReason && (
                <p className="text-caption text-red-500 mt-2">{failureReason}</p>
            )}

            <style>{`
        @keyframes confettiFall {
          from { transform: translateY(0) rotate(0deg); opacity: 1; }
          to { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
      `}</style>
        </div>
    );
};

export default PayoutStatus;

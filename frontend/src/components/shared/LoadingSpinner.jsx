import { cn } from '../ui/Skeletons';

/**
 * LoadingSpinner — Animated spinner with optional message.
 * Uses the GigPay lime/navy color scheme.
 */
const LoadingSpinner = ({ size = 'md', message, className }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-[3px]',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <div
                className={cn(
                    'rounded-full animate-spin',
                    'border-gigpay-border border-t-[#C8F135]',
                    sizeClasses[size] || sizeClasses.md
                )}
            />
            {message && (
                <p className="text-body-md text-gigpay-text-secondary animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
};

/**
 * FullPageLoader — Centered spinner for page-level loading states.
 */
export const FullPageLoader = ({ message = 'Loading...' }) => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message={message} />
    </div>
);

export default LoadingSpinner;

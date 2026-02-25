import { formatCurrency, formatAmount } from '../../utils/formatCurrency';
import { cn } from '../ui/Skeletons';

/**
 * CurrencyDisplay — Renders a paise value as formatted ₹ amount.
 * Handles color coding for positive/negative, compact mode, etc.
 *
 * @param {object} props
 * @param {number|string} props.amount — Amount in paise
 * @param {boolean} [props.showSign] — Show +/- sign
 * @param {boolean} [props.compact] — Use compact notation (₹1.2K)
 * @param {boolean} [props.colorCode] — Green for positive, red for negative
 * @param {'sm'|'md'|'lg'|'xl'} [props.size] — Text size
 * @param {string} [props.className]
 */
const CurrencyDisplay = ({
    amount,
    showSign = false,
    compact = false,
    colorCode = false,
    size = 'md',
    className,
}) => {
    const numAmount = Number(amount);
    const formatted = formatCurrency(amount, { showSign, compact });

    const sizeClasses = {
        sm: 'text-body-md',
        md: 'text-heading-md',
        lg: 'text-heading-lg',
        xl: 'text-display-md',
    };

    const colorClasses = colorCode
        ? numAmount > 0
            ? 'text-green-600'
            : numAmount < 0
                ? 'text-red-600'
                : 'text-gigpay-text-primary'
        : '';

    return (
        <span
            className={cn(
                'font-mono font-semibold tabular-nums',
                sizeClasses[size],
                colorClasses,
                className
            )}
        >
            {formatted}
        </span>
    );
};

export default CurrencyDisplay;

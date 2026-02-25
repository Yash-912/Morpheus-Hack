import { cn } from '../ui/Skeletons';

/**
 * EmptyState — Placeholder for empty lists/sections.
 * Shows an emoji illustration, title, description, and optional CTA.
 *
 * @param {object} props
 * @param {string} [props.icon] — Emoji or custom icon
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} [props.actionLabel] — CTA button text
 * @param {Function} [props.onAction] — CTA click handler
 * @param {string} [props.className]
 */
const EmptyState = ({
    icon = '📭',
    title,
    description,
    actionLabel,
    onAction,
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-heading-md text-gigpay-text-primary mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-body-md text-gigpay-text-secondary max-w-xs mb-4">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button onClick={onAction} className="btn-primary">
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

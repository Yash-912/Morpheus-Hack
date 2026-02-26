import { cn } from '../ui/Skeletons';

/**
 * Avatar — Circular user avatar with fallback initials.
 *
 * @param {object} props
 * @param {string} [props.src] — Image URL
 * @param {string} [props.name] — User name (for fallback initials)
 * @param {'sm'|'md'|'lg'|'xl'} [props.size]
 * @param {string} [props.className]
 */
const Avatar = ({ src, name, size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-20 h-20 text-xl',
    };

    const getInitials = (fullName) => {
        if (!fullName) return '?';
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Color based on name hash
    const getColor = (fullName) => {
        const colors = [
            'bg-blue-100 text-blue-700',
            'bg-green-100 text-green-700',
            'bg-yellow-100 text-yellow-700',
            'bg-purple-100 text-purple-700',
            'bg-pink-100 text-pink-700',
            'bg-indigo-100 text-indigo-700',
            'bg-orange-100 text-orange-700',
        ];
        if (!fullName) return colors[0];
        const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    if (src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={cn(
                    'rounded-full object-cover border-[1.5px] border-gigpay-border',
                    sizeClasses[size],
                    className
                )}
                onError={(e) => {
                    // On image load error, replace with initials
                    e.target.style.display = 'none';
                    e.target.nextSibling?.classList.remove('hidden');
                }}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-bold border-[1.5px] border-gigpay-border',
                sizeClasses[size],
                getColor(name),
                className
            )}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const SkeletonCard = ({ className, isLoading, children }) => {
    if (!isLoading) return children;

    return (
        <div className={cn("bg-gigpay-card border-[1.5px] border-gigpay-border rounded-[16px] p-4 shadow-brutal animate-pulse", className)}>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
    );
};

export const SkeletonText = ({ className, isLoading, children, width = "w-24", height = "h-4" }) => {
    if (!isLoading) return children;

    return (
        <div className={cn(`bg-gray-200 rounded animate-pulse ${width} ${height}`, className)}></div>
    );
};

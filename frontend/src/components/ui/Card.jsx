import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Card = forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "bg-gigpay-card border-[1.5px] border-gigpay-border rounded-[16px] p-4 shadow-brutal transition-colors duration-200",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
Card.displayName = "Card";

export const ActionCard = forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "bg-gigpay-card border-[1.5px] border-gigpay-border rounded-[16px] p-4 shadow-brutal transition-all duration-200 cursor-pointer hover:border-gigpay-lime hover:shadow-[6px_6px_0px_#C8F135] active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
ActionCard.displayName = "ActionCard";

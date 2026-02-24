import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Input = forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="flex flex-col w-full gap-1">
            {label && (
                <label className="text-label text-gigpay-navy font-semibold">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={cn(
                    "h-[52px] w-full bg-gigpay-card border-[1.5px] border-gigpay-border rounded-[12px] px-4 font-dm-sans text-base text-gigpay-text-primary placeholder:text-gigpay-text-muted transition-all duration-150 outline-none focus:border-gigpay-navy focus:shadow-[2px_2px_0px_#C8F135]",
                    error && "border-error focus:border-error focus:shadow-[2px_2px_0px_#FCA5A5]",
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-caption text-error font-medium">
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = "Input";

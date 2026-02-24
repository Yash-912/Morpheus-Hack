import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Badge = forwardRef(({ className, variant = 'info', children, ...props }, ref) => {
    const variants = {
        success: 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]',
        warning: 'bg-[#FEF9C3] text-[#CA8A04] border-[#FDE047]',
        danger: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
        info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
        neutral: 'bg-gray-100 text-gray-700 border-gray-300'
    };

    return (
        <span
            ref={ref}
            className={cn(
                "inline-flex items-center px-[10px] py-[4px] rounded-full text-[11px] font-bold font-dm-sans uppercase tracking-wider border-[1.5px]",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
});

Badge.displayName = "Badge";

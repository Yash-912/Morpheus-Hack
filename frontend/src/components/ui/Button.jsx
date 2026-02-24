import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Button = forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    disabled,
    children,
    ...props
}, ref) => {

    const baseStyles = "inline-flex items-center justify-center rounded-[12px] font-dm-sans transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gigpay-lime text-gigpay-text-primary border-2 border-gigpay-navy font-bold shadow-brutal-navy hover:bg-[#D4ED42] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:shadow-none disabled:translate-x-[3px] disabled:translate-y-[3px]",
        secondary: "bg-gigpay-card text-gigpay-text-primary border-[1.5px] border-gigpay-navy font-semibold shadow-brutal-sm hover:bg-gray-50 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:shadow-none disabled:translate-x-[2px] disabled:translate-y-[2px]",
        danger: "bg-gigpay-card text-error border-[1.5px] border-error font-semibold shadow-[2px_2px_0px_#FCA5A5] hover:bg-red-50 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:shadow-none disabled:translate-x-[2px] disabled:translate-y-[2px]",
        ghost: "bg-transparent text-gigpay-navy-mid font-semibold underline hover:bg-gray-100",
        icon: "bg-gigpay-surface border-[1.5px] border-gigpay-border text-gigpay-text-primary hover:bg-gray-100 active:bg-gray-200"
    };

    const sizes = {
        default: "h-[52px] px-6 py-4 text-base",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-11 w-11 rounded-full",
        ghost: "px-4 py-2 text-sm"
    };

    return (
        <button
            ref={ref}
            disabled={isLoading || disabled}
            className={cn(baseStyles, variants[variant], sizes[variant === 'icon' ? 'icon' : variant === 'ghost' ? 'ghost' : size], className)}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

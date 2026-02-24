import { QrCode, ArrowRightLeft, Percent, Smartphone } from 'lucide-react';
import { cn } from './Button';

const actions = [
    { id: 'scan', icon: QrCode, label: 'Scan & Pay', color: 'bg-[#E9FAA0]' },
    { id: 'transfer', icon: ArrowRightLeft, label: 'Bank Transfer', color: 'bg-[#BFDBFE]' },
    { id: 'recharge', icon: Smartphone, label: 'Recharge', color: 'bg-[#FED7AA]' },
    { id: 'offers', icon: Percent, label: 'Offers', color: 'bg-[#FCA5A5]' }
];

export const ActionGrid = ({ className }) => {
    return (
        <div className={cn("grid grid-cols-4 gap-3", className)}>
            {actions.map((action) => {
                const Icon = action.icon;
                return (
                    <button
                        key={action.id}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={cn(
                            "w-[60px] h-[60px] rounded-[16px] border-[1.5px] border-gigpay-navy shadow-brutal-sm flex items-center justify-center transition-all duration-150 relative overflow-hidden",
                            "active:translate-y-[2px] active:translate-x-[2px] active:shadow-none",
                            action.color
                        )}>
                            {/* Subtle hover overlay */}
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
                            <Icon size={26} className="text-gigpay-navy" />
                        </div>
                        <span className="text-[11px] font-dm-sans font-bold text-gigpay-text-secondary leading-tight text-center">
                            {action.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

import { Card } from './Card';
import { SkeletonCard } from './Skeletons';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const EarningWidget = ({ todayAmount, isLoading, onClick }) => {
    const { t } = useLanguage();
    if (isLoading) return <SkeletonCard isLoading={true} />;

    // Format amount from paise to rupees
    const formattedAmount = ((todayAmount || 0) / 100).toLocaleString('en-IN', {
        maximumFractionDigits: 0
    });

    return (
        <Card
            onClick={onClick}
            className="bg-gigpay-navy border-gigpay-navy cursor-pointer hover:border-gigpay-lime hover:shadow-[6px_6px_0px_#C8F135] active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-sm transition-all overflow-hidden relative"
        >
            {/* Decorative background element */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#1A2D5A] rounded-full opacity-50 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className="text-gigpay-lime-soft font-dm-sans font-semibold text-sm">{t('todaysEarnings')}</span>
                    <div className="w-8 h-8 rounded-full bg-[#1A2D5A] flex items-center justify-center">
                        <ArrowUpRight size={18} className="text-gigpay-lime" />
                    </div>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-white font-syne font-bold text-display-lg leading-none">
                        ₹{formattedAmount}
                    </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <div className="bg-[#1A2D5A] px-2 py-1 rounded-md text-[11px] font-dm-sans font-bold text-white border border-gigpay-border/20">
                        +12% {t('vsYesterday')}
                    </div>
                </div>
            </div>
        </Card>
    );
};

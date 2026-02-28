import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from './Card';
import { useUIStore } from '../../store/ui.store';

export const AssistantBanner = ({ className }) => {
    const { t } = useLanguage();
    const setVoiceAssistantOpen = useUIStore(state => state.setVoiceAssistantOpen);

    return (
        <Card
            onClick={() => setVoiceAssistantOpen(true)}
            className={`p-4 flex flex-col justify-center cursor-pointer active:translate-y-[2px] active:shadow-none transition-all border-[1px] border-indigo-500/30 bg-gradient-to-br from-gigpay-navy via-[#1e2345] to-[#2a1b4d] relative overflow-hidden group shadow-lg shadow-indigo-900/20 ${className}`}
        >
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none"></div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity"></div>

            <div className="flex items-center justify-between relative z-10 w-full gap-3">

                {/* Left side: Icon */}
                <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10">
                        <MessageSquare size={20} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Glowing pulse behind icon */}
                    <div className="absolute inset-0 bg-indigo-400 rounded-full blur-sm opacity-40 animate-pulse"></div>
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gigpay-lime rounded-full border-2 border-gigpay-navy z-20 shadow-sm" />
                </div>

                {/* Center: Text Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Sparkles size={14} className="text-[#C8F135]" />
                        <h3 className="text-body-lg font-bold text-white truncate">
                            {t('voiceGreeting')} {t('voiceSubtitle')?.replace("I'm ", "") || "GigPay Assistant"}
                        </h3>
                    </div>
                    <p className="text-[11px] font-dm-sans font-medium text-white/70 truncate">
                        {t('voiceHint') || "Ask me anything in Hindi, Marathi or English"}
                    </p>
                </div>

                {/* Right side: Arrow */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                    <ArrowRight size={16} className="text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </Card>
    );
};

import { Bell, User } from 'lucide-react';
import { useRealtimeStore } from '../../store/realtime.store';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

const TopNav = () => {
    const unreadCount = useRealtimeStore(state => state.unreadNotifications);

    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-gigpay-surface/90 backdrop-blur-md z-40 border-b-[1.5px] border-gigpay-border px-4 py-3 flex items-center justify-between">
            {/* Brand logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gigpay-lime rounded-[8px] border-[1.5px] border-gigpay-navy shadow-brutal-navy flex items-center justify-center">
                    <span className="font-syne font-bold text-gigpay-navy text-lg leading-none">G</span>
                </div>
                <span className="font-syne font-bold text-xl text-gigpay-navy tracking-tight">GigPay</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button className="relative p-2 text-gigpay-navy-mid hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border border-gigpay-card"></span>
                    )}
                </button>
                <Link to="/profile" className="w-9 h-9 bg-[#E2E8F0] rounded-full border-[1.5px] border-gigpay-navy overflow-hidden flex items-center justify-center shadow-[2px_2px_0px_#0D1B3E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                    <User size={20} className="text-gigpay-navy-mid mt-1" />
                </Link>
            </div>
        </header>
    );
};

export default TopNav;

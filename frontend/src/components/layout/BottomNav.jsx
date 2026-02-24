import { Home, Wallet, Users, LayoutGrid } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import { motion } from 'framer-motion';
import { cn } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', path: '/wallet' },
    { id: 'map', icon: Users, label: 'Zones', path: '/zones' },
    { id: 'more', icon: LayoutGrid, label: 'More', path: '/insights' }
];

const BottomNav = () => {
    const { activeTab, setActiveTab } = useUIStore();
    const navigate = useNavigate();

    const handleNavClick = (item) => {
        setActiveTab(item.id);
        navigate(item.path);
    };

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-gigpay-card border-t-[1.5px] border-gigpay-border z-40 px-6 py-3 pb-safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item)}
                            className="relative flex flex-col items-center justify-center w-16 h-12"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="navIndicator"
                                    className="absolute inset-0 bg-gigpay-lime-soft border-[1.5px] border-gigpay-border rounded-[12px] -z-10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30
                                    }}
                                />
                            )}
                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn(
                                    "mb-1 transition-colors duration-200",
                                    isActive ? "text-gigpay-navy" : "text-gigpay-text-muted"
                                )}
                            />
                            <span className={cn(
                                "text-[10px] font-dm-sans font-bold transition-colors duration-200",
                                isActive ? "text-gigpay-navy" : "text-gigpay-text-muted"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;

import { WifiOff } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

const OfflineBanner = () => {
    const isOffline = useOffline();

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-50 bg-[#FEF9C3] border-b-[1.5px] border-[#FDE047] px-4 py-2 flex items-center justify-center gap-2">
            <WifiOff size={16} className="text-[#CA8A04]" />
            <span className="text-[12px] font-bold font-dm-sans text-[#CA8A04] uppercase tracking-wide">
                You're Offline (Limited Mode)
            </span>
        </div>
    );
};

export default OfflineBanner;

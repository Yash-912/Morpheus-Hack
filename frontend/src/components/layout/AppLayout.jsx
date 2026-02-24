import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import OfflineBanner from './OfflineBanner';
import { useAuth } from '../../hooks/useAuth';
import { connectSocket, disconnectSocket } from '../../services/socket.service';

const AppLayout = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            connectSocket(user);
        }
        return () => {
            disconnectSocket();
        };
    }, [user]);

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-surface relative">
            <OfflineBanner />
            <TopNav />

            {/* Main content area - flex-grow ensures it takes remaining space, pb-24 avoids overlap with bottom nav */}
            <main className="flex-grow pt-[72px] pb-24 px-4 overflow-x-hidden">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
};

export default AppLayout;

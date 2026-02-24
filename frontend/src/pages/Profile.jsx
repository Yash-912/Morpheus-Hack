import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, LogOut, ChevronRight, User, Settings, HelpCircle, Star } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center justify-between">
                <h1 className="font-syne font-bold text-display-sm text-gigpay-navy">Profile</h1>
            </header>

            {/* User Info Card */}
            <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gigpay-navy rounded-full flex items-center justify-center border-2 border-gigpay-lime text-white shadow-[2px_2px_0px_#A3CE3D]">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="font-syne font-bold text-h3 text-gigpay-navy leading-tight">
                            {user?.name || 'Loading...'}
                        </h2>
                        <p className="font-dm-sans text-sm text-gigpay-text-secondary mt-1">
                            +91 {user?.phone?.slice(3) || '----------'}
                        </p>
                    </div>
                </div>

                <div className="h-px bg-gigpay-card-border w-full mt-2" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gigpay-text-muted font-dm-sans mb-1">KYC Status</p>
                        <div className="flex items-center gap-1.5 text-gigpay-navy font-bold text-sm">
                            <ShieldCheck size={16} className="text-[#34D399]" />
                            {user?.kycStatus === 'verified' ? 'DigiLocker Verified' : 'Pending'}
                        </div>
                    </div>
                    {user?.kycStatus === 'verified' && user?.aadhaarLast4 && (
                        <div className="text-right">
                            <p className="text-xs text-gigpay-text-muted font-dm-sans mb-1">Aadhaar</p>
                            <p className="font-mono text-sm font-bold text-gigpay-navy">
                                •••• {user.aadhaarLast4}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* GigScore Card */}
            <Card className="bg-[#E9FAA0] border-gigpay-navy p-4 flex items-center justify-between cursor-pointer active:translate-y-0.5 active:shadow-none transition-all Group">
                <div className="flex items-center gap-3">
                    <div className="bg-gigpay-navy p-2 rounded-lg text-gigpay-lime">
                        <Star size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="font-syne font-bold text-gigpay-navy">GigScore</h3>
                        <p className="text-xs font-dm-sans text-gigpay-navy/70">Unlock 0% loans & rewards</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-syne font-bold text-h3 text-gigpay-navy">{user?.gigScore || 400}</span>
                    <ChevronRight size={20} className="text-gigpay-navy" />
                </div>
            </Card>

            {/* Settings Menu */}
            <div className="flex flex-col gap-3 mt-2">
                <h3 className="font-dm-sans font-bold text-sm text-gigpay-text-secondary uppercase tracking-wider px-2">
                    Account & Settings
                </h3>

                <Card className="p-0 overflow-hidden divide-y rounded-2xl">
                    <button className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            <Settings size={20} className="text-gigpay-text-muted" />
                            App Preferences
                        </div>
                        <ChevronRight size={20} className="text-gigpay-text-muted" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            <HelpCircle size={20} className="text-gigpay-text-muted" />
                            Help & Support
                        </div>
                        <ChevronRight size={20} className="text-gigpay-text-muted" />
                    </button>
                </Card>
            </div>

            {/* Logout */}
            <Button
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2 text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                onClick={handleLogout}
            >
                <LogOut size={18} />
                Log Out
            </Button>
        </div>
    );
};

export default Profile;

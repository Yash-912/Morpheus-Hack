import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, LogOut, ChevronRight, ChevronDown, User, Settings, HelpCircle, Star, MapPin, Link2, MessageSquare, Loader2, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useGPSContext } from '../context/GPSContext';
import { readSms } from '../plugins/sms-plugin';
import api from '../services/api.service';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isTracking, toggleTracking } = useGPSContext();
    const [syncing, setSyncing] = React.useState(false);
    const [lastSyncTime, setLastSyncTime] = React.useState(null);
    const [syncHistory, setSyncHistory] = React.useState([]);
    const [showHistory, setShowHistory] = React.useState(false);
    const [historyLoaded, setHistoryLoaded] = React.useState(false);

    // Fetch last sync time and history on mount
    React.useEffect(() => {
        fetchSyncInfo();
    }, []);

    const fetchSyncInfo = async () => {
        try {
            const [lastRes, histRes] = await Promise.all([
                api.get('/sms/last-sync').catch(() => null),
                api.get('/sms/history').catch(() => null),
            ]);
            if (lastRes?.data?.lastTimestamp) {
                setLastSyncTime(lastRes.data.lastTimestamp);
            }
            if (histRes?.data?.sessions) {
                setSyncHistory(histRes.data.sessions);
                setHistoryLoaded(true);
            }
        } catch (e) {
            // Silently fail — not critical
        }
    };

    const handleSyncSms = async () => {
        if (syncing) return;
        setSyncing(true);
        try {
            // 1. Get last sync timestamp for incremental sync
            let afterTimestamp = null;
            try {
                const lastSyncRes = await api.get('/sms/last-sync');
                if (lastSyncRes.data?.lastTimestamp) {
                    afterTimestamp = lastSyncRes.data.lastTimestamp;
                }
            } catch (e) {
                // First sync — no previous data
            }

            // 2. Read SMS from device (incremental if possible)
            const { messages, count } = await readSms(100, afterTimestamp);
            if (!messages || messages.length === 0) {
                toast('No new SMS messages found', { icon: '📭' });
                setSyncing(false);
                return;
            }

            // 3. Send to backend
            const { data } = await api.post('/sms/sync', {
                messages,
                totalScanned: count || messages.length,
            });

            if (data.success) {
                const parts = [];
                if (data.synced > 0) parts.push(`${data.synced} new SMS`);
                if (data.skipped > 0) parts.push(`${data.skipped} duplicates`);
                if (data.discarded > 0) parts.push(`${data.discarded} irrelevant`);
                if (data.processing?.created > 0) {
                    parts.push(`${data.processing.created} transactions created`);
                }
                toast.success(parts.join(' · ') || 'Sync complete');
            } else {
                toast.error('Sync failed — try again');
            }

            // 4. Refresh sync info
            await fetchSyncInfo();
        } catch (err) {
            console.error('SMS sync error:', err);
            const msg = err?.response?.data?.error?.message || err.message || 'SMS sync failed';
            toast.error(msg);
        } finally {
            setSyncing(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const formatRelativeTime = (isoString) => {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const formatDateTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleString('en-IN', {
            day: 'numeric', month: 'short',
            hour: 'numeric', minute: '2-digit',
            hour12: true,
        });
    };

    const StatusBadge = ({ status }) => {
        const config = {
            success: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
            partial: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
            failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
            pending: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.bg} ${c.text}`}>
                <Icon size={10} />
                {status}
            </span>
        );
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
                    {/* Location Tracking Toggle */}
                    <button
                        onClick={toggleTracking}
                        className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            <MapPin size={20} className={isTracking ? 'text-blue-500' : 'text-gigpay-text-muted'} />
                            Location Tracking
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isTracking ? 'text-emerald-600' : 'text-gigpay-text-muted'}`}>
                                {isTracking ? 'ON' : 'OFF'}
                            </span>
                            <div
                                className={`w-11 h-6 rounded-full relative transition-colors ${isTracking ? 'bg-emerald-500' : 'bg-gray-300'
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isTracking ? 'translate-x-[22px]' : 'translate-x-0.5'
                                        }`}
                                />
                            </div>
                        </div>
                    </button>

                    <button onClick={() => navigate('/profile/linked-accounts')} className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            <Link2 size={20} className="text-gigpay-text-muted" />
                            Linked Accounts
                        </div>
                        <ChevronRight size={20} className="text-gigpay-text-muted" />
                    </button>
                    <button onClick={() => navigate('/profile/support')} className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            <HelpCircle size={20} className="text-gigpay-text-muted" />
                            Help & Support
                        </div>
                        <ChevronRight size={20} className="text-gigpay-text-muted" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            <Settings size={20} className="text-gigpay-text-muted" />
                            App Preferences
                        </div>
                        <ChevronRight size={20} className="text-gigpay-text-muted" />
                    </button>
                </Card>

                {/* ==================== SMS Sync Section ==================== */}
                <Card className="p-0 overflow-hidden rounded-2xl mt-3">
                    {/* Sync Button */}
                    <button
                        onClick={handleSyncSms}
                        disabled={syncing}
                        className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                        <div className="flex items-center gap-3 text-gigpay-navy font-dm-sans font-medium">
                            {syncing ? (
                                <Loader2 size={20} className="text-blue-500 animate-spin" />
                            ) : (
                                <MessageSquare size={20} className="text-blue-500" />
                            )}
                            {syncing ? 'Syncing SMS...' : 'Sync SMS'}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gigpay-text-muted font-dm-sans">
                                Import from inbox
                            </span>
                            {lastSyncTime && (
                                <span className="text-[10px] text-gigpay-text-muted font-dm-sans mt-0.5">
                                    Last: {formatRelativeTime(lastSyncTime)}
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Sync History Toggle */}
                    {historyLoaded && syncHistory.length > 0 && (
                        <>
                            <div className="h-px bg-gigpay-card-border" />
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full flex items-center justify-between px-4 py-3 text-xs font-dm-sans text-gigpay-text-secondary active:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium">Sync History ({syncHistory.length})</span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Collapsible History List */}
                            {showHistory && (
                                <div className="border-t border-gigpay-card-border">
                                    {syncHistory.map((s) => (
                                        <div
                                            key={s.id}
                                            className="px-4 py-3 border-b border-gigpay-card-border last:border-b-0"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-dm-sans font-medium text-gigpay-navy">
                                                    {formatDateTime(s.startedAt)}
                                                </span>
                                                <StatusBadge status={s.status} />
                                            </div>
                                            <div className="flex gap-3 text-[11px] font-dm-sans text-gigpay-text-muted">
                                                <span className="text-emerald-600 font-semibold">
                                                    +{s.newStored} new
                                                </span>
                                                {s.irrelevantDiscarded > 0 && (
                                                    <span className="text-amber-600">
                                                        {s.irrelevantDiscarded} filtered
                                                    </span>
                                                )}
                                                {s.duplicatesSkipped > 0 && (
                                                    <span className="text-gray-400">
                                                        {s.duplicatesSkipped} dupes
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import { ArrowLeft, Link2, Plus, Trash2, Check } from 'lucide-react';
import { getPlatform, getAllPlatformIds } from '../../constants/platforms';

const LinkedAccounts = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);

    useEffect(() => { setActiveTab('profile'); }, [setActiveTab]);

    // Demo data — replace with API
    const [platformAccounts] = useState([
        { platformId: 'zomato', connected: true, username: 'ramesh_d123', connectedOn: '2025-08-12' },
        { platformId: 'swiggy', connected: true, username: 'rameshk_sw', connectedOn: '2025-09-01' },
        { platformId: 'ola', connected: false },
        { platformId: 'uber', connected: false },
        { platformId: 'dunzo', connected: false },
    ]);

    const [bankAccounts] = useState([
        {
            id: '1',
            bankName: 'State Bank of India',
            accountNumber: '****1234',
            ifsc: 'SBIN0001234',
            isPrimary: true,
            verified: true,
        },
        {
            id: '2',
            bankName: 'Kotak Mahindra Bank',
            accountNumber: '****5678',
            ifsc: 'KKBK0001234',
            isPrimary: false,
            verified: true,
        },
    ]);

    const [upiIds] = useState([
        { id: '1', upiId: 'ramesh@ybl', isPrimary: true },
    ]);

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Linked Accounts</h1>
            </div>

            {/* Platform Accounts */}
            <div>
                <h3 className="text-heading-md mb-3">🚗 Gig Platforms</h3>
                <div className="flex flex-col gap-2">
                    {platformAccounts.map((acc) => {
                        const platform = getPlatform(acc.platformId);
                        return (
                            <div key={acc.platformId} className="card py-3 flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                    style={{ backgroundColor: `${platform.color}20` }}
                                >
                                    {platform.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-body-md font-semibold text-gigpay-navy">
                                        {platform.name}
                                    </p>
                                    {acc.connected ? (
                                        <p className="text-caption text-green-600">
                                            ✅ {acc.username}
                                        </p>
                                    ) : (
                                        <p className="text-caption text-gigpay-text-muted">
                                            Not connected
                                        </p>
                                    )}
                                </div>
                                <button
                                    className={`px-4 py-2 rounded-xl text-body-md font-semibold border-[1.5px] transition-all duration-75 active:scale-[0.97] ${acc.connected
                                            ? 'bg-red-50 border-red-200 text-red-600'
                                            : 'bg-[#C8F135]/20 border-gigpay-navy text-gigpay-navy'
                                        }`}
                                >
                                    {acc.connected ? 'Disconnect' : 'Connect'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bank Accounts */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-heading-md">🏦 Bank Accounts</h3>
                    <button className="btn-icon bg-[#C8F135] border-gigpay-navy">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {bankAccounts.map((bank) => (
                        <div key={bank.id} className="card py-3 flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-body-md font-semibold text-gigpay-navy">
                                        {bank.bankName}
                                    </p>
                                    {bank.isPrimary && (
                                        <span className="badge badge-success text-caption">Primary</span>
                                    )}
                                </div>
                                <p className="text-caption text-gigpay-text-muted">
                                    A/C: {bank.accountNumber} • IFSC: {bank.ifsc}
                                </p>
                                {bank.verified && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Check size={12} className="text-green-500" />
                                        <span className="text-caption text-green-600">Verified</span>
                                    </div>
                                )}
                            </div>
                            {!bank.isPrimary && (
                                <button className="btn-icon text-red-400">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* UPI IDs */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-heading-md">📲 UPI IDs</h3>
                    <button className="btn-icon bg-[#C8F135] border-gigpay-navy">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {upiIds.map((upi) => (
                        <div key={upi.id} className="card py-3 flex items-center gap-3">
                            <Link2 size={20} className="text-gigpay-text-secondary" />
                            <div className="flex-1">
                                <p className="text-body-md font-semibold text-gigpay-navy">{upi.upiId}</p>
                            </div>
                            {upi.isPrimary && (
                                <span className="badge badge-success text-caption">Primary</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LinkedAccounts;

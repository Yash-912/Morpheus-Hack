import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ActionCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const PlatformLink = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-surface px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-gigpay-navy rounded-full flex items-center justify-center bg-gigpay-card shadow-[2px_2px_0px_#0D1B3E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
                <ArrowLeft size={20} className="text-gigpay-navy" />
            </button>

            <div className="flex-1 flex flex-col pt-16">
                <h1 className="font-syne font-bold text-display-md text-gigpay-navy leading-tight mb-2">
                    Link your accounts
                </h1>
                <p className="font-dm-sans text-body-md text-gigpay-text-secondary mb-8">
                    Connect your gig platforms to securely fetch your daily earnings.
                </p>

                <div className="flex flex-col gap-4 flex-1">
                    {/* Linked Platform */}
                    <ActionCard className="flex items-center justify-between opacity-80 pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-black rounded-[12px] flex items-center justify-center">
                                <span className="text-white font-bold text-lg leading-none italic font-serif">U</span>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-gigpay-navy">Uber Driver</h3>
                                <span className="text-caption text-gigpay-text-secondary">Synced 5 mins ago</span>
                            </div>
                        </div>
                        <CheckCircle2 size={24} className="text-[#16A34A]" />
                    </ActionCard>

                    {/* Unlinked Platform */}
                    <ActionCard className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#FC8019] rounded-[12px] flex items-center justify-center">
                                <span className="text-white font-bold text-lg leading-none font-sans">S</span>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-gigpay-navy">Swiggy Delivery</h3>
                                <Badge variant="warning" className="w-fit mt-1">Found on device</Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="px-2 underline">Connect</Button>
                    </ActionCard>

                    <ActionCard className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#E23744] rounded-[12px] flex items-center justify-center">
                                <span className="text-white font-bold text-lg leading-none font-sans">Z</span>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-bold text-gigpay-navy">Zomato Run</h3>
                                <Badge variant="warning" className="w-fit mt-1">Found on device</Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="px-2 underline">Connect</Button>
                    </ActionCard>
                </div>

                <div className="mt-8 pb-4">
                    <Button
                        className="w-full"
                        onClick={() => navigate('/onboarding/bank')}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PlatformLink;

import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, PiggyBank, Coins, ArrowRight } from 'lucide-react';

const Savings = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <div className="flex-1">
                    <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Savings Hub</h1>
                </div>
            </header>

            <Card className="bg-gigpay-navy text-white text-center py-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gigpay-lime opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 opacity-20 rounded-full blur-2xl"></div>

                <PiggyBank size={32} className="mx-auto text-gigpay-lime mb-3" />
                <h2 className="text-display-sm font-bold text-white mb-2">Build Wealth Daily</h2>
                <p className="text-body-sm text-white/80">Micro-saving options tailored for gig workers.</p>
            </Card>

            <div className="flex flex-col gap-4">
                <Card
                    className="flex items-center gap-4 cursor-pointer hover:border-gigpay-navy transition-colors border-2"
                    onClick={() => navigate('/microsavings')}
                >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <PiggyBank size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-body-lg font-bold text-gigpay-navy">Gullak (Auto-stash)</h3>
                        <p className="text-body-sm text-gigpay-text-secondary mt-0.5">Set goals and save automatically from payouts.</p>
                    </div>
                    <ArrowRight size={20} className="text-gigpay-text-muted" />
                </Card>

                <Card
                    className="flex items-center gap-4 cursor-pointer hover:border-gigpay-navy transition-colors border-2"
                    onClick={() => navigate('/microsavings')}
                >
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Coins size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-body-lg font-bold text-gigpay-navy">Digital Gold</h3>
                        <p className="text-body-sm text-gigpay-text-secondary mt-0.5">Buy pure 24K gold starting at just ₹10.</p>
                    </div>
                    <ArrowRight size={20} className="text-gigpay-text-muted" />
                </Card>
            </div>
        </div>
    );
};

export default Savings;

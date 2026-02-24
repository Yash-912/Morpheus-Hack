import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen w-full bg-gigpay-navy text-white px-6">
            <div className="flex-1 flex flex-col justify-center items-center text-center max-w-[420px] mx-auto w-full">
                {/* Mock Logo Graphic */}
                <div className="w-24 h-24 bg-gigpay-lime rounded-[20px] mb-8 border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-3">
                    <span className="font-syne font-bold text-black text-5xl leading-none">G</span>
                </div>

                <h1 className="font-syne font-bold text-display-lg text-white mb-4 leading-tight">
                    Supercharge<br />Your Gig Work
                </h1>

                <p className="font-dm-sans text-body-lg text-gray-300 mb-12 max-w-sm">
                    Cash out instantly, find hot delivery zones, and track your daily earnings across apps.
                </p>

                <Button
                    variant="primary"
                    className="w-full h-14 text-lg py-0"
                    onClick={() => navigate('/auth/phone')}
                >
                    Get Started
                </Button>

                <p className="font-dm-sans text-caption text-gray-400 mt-6 max-w-xs cursor-pointer hover:text-white transition-colors duration-200" onClick={() => navigate('/login')}>
                    Already have an account? Log in
                </p>
            </div>
        </div>
    );
};

export default Landing;

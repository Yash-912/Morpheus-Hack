import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Camera, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const SelfieCapture = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleCapture = () => {
        setIsLoading(true);
        // Mocking AWS Rekognition validation
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Face Match Successful!');
            navigate('/onboarding/platforms');
        }, 2000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-navy px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-white rounded-full flex items-center justify-center bg-transparent active:bg-white/10"
            >
                <ArrowLeft size={20} className="text-white" />
            </button>

            <div className="flex flex-col items-center pt-8 text-center">
                <h1 className="font-syne font-bold text-display-md text-white leading-tight mb-2">
                    Take a selfie
                </h1>
                <p className="font-dm-sans text-body-md text-gray-300 mb-8 max-w-[280px]">
                    We need to match your face with your Aadhaar photo for security.
                </p>

                {/* Mock Camera Viewfinder */}
                <div className="w-64 h-80 rounded-full border-[4px] border-dashed border-gigpay-lime/50 flex items-center justify-center relative bg-black overflow-hidden mb-12 shadow-[0_0_30px_rgba(200,241,53,0.2)]">
                    <div className="absolute inset-0 bg-gradient-to-t from-gigpay-lime/20 to-transparent mix-blend-overlay"></div>
                    <Camera size={48} className="text-gigpay-lime/60 mb-8" />
                    <p className="absolute bottom-16 text-white text-sm font-dm-sans opacity-70">
                        Position your face here
                    </p>
                </div>

                <div className="w-full mt-auto pb-4">
                    <Button
                        className="w-full"
                        onClick={handleCapture}
                        isLoading={isLoading}
                    >
                        Capture & Verify
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SelfieCapture;

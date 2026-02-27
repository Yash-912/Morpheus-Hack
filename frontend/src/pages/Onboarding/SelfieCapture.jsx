import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Button } from '../../components/ui/Button';
import { Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifySelfieApi } from '../../services/auth.api';
import { useAuth } from '../../hooks/useAuth';

const SelfieCapture = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const webcamRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    const videoConstraints = {
        width: 480,
        height: 640,
        facingMode: "user"
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImageSrc(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setImageSrc(null);
    };

    // Helper to convert base64 to Blob
    const dataURLtoBlob = (dataurl) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleVerify = async () => {
        if (!imageSrc) return;

        setIsLoading(true);
        try {
            const blob = dataURLtoBlob(imageSrc);
            // Verify and enroll the selfie
            const res = await verifySelfieApi(blob);

            // Sync status
            updateUser({ kycStatus: 'verified' });

            toast.success(res.data?.message || 'Face Verification Successful!');
            navigate('/onboarding/platforms');
        } catch (err) {
            console.error('Selfie Verify Error:', err);
            toast.error(err.response?.data?.error?.message || 'Verification failed. Please try again.');
            // Allow them to retake if it fails
            setImageSrc(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-navy px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-white rounded-full flex items-center justify-center bg-transparent active:bg-white/10 z-10"
                disabled={isLoading}
            >
                <ArrowLeft size={20} className="text-white" />
            </button>

            <div className="flex flex-col items-center pt-8 text-center flex-1">
                <h1 className="font-syne font-bold text-display-md text-white leading-tight mb-2">
                    Take a selfie
                </h1>
                <p className="font-dm-sans text-body-md text-gray-300 mb-8 max-w-[280px]">
                    We need to match your face with your Aadhaar photo for security.
                </p>

                {/* Camera Viewfinder */}
                <div className="w-64 h-80 rounded-[2rem] border-[4px] border-gigpay-lime flex items-center justify-center relative bg-black overflow-hidden mb-8 shadow-[0_0_30px_rgba(200,241,53,0.2)]">
                    {!imageSrc ? (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="absolute inset-0 w-full h-full object-cover"
                            mirrored={true}
                        />
                    ) : (
                        <img
                            src={imageSrc}
                            alt="Selfie preview"
                            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                        />
                    )}

                    {/* Overlay Frame */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-[40px] border-black/30 rounded-[2rem] mix-blend-multiply"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-56 border-2 border-dashed border-white/50 rounded-[4rem]"></div>
                    </div>
                </div>

                <div className="w-full mt-auto pb-4 flex flex-col gap-4">
                    {!imageSrc ? (
                        <Button
                            className="w-full text-lg h-14 bg-white text-gigpay-navy hover:bg-gray-100 border-none shadow-[4px_4px_0px_#C8F135]"
                            onClick={capture}
                        >
                            <Camera className="mr-2" size={24} />
                            Snap Photo
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-3 w-full">
                            <Button
                                className="w-full text-lg h-14"
                                onClick={handleVerify}
                                isLoading={isLoading}
                            >
                                Verify My Identity
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-12 border-gray-600 text-white hover:bg-white/10"
                                onClick={retake}
                                disabled={isLoading}
                            >
                                <RefreshCw className="mr-2" size={18} />
                                Retake Photo
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelfieCapture;

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, ShieldCheck, UploadCloud, CheckCircle2, FileArchive } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAadhaarXmlApi } from '../../services/auth.api';
import { useAuth } from '../../hooks/useAuth';

const AadhaarKYC = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    // Screens: 'instructions' -> 'upload' -> 'confirmed'
    const [screen, setScreen] = useState('instructions');
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [file, setFile] = useState(null);
    const [shareCode, setShareCode] = useState('');
    const [verifiedData, setVerifiedData] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.zip') && selectedFile.type !== 'application/zip' && selectedFile.type !== 'application/x-zip-compressed') {
            toast.error('Please upload a valid .zip file');
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select your Aadhaar ZIP file');
            return;
        }
        if (shareCode.length !== 4) {
            toast.error('Please enter the 4-digit share code');
            return;
        }

        setIsLoading(true);
        try {
            const res = await uploadAadhaarXmlApi(file, shareCode);

            // Sync the updated User data into global state
            updateUser(res.data);
            setVerifiedData(res.data);

            toast.success('Aadhaar Verified Successfully!');
            setScreen('confirmed');
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Verification failed. Check your file and share code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gigpay-surface px-6 pt-12 pb-6 max-w-[420px] mx-auto w-full relative">
            <button
                onClick={() => {
                    if (screen === 'upload') setScreen('instructions');
                    else navigate(-1);
                }}
                className="absolute top-6 left-6 w-10 h-10 border-[1.5px] border-gigpay-navy rounded-full flex items-center justify-center bg-gigpay-card shadow-[2px_2px_0px_#0D1B3E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                disabled={isLoading}
            >
                <ArrowLeft size={20} className="text-gigpay-navy" />
            </button>

            <div className="flex-1 flex flex-col pt-16">

                {screen === 'instructions' && (
                    <>
                        <h1 className="font-syne font-bold text-display-md text-gigpay-navy leading-tight mb-2">
                            Aadhaar Offline KYC
                        </h1>
                        <p className="font-dm-sans text-body-md text-gigpay-text-secondary mb-6">
                            Secure, free, and instant verification directly via UIDAI.
                        </p>

                        <div className="flex flex-col gap-6 flex-1">
                            <Card className="p-5 border-2 border-gigpay-navy shadow-[4px_4px_0px_#0D1B3E] bg-white">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gigpay-navy text-white flex items-center justify-center text-sm">1</span>
                                    On the UIDAI Website:
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-gigpay-text-secondary font-medium">
                                    <li>Enter your Aadhaar number & Captcha</li>
                                    <li>Enter the OTP sent to your phone</li>
                                    <li>Set a <strong>4-digit Share Code</strong></li>
                                    <li>Download the <strong>ZIP file</strong></li>
                                </ul>
                                <Button
                                    variant="outline"
                                    className="w-full mt-5 text-sm h-10"
                                    onClick={() => window.open('https://myaadhaar.uidai.gov.in/offline-ekyc', '_blank')}
                                >
                                    Open UIDAI Website ↗
                                </Button>
                            </Card>

                            <Card className="p-5 border-2 border-gigpay-navy shadow-[4px_4px_0px_#0D1B3E] bg-[#E9FAA0]">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gigpay-navy text-white flex items-center justify-center text-sm">2</span>
                                    Come back here:
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-gigpay-navy font-medium">
                                    <li>Upload the ZIP file you downloaded</li>
                                    <li>Enter the 4-digit Share Code</li>
                                </ul>
                            </Card>
                        </div>

                        <div className="mt-8 pb-4">
                            <Button
                                onClick={() => setScreen('upload')}
                                className="w-full"
                            >
                                I have the ZIP file
                            </Button>
                        </div>
                    </>
                )}

                {screen === 'upload' && (
                    <>
                        <h1 className="font-syne font-bold text-display-md text-gigpay-navy leading-tight mb-2">
                            Upload Aadhaar ZIP
                        </h1>
                        <p className="font-dm-sans text-body-md text-gigpay-text-secondary mb-8">
                            Upload the file downloaded from UIDAI and enter your share code.
                        </p>

                        <form onSubmit={handleUpload} className="flex flex-col gap-6 flex-1">

                            {/* File Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-gigpay-lime bg-[#f9fde6]' : 'border-gray-300 hover:border-gigpay-navy hover:bg-gray-50'}`}
                            >
                                <input
                                    type="file"
                                    accept=".zip,application/zip"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />
                                {file ? (
                                    <>
                                        <FileArchive size={40} className="text-gigpay-lime mb-3" />
                                        <p className="font-bold text-gigpay-navy">{file.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={40} className="text-gray-400 mb-3" />
                                        <p className="font-bold text-gigpay-navy">Tap to upload ZIP file</p>
                                        <p className="text-sm text-gray-500 mt-1">Must be the exact .zip from UIDAI</p>
                                    </>
                                )}
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-bold text-gigpay-navy mb-2">Share Code</label>
                                <Input
                                    type="number"
                                    placeholder="Enter 4-digit code"
                                    maxLength={4}
                                    value={shareCode}
                                    onChange={(e) => setShareCode(e.target.value.slice(0, 4))}
                                    className="text-center text-2xl tracking-widest font-bold h-14"
                                />
                                <p className="text-xs text-center text-gray-500 mt-2">The code you created before downloading</p>
                            </div>

                            <Card className="bg-[#E9FAA0] border-gigpay-navy p-4 mt-auto flex items-start gap-4">
                                <ShieldCheck size={24} className="text-gigpay-navy mt-1 flex-shrink-0" />
                                <p className="text-xs font-dm-sans font-medium text-gigpay-navy leading-relaxed">
                                    We verify the digital signature embedded in the XML by UIDAI. Your data is never shared.
                                </p>
                            </Card>

                            <div className="pb-4 mt-4">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    isLoading={isLoading}
                                    disabled={!file || shareCode.length !== 4}
                                >
                                    Verify My Aadhaar
                                </Button>
                            </div>
                        </form>
                    </>
                )}

                {screen === 'confirmed' && verifiedData && (
                    <div className="flex flex-col items-center text-center pt-8">
                        <div className="w-20 h-20 bg-[#16A34A] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(22,163,74,0.3)]">
                            <CheckCircle2 size={40} className="text-white" />
                        </div>

                        <h1 className="font-syne font-bold text-display-md text-gigpay-navy mb-8">
                            Identity Verified!
                        </h1>

                        <Card className="w-full p-6 border-2 border-gigpay-navy shadow-[4px_4px_0px_#0D1B3E] bg-white text-left flex flex-col gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Name</p>
                                <p className="font-bold text-xl text-gigpay-navy">{verifiedData.name}</p>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">DOB</p>
                                    <p className="font-bold text-gigpay-navy">{verifiedData.dob}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">City</p>
                                    <p className="font-bold text-gigpay-navy">{verifiedData.city || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Aadhaar (Masked)</p>
                                <p className="font-mono font-bold text-gigpay-navy">XXXX XXXX {verifiedData.aadhaarLast4}</p>
                            </div>
                        </Card>

                        <div className="w-full mt-auto pb-4 pt-12">
                            <Button
                                onClick={() => navigate('/onboarding/selfie')}
                                className="w-full"
                            >
                                Continue to Selfie
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AadhaarKYC;


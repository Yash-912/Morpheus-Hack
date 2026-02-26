import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '../hooks/useCommunity';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, MapPin, Wallet as WalletIcon, CheckCircle2 } from 'lucide-react';
import { usePayouts } from '../hooks/usePayouts';

const jobSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Please describe the task properly'),
    type: z.string().min(1, 'Please select a type'),
    amount: z.number().min(50, 'Minimum amount is ₹50'),
    address: z.string().min(5, 'Please provide a rough meeting point'),
});

const PostJob = () => {
    const navigate = useNavigate();
    const { createJob, isCreating } = useCommunity();
    const { balance } = usePayouts(); // To check if they have enough balance for escrow

    const walletBalance = balance?.walletBalance || 0;
    const [successPayload, setSuccessPayload] = useState(null);

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: '', description: '', type: 'local_delivery', amount: 100, address: ''
        }
    });

    const watchAmount = watch('amount');

    const onSubmit = async (data) => {
        // Dummy coords based out of Bangalore
        const payload = {
            ...data,
            amount: data.amount * 100, // convert rupees to paise for backend
            lat: 12.9716 + (Math.random() - 0.5) * 0.05,
            lng: 77.5946 + (Math.random() - 0.5) * 0.05,
        };

        try {
            const res = await createJob(payload);
            setSuccessPayload(res);
        } catch (error) {
            console.error(error);
        }
    };

    if (successPayload) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-10 animate-fade-in h-[calc(100vh-140px)]">
                <CheckCircle2 size={64} className="text-[#84cc16] mb-4" />
                <h2 className="text-display-sm font-bold text-gigpay-navy mb-2">Gig Posted!</h2>
                <p className="text-body-md text-gigpay-text-secondary mb-6 max-w-[280px]">
                    Your gig is now live for nearby workers. <strong className="text-gigpay-navy">₹{(successPayload?.offeredPrice || successPayload?.amount || 0) / 100}</strong> has been secured in Escrow.
                </p>
                <div className="flex flex-col gap-3 w-full">
                    <Button onClick={() => navigate(`/community/${successPayload.id}`)}>View Job Detail</Button>
                    <Button variant="outline" onClick={() => navigate('/community')}>Back to Community</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Create a Gig</h1>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 relative">
                    <label className="text-label text-gigpay-navy font-bold">What do you need?</label>
                    <input
                        {...register('title')}
                        placeholder="e.g., Deliver keys to HSR Layout"
                        className="p-3 rounded-lg border-2 border-gigpay-navy focus:outline-none focus:ring-2 focus:ring-gigpay-lime shadow-brutal font-dm-sans bg-white transition-all"
                    />
                    {errors.title && <span className="text-xs text-red-500 font-bold">{errors.title.message}</span>}
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col gap-2 relative flex-1">
                        <label className="text-label text-gigpay-navy font-bold">Category</label>
                        <select
                            {...register('type')}
                            className="p-3 rounded-lg border-2 border-gigpay-navy shadow-brutal font-dm-sans bg-white focus:outline-none appearance-none"
                        >
                            <option value="local_delivery">Delivery / Errand</option>
                            <option value="home_service">General Help</option>
                            <option value="freelance">Freelance</option>
                            <option value="ride">Ride</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 relative flex-1">
                        <label className="text-label text-gigpay-navy font-bold">Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-[14px] text-gigpay-text-secondary font-bold">₹</span>
                            <input
                                type="number"
                                {...register('amount', { valueAsNumber: true })}
                                placeholder="150"
                                className="p-3 pl-8 rounded-lg border-2 border-gigpay-navy w-full focus:outline-none focus:ring-2 focus:ring-gigpay-lime shadow-brutal font-dm-sans bg-white"
                            />
                        </div>
                        {errors.amount && <span className="text-xs text-red-500 font-bold">{errors.amount.message}</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-2 relative">
                    <label className="text-label text-gigpay-navy font-bold">Details</label>
                    <textarea
                        {...register('description')}
                        placeholder="Provide clear instructions for the worker..."
                        rows={3}
                        className="p-3 rounded-lg border-2 border-gigpay-navy focus:outline-none focus:ring-2 focus:ring-gigpay-lime shadow-brutal font-dm-sans bg-white resize-none"
                    />
                    {errors.description && <span className="text-xs text-red-500 font-bold">{errors.description.message}</span>}
                </div>

                <div className="flex flex-col gap-2 relative">
                    <label className="text-label text-gigpay-navy font-bold flex items-center gap-1">
                        <MapPin size={14} /> Neighborhood / Address
                    </label>
                    <input
                        {...register('address')}
                        placeholder="e.g., Near Kormangala BDA Complex"
                        className="p-3 rounded-lg border-2 border-gigpay-navy focus:outline-none shadow-brutal font-dm-sans bg-white"
                    />
                    {errors.address && <span className="text-xs text-red-500 font-bold">{errors.address.message}</span>}
                </div>

                <Card className="bg-[#E2E8F0] p-4 flex gap-3 mt-2 border-none">
                    <WalletIcon size={24} className="text-gigpay-navy shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm text-gigpay-navy">Escrow Summary</h4>
                        <p className="text-xs text-gigpay-text-secondary my-1">
                            ₹{watchAmount || 0} will be safely locked in an escrow account. It will only be released to the worker when you confirm completion.
                        </p>
                        <div className={`text-xs font-bold mt-2 ${(walletBalance / 100) < (watchAmount || 0) ? 'text-red-500' : 'text-green-600'}`}>
                            Wallet Balance: ₹{(walletBalance / 100).toFixed(0)}
                        </div>
                    </div>
                </Card>

                <Button
                    type="submit"
                    className="w-full mt-2 bg-[#FFD166] text-gigpay-navy hover:bg-[#F4C455]"
                    disabled={isCreating || (walletBalance / 100) < (watchAmount || 0)}
                >
                    {isCreating ? "Locking Escrow..." : "Secure & Post Job"}
                </Button>
            </form>
        </div>
    );
};

export default PostJob;

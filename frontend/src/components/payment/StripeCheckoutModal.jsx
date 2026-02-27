import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { createPaymentIntent } from '../../services/payment.api';

// Initialize Stripe outside of component render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error: submitError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/wallet', // or any success page
            },
            redirect: 'if_required',
        });

        if (submitError) {
            setError(submitError.message);
            setIsProcessing(false);
        } else {
            // Payment Successful
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PaymentElement
                className="mb-4"
                onChange={(e) => setIsComplete(e.complete)}
            />
            {error && <div className="text-sm text-red-500 font-bold">{error}</div>}
            <Button
                type="submit"
                disabled={!stripe || isProcessing || !isComplete}
                isLoading={isProcessing}
                className="w-full bg-gigpay-navy text-white hover:bg-gigpay-navy/90"
            >
                Pay ₹{amount}
            </Button>
        </form>
    );
};

const StripeCheckoutModal = ({ isOpen, onClose, amount, onSuccess }) => {
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        if (isOpen && amount > 0) {
            // Create PaymentIntent as soon as the modal opens
            createPaymentIntent(amount)
                .then((data) => setClientSecret(data.clientSecret))
                .catch((err) => console.error('Failed to init payment', err));
        }
    }, [isOpen, amount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gigpay-navy/40 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-md bg-white p-6 shadow-brutal-lg relative border-4 border-gigpay-navy">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-gigpay-surface rounded-full transition-colors"
                >
                    <X size={20} className="text-gigpay-navy" />
                </button>

                <div className="mb-6">
                    <h2 className="text-heading-lg font-syne font-bold text-gigpay-navy">Complete Payment</h2>
                    <p className="text-body-sm text-gigpay-text-secondary">Testing Stripe Integration</p>
                </div>

                {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm amount={amount} onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                ) : (
                    <div className="text-center py-8 text-gigpay-text-muted">
                        Initializing secure checkout...
                    </div>
                )}
            </Card>
        </div>
    );
};

export default StripeCheckoutModal;

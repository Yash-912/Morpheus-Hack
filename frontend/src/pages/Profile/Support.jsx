import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Mail, AlertCircle } from 'lucide-react';

const FAQ_ITEMS = [
    {
        q: 'How fast is instant cashout?',
        a: 'Instant cashout usually completes within 30-60 seconds. The amount is sent directly to your linked UPI ID or bank account.',
    },
    {
        q: 'What is GigScore and how is it calculated?',
        a: 'GigScore (0-1000) represents your creditworthiness based on your earning consistency, platform ratings, loan repayment history, and account age. A higher GigScore unlocks better loan terms and lower cashout fees.',
    },
    {
        q: 'How does Section 44AD help me?',
        a: 'Under Section 44AD (Presumptive Taxation), only 6% of your digital income is treated as taxable profit. This means if you earned ₹7.2L, only ₹43,200 is your taxable income — significantly reducing your tax liability.',
    },
    {
        q: 'Can I connect multiple gig platforms?',
        a: 'Yes! GigPay supports Zomato, Swiggy, Ola, Uber, and Dunzo. Your earnings from all platforms are aggregated for a complete financial picture.',
    },
    {
        q: 'Is my data safe?',
        a: 'Absolutely. We use bank-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. SMS parsing happens on your device, and we never access personal messages — only bank transaction alerts.',
    },
    {
        q: 'What happens if a cashout fails?',
        a: 'Failed cashouts are automatically refunded to your GigPay wallet within 5 minutes. If the issue persists, contact our support team.',
    },
];

const Support = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);
    const [openFaq, setOpenFaq] = useState(null);
    const [issueText, setIssueText] = useState('');
    const [issueSubmitted, setIssueSubmitted] = useState(false);

    useEffect(() => { setActiveTab('profile'); }, [setActiveTab]);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleSubmitIssue = (e) => {
        e.preventDefault();
        if (!issueText.trim()) return;
        // TODO: Call support API
        setIssueSubmitted(true);
        setIssueText('');
        setTimeout(() => setIssueSubmitted(false), 3000);
    };

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Help & Support</h1>
            </div>

            {/* Quick contact */}
            <div className="grid grid-cols-2 gap-3">
                <a
                    href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20GigPay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card flex flex-col items-center gap-2 py-4 transition-all active:scale-[0.98]"
                >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageCircle size={22} className="text-green-600" />
                    </div>
                    <p className="text-body-md font-semibold text-gigpay-navy">WhatsApp</p>
                    <p className="text-caption text-gigpay-text-muted">Chat with us</p>
                </a>

                <a
                    href="mailto:support@gigpay.in"
                    className="card flex flex-col items-center gap-2 py-4 transition-all active:scale-[0.98]"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail size={22} className="text-blue-600" />
                    </div>
                    <p className="text-body-md font-semibold text-gigpay-navy">Email</p>
                    <p className="text-caption text-gigpay-text-muted">support@gigpay.in</p>
                </a>
            </div>

            {/* FAQ accordion */}
            <div>
                <h3 className="text-heading-md mb-3">❓ Frequently Asked Questions</h3>
                <div className="flex flex-col gap-2">
                    {FAQ_ITEMS.map((item, idx) => (
                        <div key={idx} className="card py-0 overflow-hidden">
                            <button
                                onClick={() => toggleFaq(idx)}
                                className="w-full flex items-center justify-between py-3.5 text-left"
                            >
                                <span className="text-body-md font-semibold text-gigpay-navy pr-2">
                                    {item.q}
                                </span>
                                {openFaq === idx ? (
                                    <ChevronUp size={18} className="text-gigpay-text-muted flex-shrink-0" />
                                ) : (
                                    <ChevronDown size={18} className="text-gigpay-text-muted flex-shrink-0" />
                                )}
                            </button>
                            {openFaq === idx && (
                                <div className="pb-3.5 border-t border-gigpay-border/50 pt-3 animate-fade-in">
                                    <p className="text-body-md text-gigpay-text-secondary">{item.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Report issue form */}
            <div>
                <h3 className="text-heading-md mb-3">🐛 Report an Issue</h3>
                {issueSubmitted ? (
                    <div className="card bg-green-50 border-green-200 text-center">
                        <span className="text-3xl block mb-2">✅</span>
                        <p className="text-body-md font-semibold text-green-700">
                            Issue reported! We'll get back to you within 24 hours.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitIssue} className="card">
                        <textarea
                            value={issueText}
                            onChange={(e) => setIssueText(e.target.value)}
                            placeholder="Describe your issue in detail..."
                            rows={4}
                            className="input h-auto resize-none mb-3"
                            required
                        />
                        <button type="submit" className="btn-primary w-full">
                            <AlertCircle size={16} className="inline mr-1.5" />
                            Submit Report
                        </button>
                    </form>
                )}
            </div>

            {/* App info */}
            <div className="card bg-gigpay-surface text-center py-3">
                <p className="text-caption text-gigpay-text-muted">
                    GigPay v1.0.0 • Built with ❤️ for India's gig workers
                </p>
                <p className="text-caption text-gigpay-text-muted mt-0.5">
                    © 2026 GigPay Financial OS
                </p>
            </div>
        </div>
    );
};

export default Support;

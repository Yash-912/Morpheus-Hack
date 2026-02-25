import { useState } from 'react';
import { getPlatform, getAllPlatformIds } from '../../constants/platforms';

/**
 * EarningEntry — Manual earnings entry form.
 *
 * @param {object} props
 * @param {Function} props.onSubmit — Called with { platform, amount, hoursWorked, tripsCount, date }
 * @param {boolean} [props.isLoading]
 */
const EarningEntry = ({ onSubmit, isLoading = false }) => {
    const [platform, setPlatform] = useState('');
    const [amount, setAmount] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [tripsCount, setTripsCount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!platform || !amount) return;

        onSubmit({
            platform,
            totalAmount: Math.round(parseFloat(amount) * 100), // Convert ₹ to paise
            hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
            tripsCount: tripsCount ? parseInt(tripsCount, 10) : null,
            date,
        });

        // Reset
        setAmount('');
        setHoursWorked('');
        setTripsCount('');
    };

    const platforms = getAllPlatformIds();

    return (
        <form onSubmit={handleSubmit} className="card">
            <h3 className="text-heading-md mb-4">Add Earning</h3>

            {/* Platform selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {platforms.map((id) => {
                    const p = getPlatform(id);
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setPlatform(id)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-[1.5px] transition-all duration-75 ${platform === id
                                    ? 'border-gigpay-navy bg-[#C8F135]/20 shadow-[2px_2px_0px_#0D1B3E]'
                                    : 'border-gigpay-border bg-white'
                                }`}
                        >
                            <span className="text-xl">{p.icon}</span>
                            <span className="text-caption font-medium">{p.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Amount */}
            <div className="mb-3">
                <label className="text-label text-gigpay-text-secondary mb-1 block">Amount (₹)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 850"
                    className="input"
                    min="0"
                    step="0.01"
                    required
                />
            </div>

            {/* Hours + Trips row */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-label text-gigpay-text-secondary mb-1 block">Hours</label>
                    <input
                        type="number"
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(e.target.value)}
                        placeholder="e.g., 8"
                        className="input"
                        min="0"
                        step="0.5"
                    />
                </div>
                <div>
                    <label className="text-label text-gigpay-text-secondary mb-1 block">Trips</label>
                    <input
                        type="number"
                        value={tripsCount}
                        onChange={(e) => setTripsCount(e.target.value)}
                        placeholder="e.g., 15"
                        className="input"
                        min="0"
                    />
                </div>
            </div>

            {/* Date */}
            <div className="mb-4">
                <label className="text-label text-gigpay-text-secondary mb-1 block">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            <button
                type="submit"
                disabled={!platform || !amount || isLoading}
                className="btn-primary w-full"
            >
                {isLoading ? 'Saving...' : 'Add Earning'}
            </button>
        </form>
    );
};

export default EarningEntry;

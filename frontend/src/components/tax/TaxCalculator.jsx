import { useState } from 'react';
import { compareRegimes, calculateTax, PRESUMPTIVE_44AD } from '../../constants/taxRules';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * TaxCalculator — Interactive regime comparison calculator.
 * User inputs income + expenses → see both regime taxes → get recommendation.
 */
const TaxCalculator = () => {
    const [grossIncome, setGrossIncome] = useState('');
    const [totalExpenses, setTotalExpenses] = useState('');
    const [deductions80C, setDeductions80C] = useState('');
    const [usePresumptive, setUsePresumptive] = useState(true);
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const income = parseFloat(grossIncome) || 0;
        const expenses = parseFloat(totalExpenses) || 0;
        const ded80C = parseFloat(deductions80C) || 0;

        let taxableIncome = income;
        if (usePresumptive) {
            taxableIncome = income * PRESUMPTIVE_44AD.digitalIncomeRate;
        } else {
            taxableIncome = Math.max(0, income - expenses);
        }

        const comparison = compareRegimes(taxableIncome, ded80C);
        setResult({ ...comparison, taxableIncome, grossIncome: income });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="card">
                <h3 className="text-heading-md mb-4">🧮 Tax Calculator</h3>

                {/* Gross income */}
                <div className="mb-3">
                    <label className="text-label text-gigpay-text-secondary mb-1 block">
                        Annual Gross Income (₹)
                    </label>
                    <input
                        type="number"
                        value={grossIncome}
                        onChange={(e) => setGrossIncome(e.target.value)}
                        placeholder="e.g., 720000"
                        className="input"
                        min="0"
                    />
                </div>

                {/* Presumptive toggle */}
                <div className="mb-3 p-3 bg-gigpay-surface rounded-xl border border-gigpay-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-body-md font-semibold text-gigpay-navy">Section 44AD</p>
                            <p className="text-caption text-gigpay-text-muted">
                                Only 6% of digital income is taxable
                            </p>
                        </div>
                        <button
                            onClick={() => setUsePresumptive(!usePresumptive)}
                            className={`relative w-12 h-7 rounded-full border-2 transition-all duration-200 ${usePresumptive
                                    ? 'bg-[#C8F135] border-gigpay-navy'
                                    : 'bg-gray-200 border-gray-300'
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-[1.5px] transition-all duration-200 ${usePresumptive ? 'left-[22px] border-gigpay-navy' : 'left-0.5 border-gray-300'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Expenses (only if not presumptive) */}
                {!usePresumptive && (
                    <div className="mb-3">
                        <label className="text-label text-gigpay-text-secondary mb-1 block">
                            Total Business Expenses (₹)
                        </label>
                        <input
                            type="number"
                            value={totalExpenses}
                            onChange={(e) => setTotalExpenses(e.target.value)}
                            placeholder="e.g., 180000"
                            className="input"
                            min="0"
                        />
                    </div>
                )}

                {/* 80C deductions */}
                <div className="mb-4">
                    <label className="text-label text-gigpay-text-secondary mb-1 block">
                        Section 80C Deductions (₹)
                    </label>
                    <input
                        type="number"
                        value={deductions80C}
                        onChange={(e) => setDeductions80C(e.target.value)}
                        placeholder="e.g., 150000 (max ₹1.5L)"
                        className="input"
                        min="0"
                        max="150000"
                    />
                    <p className="text-caption text-gigpay-text-muted mt-1">
                        PPF, ELSS, LIC, etc. (only applicable in old regime)
                    </p>
                </div>

                <button
                    onClick={handleCalculate}
                    disabled={!grossIncome}
                    className="btn-primary w-full"
                >
                    Calculate Tax
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="animate-fade-in flex flex-col gap-3">
                    {/* Regime comparison */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`card text-center ${result.recommended === 'new' ? 'border-[#C8F135] shadow-[4px_4px_0px_#C8F135]' : ''
                            }`}>
                            {result.recommended === 'new' && (
                                <span className="badge badge-success mb-2 inline-flex">✅ Recommended</span>
                            )}
                            <p className="text-label text-gigpay-text-secondary">New Regime</p>
                            <p className="text-heading-lg font-bold text-gigpay-navy mt-1">
                                ₹{result.newRegime.totalTax.toLocaleString('en-IN')}
                            </p>
                            <p className="text-caption text-gigpay-text-muted mt-1">
                                Taxable: ₹{result.newRegime.taxableIncome.toLocaleString('en-IN')}
                            </p>
                        </div>

                        <div className={`card text-center ${result.recommended === 'old' ? 'border-[#C8F135] shadow-[4px_4px_0px_#C8F135]' : ''
                            }`}>
                            {result.recommended === 'old' && (
                                <span className="badge badge-success mb-2 inline-flex">✅ Recommended</span>
                            )}
                            <p className="text-label text-gigpay-text-secondary">Old Regime</p>
                            <p className="text-heading-lg font-bold text-gigpay-navy mt-1">
                                ₹{result.oldRegime.totalTax.toLocaleString('en-IN')}
                            </p>
                            <p className="text-caption text-gigpay-text-muted mt-1">
                                Taxable: ₹{result.oldRegime.taxableIncome.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Savings banner */}
                    {result.savings > 0 && (
                        <div className="card bg-green-50 border-green-200 text-center">
                            <p className="text-body-md text-green-700">
                                💰 You save <strong>₹{result.savings.toLocaleString('en-IN')}</strong> with the {result.recommended} regime
                            </p>
                        </div>
                    )}

                    {/* Presumptive info */}
                    {usePresumptive && (
                        <div className="card bg-blue-50 border-blue-200">
                            <p className="text-body-md text-blue-700">
                                📋 Under Section 44AD, only <strong>₹{Math.round(result.grossIncome * PRESUMPTIVE_44AD.digitalIncomeRate).toLocaleString('en-IN')}</strong> (6% of ₹{result.grossIncome.toLocaleString('en-IN')}) is treated as taxable profit.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaxCalculator;

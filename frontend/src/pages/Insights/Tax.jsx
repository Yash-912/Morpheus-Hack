import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import TaxSummary from '../../components/financial/TaxSummary';
import DeductionList from '../../components/tax/DeductionList';
import TaxCalculator from '../../components/tax/TaxCalculator';
import { ArrowLeft } from 'lucide-react';
import { getCurrentFY, ADVANCE_TAX_DATES } from '../../constants/taxRules';
import { formatDateIST } from '../../utils/formatDate';

const TAB_KEYS = ['summary', 'deductions', 'calculator'];

const Tax = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);
    const [tab, setTab] = useState('summary');
    const fy = getCurrentFY();

    useEffect(() => { setActiveTab('insights'); }, [setActiveTab]);

    // Demo data — replace with API calls
    const demoIncome = 72000000; // ₹7.2L in paise
    const demoExpenses = 18000000; // ₹1.8L in paise
    const demoDeductions = 15000000; // ₹1.5L in paise (80C)

    const deductions = [
        { category: 'fuel', label: 'Fuel & Petrol', amount: 4500000, isDeductible: true },
        { category: 'toll', label: 'Toll & FASTag', amount: 1200000, isDeductible: true },
        { category: 'maintenance', label: 'Vehicle Maintenance', amount: 800000, isDeductible: true },
        { category: 'mobile_recharge', label: 'Mobile Recharge', amount: 500000, isDeductible: true },
        { category: 'section_80c', label: 'Section 80C (ELSS)', amount: 5000000, isDeductible: true },
        { category: 'food', label: 'Food & Meals', amount: 6000000, isDeductible: false },
    ];

    // Next advance tax date
    const now = new Date();
    const currentMonth = now.getMonth();
    const nextAdvanceTax = ADVANCE_TAX_DATES.find((d) => {
        const monthMap = { 'June': 5, 'September': 8, 'December': 11, 'March': 2 };
        const parts = d.date.split(' ');
        const month = monthMap[parts[0]];
        return month >= currentMonth;
    });

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Tax Assistant</h1>
                <span className="badge badge-info">{fy}</span>
            </div>

            {/* Advance tax alert */}
            {nextAdvanceTax && (
                <div className="p-3 bg-yellow-50 border-[1.5px] border-yellow-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⏰</span>
                        <div>
                            <p className="text-body-md font-semibold text-yellow-800">
                                Next Advance Tax: {nextAdvanceTax.date}
                            </p>
                            <p className="text-caption text-yellow-700">
                                {nextAdvanceTax.description} — {nextAdvanceTax.percent}% of estimated tax
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gigpay-surface rounded-xl p-1 border-[1.5px] border-gigpay-border">
                {TAB_KEYS.map((key) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 py-2.5 rounded-lg text-body-md font-semibold capitalize transition-all duration-150 ${tab === key
                                ? 'bg-white text-gigpay-navy shadow-sm border-[1px] border-gigpay-border'
                                : 'text-gigpay-text-secondary'
                            }`}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* Summary Tab */}
            {tab === 'summary' && (
                <div className="flex flex-col gap-4">
                    <TaxSummary
                        totalIncome={demoIncome}
                        totalExpenses={demoExpenses}
                        totalDeductions={demoDeductions}
                        isPresumptive={true}
                    />

                    {/* ClearTax CTA */}
                    <div className="card bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] border-blue-200 text-center">
                        <span className="text-3xl block mb-2">📄</span>
                        <h3 className="text-heading-md text-gigpay-navy mb-1">File Your ITR</h3>
                        <p className="text-body-md text-gigpay-text-secondary mb-3">
                            Powered by ClearTax. Auto-fill your income and deductions.
                        </p>
                        <button className="btn-primary w-full">
                            Start Filing →
                        </button>
                    </div>
                </div>
            )}

            {/* Deductions Tab */}
            {tab === 'deductions' && (
                <DeductionList deductions={deductions} />
            )}

            {/* Calculator Tab */}
            {tab === 'calculator' && (
                <TaxCalculator />
            )}
        </div>
    );
};

export default Tax;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavings } from '../hooks/useSavings';
import { usePayouts } from '../hooks/usePayouts';
import { Card, ActionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Plus, Target, PiggyBank, Briefcase } from 'lucide-react';

const Savings = () => {
    const navigate = useNavigate();
    const { goals, isLoading, createGoal, toggleAutoSave, deposit, isDepositing } = useSavings();
    const { balance } = usePayouts();

    const [isCreating, setIsCreating] = useState(false);
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalAutoSave, setNewGoalAutoSave] = useState(5); // %

    const totalSaved = goals?.reduce((acc, g) => acc + (g.currentAmount || 0), 0) / 100 || 0;

    const handleCreate = async (e) => {
        e.preventDefault();
        await createGoal({
            name: newGoalName,
            targetAmount: Number(newGoalTarget) * 100,
            autoSavePercent: newGoalAutoSave
        });
        setIsCreating(false);
        setNewGoalName('');
        setNewGoalTarget('');
    };

    const handleQuickDeposit = async (goalId, amount) => {
        await deposit({ goalId, amount: amount * 100 });
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            <header className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gigpay-surface transition-colors">
                    <ArrowLeft size={20} className="text-gigpay-navy" />
                </button>
                <div className="flex-1">
                    <h1 className="text-heading-lg font-syne font-bold text-gigpay-navy">Savings</h1>
                </div>
            </header>

            {/* Total Savings Overview */}
            <Card className="bg-gigpay-navy text-white text-center py-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gigpay-lime opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 opacity-20 rounded-full blur-2xl"></div>

                <PiggyBank size={32} className="mx-auto text-gigpay-lime mb-3" />
                <p className="text-body-sm text-white/80 mb-1">Total Safely Stashed</p>
                <h2 className="text-display-md font-bold text-white mb-2">₹{totalSaved.toLocaleString()}</h2>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full mt-2">
                    <Briefcase size={14} className="text-gigpay-lime" />
                    <span className="text-xs font-medium">Yielding 8% p.a in Liquid Funds</span>
                </div>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-heading-md text-gigpay-navy">Your Goals</h2>
                {!isCreating && (
                    <Button variant="ghost" size="ghost" onClick={() => setIsCreating(true)} className="flex items-center gap-1">
                        <Plus size={16} /> New Goal
                    </Button>
                )}
            </div>

            {isCreating && (
                <Card className="border-gigpay-navy/20 animate-slide-up">
                    <h3 className="text-body-lg font-bold text-gigpay-navy mb-4">Create Savings Goal</h3>
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gigpay-text-secondary">What are you saving for?</label>
                            <input
                                required
                                value={newGoalName} onChange={e => setNewGoalName(e.target.value)}
                                placeholder="e.g., New Bike Service"
                                className="p-2 border-2 border-gigpay-border rounded-md focus:border-gigpay-navy focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gigpay-text-secondary">Target Amount (₹)</label>
                            <input
                                required type="number"
                                value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)}
                                placeholder="5000"
                                className="p-2 border-2 border-gigpay-border rounded-md focus:border-gigpay-navy focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gigpay-text-secondary">Auto-Save per Payout</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range" min="0" max="25" step="1"
                                    value={newGoalAutoSave} onChange={e => setNewGoalAutoSave(Number(e.target.value))}
                                    className="flex-1 accent-gigpay-navy"
                                />
                                <span className="font-bold text-gigpay-navy w-10 text-right">{newGoalAutoSave}%</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Create</Button>
                        </div>
                    </form>
                </Card>
            )}

            {isLoading ? (
                <div className="p-8 text-center text-gigpay-text-muted">Loading your goals...</div>
            ) : goals?.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {goals.map(goal => {
                        const target = goal.targetAmount / 100;
                        const current = goal.currentAmount / 100;

                        return (
                            <Card key={goal.id} className="flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Target size={16} />
                                        </div>
                                        <h3 className="text-body-md font-bold text-gigpay-navy">{goal.name}</h3>
                                    </div>
                                    <span className="font-bold text-gigpay-navy bg-[#E2E8F0] px-2 py-1 rounded-md text-sm">
                                        ₹{current} / ₹{target}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="bg-gigpay-navy h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                    ></div>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gigpay-border">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gigpay-text-secondary mb-1">Auto-Save</span>
                                        <div className="flex items-center gap-2">
                                            {/* For hackathon, using simple checkbox, headlessui Switch is better if installed */}
                                            <input
                                                type="checkbox"
                                                checked={goal.autoSaveEnabled}
                                                onChange={() => toggleAutoSave(goal.id)}
                                                className="w-4 h-4 accent-gigpay-navy"
                                            />
                                            <span className="text-xs text-gigpay-navy">{goal.autoSavePercent}% per payout</span>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleQuickDeposit(goal.id, 100)}
                                        disabled={isDepositing || ((balance?.walletBalance || 0) < 10000)} // 10000 paise = 100 Rs
                                    >
                                        + ₹100
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : !isCreating && (
                <Card className="border-dashed bg-transparent p-6 text-center">
                    <p className="text-body-md text-gigpay-text-secondary mb-4">You haven't set up any savings goals yet. Start micro-saving effortlessly.</p>
                    <Button onClick={() => setIsCreating(true)}>Create First Goal</Button>
                </Card>
            )}
        </div>
    );
};

export default Savings;

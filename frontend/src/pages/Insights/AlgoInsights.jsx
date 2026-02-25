import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/ui.store';
import InsightsFeed from '../../components/community/InsightsFeed';
import EmptyState from '../../components/shared/EmptyState';
import { ArrowLeft, Plus } from 'lucide-react';
import { getPlatform, getAllPlatformIds } from '../../constants/platforms';

const AlgoInsights = () => {
    const navigate = useNavigate();
    const setActiveTab = useUIStore((s) => s.setActiveTab);
    const [platformFilter, setPlatformFilter] = useState('all');
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportPattern, setReportPattern] = useState('');
    const [reportPlatform, setReportPlatform] = useState('');
    const [reportCity, setReportCity] = useState('');

    useEffect(() => { setActiveTab('insights'); }, [setActiveTab]);

    // Demo insights — replace with useQuery when wired
    const [insights] = useState([
        {
            id: '1',
            type: 'surge',
            title: 'Lunch surge starting 15 mins early',
            description: 'Zomato algorithms are now triggering lunch surge at 11:45 AM instead of 12 PM in HSR Layout.',
            platform: 'Zomato',
            city: 'Bengaluru',
            upvotes: 47,
            validUntil: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
            id: '2',
            type: 'incentive',
            title: 'Weekend bonus boost detected',
            description: 'Swiggy offering ₹50 extra per order after 8 PM on Saturdays in Koramangala area.',
            platform: 'Swiggy',
            city: 'Bengaluru',
            upvotes: 32,
            createdAt: new Date(Date.now() - 14400000).toISOString(),
        },
        {
            id: '3',
            type: 'algorithm_change',
            title: 'Ola changed dispatch radius',
            description: 'Dispatch radius reduced from 5 km to 3 km in Electronic City. Shorter trips but quicker pickups.',
            platform: 'Ola',
            city: 'Bengaluru',
            upvotes: 18,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: '4',
            type: 'hot_zone',
            title: 'Airport zone demand spike',
            description: 'High demand at KIA between 6-9 PM due to flight delays. Uber surge up to 2.5x.',
            platform: 'Uber',
            city: 'Bengaluru',
            upvotes: 63,
            validUntil: new Date(Date.now() + 7200000).toISOString(),
            createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
    ]);

    const platforms = getAllPlatformIds();
    const filtered = platformFilter === 'all'
        ? insights
        : insights.filter((i) => i.platform.toLowerCase() === platformFilter);

    const handleUpvote = (id) => {
        // TODO: Call insights.api.upvote(id)
        console.log('Upvote:', id);
    };

    const handleReport = (id) => {
        console.log('Report:', id);
    };

    const handleSubmitPattern = (e) => {
        e.preventDefault();
        // TODO: Call insights.api.reportPattern()
        console.log('Submit pattern:', { reportPattern, reportPlatform, reportCity });
        setShowReportForm(false);
        setReportPattern('');
        setReportPlatform('');
        setReportCity('');
    };

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-heading-lg flex-1">Algo Insights</h1>
                <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="btn-icon bg-[#C8F135] border-gigpay-navy"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Platform filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                <button
                    onClick={() => setPlatformFilter('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-body-md font-semibold border-[1.5px] transition-all duration-75 ${platformFilter === 'all'
                            ? 'bg-gigpay-navy text-white border-gigpay-navy'
                            : 'bg-white border-gigpay-border text-gigpay-text-secondary'
                        }`}
                >
                    All Platforms
                </button>
                {platforms.map((id) => {
                    const p = getPlatform(id);
                    return (
                        <button
                            key={id}
                            onClick={() => setPlatformFilter(id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-body-md font-semibold border-[1.5px] transition-all duration-75 flex items-center gap-1.5 ${platformFilter === id
                                    ? 'text-white border-transparent'
                                    : 'bg-white border-gigpay-border text-gigpay-text-secondary'
                                }`}
                            style={platformFilter === id ? { backgroundColor: p.color } : {}}
                        >
                            <span>{p.icon}</span> {p.name}
                        </button>
                    );
                })}
            </div>

            {/* Report pattern form */}
            {showReportForm && (
                <form onSubmit={handleSubmitPattern} className="card border-[#C8F135] shadow-[4px_4px_0px_#C8F135] animate-fade-in">
                    <h3 className="text-heading-md mb-3">🔍 Report a Pattern</h3>
                    <p className="text-caption text-gigpay-text-secondary mb-3">
                        Spotted an algorithm change? Share it with the community!
                    </p>

                    <div className="mb-3">
                        <input
                            type="text"
                            value={reportPattern}
                            onChange={(e) => setReportPattern(e.target.value)}
                            placeholder="What pattern did you notice?"
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                            value={reportPlatform}
                            onChange={(e) => setReportPlatform(e.target.value)}
                            className="input"
                            required
                        >
                            <option value="">Platform</option>
                            {platforms.map((id) => (
                                <option key={id} value={id}>{getPlatform(id).name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={reportCity}
                            onChange={(e) => setReportCity(e.target.value)}
                            placeholder="City"
                            className="input"
                            required
                        />
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowReportForm(false)} className="btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary flex-1">
                            Share Pattern
                        </button>
                    </div>
                </form>
            )}

            {/* Insights feed */}
            {filtered.length > 0 ? (
                <InsightsFeed
                    insights={filtered}
                    onUpvote={handleUpvote}
                    onReport={handleReport}
                />
            ) : (
                <EmptyState
                    icon="🤖"
                    title="No insights yet"
                    description={`No algorithm insights for ${platformFilter === 'all' ? 'any platform' : getPlatform(platformFilter).name} right now.`}
                    actionLabel="Report Pattern"
                    onAction={() => setShowReportForm(true)}
                />
            )}
        </div>
    );
};

export default AlgoInsights;

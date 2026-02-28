import { useNavigate } from 'react-router-dom';

/**
 * QuickActions — 2×2 grid of shortcut tiles.
 * Links to Emergency Loan, Tax, Savings.
 */
const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            icon: '🆘',
            label: 'Emergency Loan',
            description: 'Up to ₹5,000',
            path: '/loans',
            color: 'bg-red-50 border-red-200',
        },

        {
            icon: '🧾',
            label: 'Tax Assistant',
            description: 'Save on ITR',
            path: '/insights',
            color: 'bg-yellow-50 border-yellow-200',
        },
        {
            icon: '🏦',
            label: 'Savings',
            description: 'Auto round-up',
            path: '/savings',
            color: 'bg-green-50 border-green-200',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
                <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className={`${action.color} border-[1.5px] rounded-2xl p-4 text-left transition-all duration-75 active:scale-[0.97]`}
                >
                    <span className="text-2xl block mb-2">{action.icon}</span>
                    <p className="text-body-md font-bold text-gigpay-navy">{action.label}</p>
                    <p className="text-caption text-gigpay-text-secondary">{action.description}</p>
                </button>
            ))}
        </div>
    );
};

export default QuickActions;

/**
 * WorkerStatusBadge — shows the worker's current GPS-derived status.
 *
 * Props:
 *   status: "idle" | "on_trip" | "walking" | "commuting" | "unknown"
 */

const STATUS_CONFIG = {
    idle: {
        label: 'Waiting for order',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500',
    },
    on_trip: {
        label: 'On delivery',
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-500',
    },
    walking: {
        label: 'Walking',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        dot: 'bg-blue-500',
    },
    commuting: {
        label: 'Heading to zone',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        dot: 'bg-purple-500',
    },
    unknown: {
        label: 'Status unknown',
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        dot: 'bg-gray-400',
    },
};

export default function WorkerStatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                        border-[1.5px] border-gigpay-navy shadow-brutal-sm ${cfg.bg} ${cfg.text}`}
        >
            <span className={`w-2 h-2 rounded-full animate-pulse ${cfg.dot}`} />
            {cfg.label}
        </div>
    );
}

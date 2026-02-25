import { useState } from 'react';
import Avatar from '../shared/Avatar';
import { timeAgo } from '../../utils/formatDate';

/**
 * InsightsFeed — Algorithm insights from the community.
 *
 * @param {object} props
 * @param {Array} props.insights — Array of insight objects
 * @param {Function} [props.onUpvote] — Called with insight ID
 * @param {Function} [props.onReport] — Called with insight ID
 */
const InsightsFeed = ({ insights = [], onUpvote, onReport }) => {
    const typeIcons = {
        surge: '📈',
        incentive: '🎁',
        penalty: '⚠️',
        algorithm_change: '🤖',
        hot_zone: '🔥',
        community: '💬',
    };

    if (insights.length === 0) {
        return (
            <div className="text-center py-8">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="text-body-md text-gigpay-text-secondary">
                    No insights yet. Be the first to share!
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {insights.map((insight) => {
                const icon = typeIcons[insight.type] || '💡';

                return (
                    <div key={insight.id} className="card">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{icon}</span>
                            <div className="flex-1">
                                <p className="text-body-md font-semibold text-gigpay-navy">
                                    {insight.title || insight.pattern}
                                </p>
                                <div className="flex items-center gap-2 text-caption text-gigpay-text-muted">
                                    <span>{insight.platform}</span>
                                    {insight.city && <span>• {insight.city}</span>}
                                    <span>• {timeAgo(insight.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        {insight.description && (
                            <p className="text-body-md text-gigpay-text-secondary mb-3">
                                {insight.description}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onUpvote?.(insight.id)}
                                className="flex items-center gap-1.5 text-caption font-semibold text-gigpay-text-secondary hover:text-gigpay-navy transition-colors"
                            >
                                👍 {insight.upvotes || 0}
                            </button>
                            <button
                                onClick={() => onReport?.(insight.id)}
                                className="text-caption text-gigpay-text-muted"
                            >
                                Report
                            </button>

                            {insight.validUntil && (
                                <span className="text-caption text-gigpay-text-muted ml-auto">
                                    ⏰ Valid until {new Date(insight.validUntil).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'Asia/Kolkata',
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InsightsFeed;

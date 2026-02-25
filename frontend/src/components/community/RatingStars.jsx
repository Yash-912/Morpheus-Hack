import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * RatingStars — Interactive star rating with comment input.
 *
 * @param {object} props
 * @param {Function} props.onSubmit — Called with { rating: number, comment: string }
 * @param {string} [props.workerName] — Name for display
 * @param {boolean} [props.isLoading]
 */
const RatingStars = ({ onSubmit, workerName = 'worker', isLoading = false }) => {
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [comment, setComment] = useState('');

    const ratingLabels = {
        1: 'Poor',
        2: 'Below Average',
        3: 'Average',
        4: 'Good',
        5: 'Excellent',
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit?.({ rating, comment: comment.trim() });
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <h3 className="text-heading-md text-center mb-1">Rate {workerName}</h3>
            <p className="text-body-md text-gigpay-text-secondary text-center mb-4">
                How was the experience?
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoveredStar || rating);
                    return (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setRating(star)}
                            className="transition-transform duration-100 active:scale-125"
                        >
                            <Star
                                size={36}
                                className={`transition-colors duration-150 ${active
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-200 fill-gray-200'
                                    }`}
                            />
                        </button>
                    );
                })}
            </div>

            {/* Rating label */}
            <p className="text-body-md font-semibold text-center mb-4 h-5" style={{
                color: rating >= 4 ? '#22C55E' : rating >= 3 ? '#F59E0B' : rating >= 1 ? '#EF4444' : 'transparent',
            }}>
                {ratingLabels[hoveredStar || rating] || ''}
            </p>

            {/* Comment */}
            <div className="mb-4">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment (optional)..."
                    rows={3}
                    className="input h-auto resize-none"
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={rating === 0 || isLoading}
                className="btn-primary w-full"
            >
                {isLoading ? 'Submitting...' : `Submit Rating${rating > 0 ? ` (${rating}★)` : ''}`}
            </button>
        </form>
    );
};

export default RatingStars;

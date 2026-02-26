// ============================================================
// Date Formatter — IST-aware date/time formatters
// ============================================================

/**
 * Format a date to IST display string.
 * e.g., "23 Feb 2026"
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateIST(date) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

/**
 * Format a date to IST date+time string.
 * e.g., "23 Feb 2026, 2:30 PM"
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateTimeIST(date) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(date));
}

/**
 * Format a date to short time only.
 * e.g., "2:30 PM"
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatTimeIST(date) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(date));
}

/**
 * Get relative time string.
 * e.g., "2 hours ago", "just now", "3 days ago"
 * @param {Date|string|number} date
 * @returns {string}
 */
export function timeAgo(date) {
    const now = Date.now();
    const diffMs = now - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return formatDateIST(date);
}

/**
 * Format date to ISO date string (YYYY-MM-DD) in IST.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function toISODateIST(date) {
    const d = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + istOffset);
    return ist.toISOString().split('T')[0];
}

/**
 * Get greeting based on time of day (IST).
 * @returns {string} "Good morning" | "Good afternoon" | "Good evening"
 */
export function getGreeting() {
    const istHour = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
    });
    const hour = parseInt(istHour, 10);

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

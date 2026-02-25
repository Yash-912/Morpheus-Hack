/**
 * LocationPin — Custom map marker SVG component.
 *
 * @param {object} props
 * @param {string} [props.color] — Hex color
 * @param {number} [props.size] — Size in px
 * @param {string} [props.label] — Text inside pin
 */
const LocationPin = ({ color = '#EF4444', size = 32, label }) => {
    return (
        <svg width={size} height={size * 1.3} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.5"
            />
            {label ? (
                <text
                    x="12"
                    y="14"
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="DM Sans, sans-serif"
                >
                    {label}
                </text>
            ) : (
                <circle cx="12" cy="12" r="4" fill="white" />
            )}
        </svg>
    );
};

export default LocationPin;

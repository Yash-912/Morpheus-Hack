/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gigpay-lime': '#C8F135',
        'gigpay-lime-soft': '#E9FAA0',
        'gigpay-navy': '#0D1B3E',
        'gigpay-navy-mid': '#1A2D5A',
        'gigpay-navy-light': '#2E4A8A',
        'gigpay-surface': '#F7F8F2',
        'gigpay-card': '#FFFFFF',
        'gigpay-border': '#D4D8C8',
        'gigpay-text-primary': '#0D1B3E',
        'gigpay-text-secondary': '#5A6275',
        'gigpay-text-muted': '#9AA0AF',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        zomato: { bg: '#FEE2E2', text: '#EF4444' },
        swiggy: { bg: '#FED7AA', text: '#EA580C' },
        ola: { bg: '#DCFCE7', text: '#16A34A' },
        uber: { bg: '#F1F5F9', text: '#334155' },
        dunzo: { bg: '#EDE9FE', text: '#7C3AED' }
      },
      fontFamily: {
        syne: ['Syne', 'serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
        'dm-mono': ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px #D4D8C8',
        'brutal-sm': '2px 2px 0px #D4D8C8',
        'brutal-lime': '4px 4px 0px #C8F135',
        'brutal-navy': '3px 3px 0px #0D1B3E',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

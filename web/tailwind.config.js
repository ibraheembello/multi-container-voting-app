/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0a0a12',
        surface: 'rgba(255,255,255,0.04)',
        line: 'rgba(255,255,255,0.08)',
      },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-30px,0) scale(1.08)' },
        },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

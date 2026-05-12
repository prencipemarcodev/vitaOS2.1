/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: 'rgb(180, 98, 67)',
        'primary-light': 'rgb(210, 140, 110)',
        'primary-dark': 'rgb(140, 65, 40)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 300ms ease-out forwards',
        'scale-in': 'scaleIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(0.85)' },
        },
      },
    },
  },
  plugins: [],
}

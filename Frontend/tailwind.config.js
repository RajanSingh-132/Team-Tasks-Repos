/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef0fd',
          100: '#dce0fb',
          200: '#b9c1f7',
          300: '#96a2f3',
          400: '#7383ef',
          500: '#5b71f0',
          600: '#4757d0',
          700: '#3540a8',
          800: '#242c80',
          900: '#141858',
          950: '#0a0d30',
        },
        surface: {
          light: '#f8f9fb',
          dark:  '#0f1117',
        },
      },
      boxShadow: {
        card:        '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-dark': '0 1px 3px 0 rgba(0,0,0,0.3)',
        glow:        '0 0 20px rgba(91,113,240,0.3)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'slide-down':'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

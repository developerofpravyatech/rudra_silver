/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#080a0d',
          surface: '#0f1217',
          card: '#12161f',
          cardHover: '#161b24',
          cardElevated: '#19202c',
          border: 'rgba(255, 255, 255, 0.08)',
          borderGold: 'rgba(212, 175, 55, 0.25)',
        },
        gold: {
          50: '#fdfbf2',
          100: '#faf5de',
          200: '#f5e8b3',
          300: '#f0d984',
          400: '#e5c05d',
          500: '#d4af37',
          600: '#ba9529',
          700: '#94731c',
          800: '#755816',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Cinzel"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.25)',
        'gold-active': '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(212, 175, 55, 0.12)',
        'card-dark': '0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}

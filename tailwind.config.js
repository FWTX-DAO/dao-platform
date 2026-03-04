const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Adelle Sans', ...defaultTheme.fontFamily.sans],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        'privy-navy': '#160B45',
        'privy-light-blue': '#EFF1FD',
        'privy-blueish': '#D4D9FC',
        'privy-pink': '#FF8271',
        'dao': {
          charcoal: '#0a0d11',
          dark: '#12161d',
          surface: '#1a1f29',
          border: '#252b37',
          gold: '#c4963a',
          'gold-light': '#dbb06b',
          'gold-muted': '#8b7448',
          warm: '#f4efe8',
          cool: '#8b9bb0',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

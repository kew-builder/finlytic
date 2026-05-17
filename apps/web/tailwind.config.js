/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#0d0d1f',
          800: '#11112b',
          700: '#161633',
          600: '#1c1c40',
        },
        violet: {
          500: '#7c6df0',
          600: '#6b5ce7',
        }
      }
    },
  },
  plugins: [],
};


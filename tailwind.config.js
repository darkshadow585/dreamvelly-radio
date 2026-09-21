/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hindi: ['"Yatra One"', 'sans-serif'],
        teko: ['"Teko"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        salon: {
          dark: '#0e0b08',
          card: 'rgba(28, 21, 17, 0.75)',
          amber: '#eab308',
          warm: '#ff8a3d'
        }
      },
      boxShadow: {
        'coverflow': '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 140, 50, 0.15)',
        'dock': '0 10px 40px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }
    },
  },
  plugins: [],
}

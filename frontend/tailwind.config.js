/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0F172A', // Dark Navy/Charcoal
          hover: '#1E293B',
          active: '#1E3A8A',
        },
        canvas: '#F8FAFC',
        accent: '#F97316',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d5c4a',
          hover: '#094033',
          light: '#e6f3f0',
        },
        teal: {
          DEFAULT: '#0d9488',
          light: '#ccfbf1',
          dark: '#115e59',
        },
        risk: {
          low: '#10b981',
          moderate: '#f59e0b',
          high: '#ea580c',
          critical: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}

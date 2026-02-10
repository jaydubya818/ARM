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
        arm: {
          navy: '#1B2A4A',
          blue: '#2B5797',
          accent: '#4472C4',
          surface: '#0F1629',
          surfaceLight: '#1A2340',
          border: '#2A3654',
          text: '#E2E8F0',
          textMuted: '#94A3B8',
          success: '#548235',
          warning: '#BF8F00',
          danger: '#C00000'
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#16865B',
          dark: '#116B49',
          light: '#E8F5EE',
          bg: '#F8FAF9',
          surface: '#FFFFFF',
          text: '#172B24',
          muted: '#718078',
          border: '#E4EBE6',
          bubble: '#DCFCE7',
          emergency: '#DC2626',
          emergencyBg: '#FEF2F2',
          emergencyBorder: '#FECACA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          DEFAULT: '#556B2F',
          dark: '#3F5023',
          light: '#6B8243',
          subtle: '#E7EBD9',
          soft: '#F0F2E8',
        },
        charcoal: {
          DEFAULT: '#263238',
          muted: '#60706A',
          dark: '#1A2226',
        },
        gold: {
          DEFAULT: '#C59D5F',
          dark: '#A98448',
          light: '#D8B57E',
        },
        forest: {
          DEFAULT: '#556B2F',
          dark: '#3F5023',
          light: '#6B8243',
          subtle: '#E7EBD9',
          deep: '#3F5023',
        },
        cream: {
          DEFAULT: '#F5F3EA',
          card: '#FFFFFF',
          darker: '#EAE7DA',
        },
        navy: {
          DEFAULT: '#263238',
          800: '#263238',
          850: '#1E282D',
          900: '#172024',
          muted: '#60706A',
        },
        saffron: {
          DEFAULT: '#C59D5F',
          50: '#FAF6EE',
          100: '#F5EDDD',
          200: '#EBDCB9',
          300: '#E0CB95',
          400: '#D3B67A',
          500: '#C59D5F',
          600: '#B08849',
          700: '#946E35',
        },
        rural: {
          border: '#D9DED0',
          muted: '#60706A',
          success: '#556B2F',
          warning: '#C59D5F',
          error: '#B84A3A',
          info: '#607D8B',
        },
        'soft-green': '#E7EBD9',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'truck-drive': 'truckDrive 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        truckDrive: {
          '0%, 100%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(4px)' },
        }
      }
    },
  },
  plugins: [],
}

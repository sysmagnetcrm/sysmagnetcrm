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
          brand: {
            black: '#1F1C19',
            orange: '#FE911E',
            white: '#F0F0F0',
            grey: '#808080',
            yellow: '#EAC23F',
          },
          primary: {
            50: '#fff8ed',
            100: '#ffefd5',
            200: '#fedbb0',
            300: '#fdbf8b',
            400: '#fc9e5b',
            500: '#FE911E', // Brand Orange
            600: '#e0760d',
            700: '#ba5a09',
            800: '#95460e',
            900: '#793a0f',
            DEFAULT: '#FE911E',
          },
          secondary: {
            DEFAULT: '#808080', // Brand Grey
            50: '#f2f2f2',
            100: '#e6e6e6',
            200: '#cccccc',
            300: '#b3b3b3',
            400: '#999999',
            500: '#808080',
            600: '#666666',
            700: '#4d4d4d',
            800: '#333333',
            900: '#1a1a1a',
          },
          dark: {
            DEFAULT: '#1F1C19', // Brand Black
            50: '#f4f4f4',
            100: '#e8e8e8',
            200: '#d1d1d1',
            300: '#b9b9b9',
            400: '#a2a2a2',
            500: '#8b8b8b',
            600: '#747474',
            700: '#5d5d5d',
            800: '#464646',
            900: '#1F1C19',
          }
        },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

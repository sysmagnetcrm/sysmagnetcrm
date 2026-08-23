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
          bg: '#F8F9FB',
          surface: '#FFFFFF',
          text: '#111827',
          secondary: '#667085',
          muted: '#98A2B3',
          border: '#E4E7EC',
          orange: '#FF8A1F',
          orangeHover: '#EA7712',
          activeBg: '#FFF4E8',
          activeText: '#D96F0B',
          success: '#12B76A',
          successBg: '#F6FEF9',
          warning: '#F79009',
          warningBg: '#FFFAEB',
          danger: '#F04438',
          dangerBg: '#FEF3F2',
          info: '#3B82F6',
          infoBg: '#EFF8FF',
        },
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF8A1F', // Primary Brand Accent
          600: '#EA7712', // Primary Hover
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#FF8A1F',
        },
      },
      borderRadius: {
        'input': '8px',
        'btn': '8px',
        'dropdown': '10px',
        'card': '12px',
        'drawer': '16px',
        'modal': '16px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'dropdown': '0 4px 6px -1px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.05)',
        'modal': '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 8px 10px -6px rgba(16, 24, 40, 0.05)',
      },
    },
  },
  plugins: [],
}

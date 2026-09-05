/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f6f5',
          100: '#e7e7e4',
          200: '#d1d1cc',
          300: '#a8a8a0',
          400: '#7a7a72',
          500: '#5c5c54',
          600: '#44443e',
          700: '#33332e',
          800: '#222220',
          900: '#161614',
          950: '#0c0c0b',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f6ba77',
          400: '#f1923f',
          500: '#ed761c',
          600: '#de5d0f',
          700: '#b8460f',
          800: '#933814',
          900: '#773013',
        },
        sage: {
          50: '#f3f7f4',
          100: '#e3ece6',
          200: '#c7d9cf',
          300: '#9fbeb0',
          400: '#739d87',
          500: '#54806b',
          600: '#3f674f',
          700: '#345342',
          800: '#2c4336',
          900: '#25382d',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deloitte brand colors
        'deloitte': {
          'green': '#86BC25',
          'dark': '#000000',
          'charcoal': '#1A1A1A',
          'gray': {
            50: '#F7F7F7',
            100: '#EEEEEE',
            200: '#D0D0CE',
            300: '#BBBCBC',
            400: '#97999B',
            500: '#75787B',
            600: '#53565A',
            700: '#333333',
            800: '#1A1A1A',
            900: '#0D0D0D',
          },
          'blue': '#0076A8',
          'teal': '#00A3AD',
          'cyan': '#00ABAB',
        },
        // App accent colors
        'accent': {
          'primary': '#86BC25',
          'secondary': '#0076A8',
          'danger': '#DA291C',
          'warning': '#ED8B00',
          'success': '#43B02A',
          'info': '#00A3AD',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

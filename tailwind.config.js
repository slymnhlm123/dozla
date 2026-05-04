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
          50: '#eefbf4',
          100: '#d6f5e3',
          200: '#b0eacc',
          300: '#7ddaae',
          400: '#48c48c',
          500: '#26a96c',
          600: '#1a8a58',
          700: '#166e48',
          800: '#15573b',
          900: '#134832',
          950: '#06281c',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.15)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.15)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.15)',
        'glow-brand': '0 0 30px rgba(38, 169, 108, 0.2)',
      },
      animation: {
        'gradient-x': 'gradient-x 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

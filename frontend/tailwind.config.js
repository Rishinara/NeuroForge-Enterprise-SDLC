/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        surface: {
          light: '#F8FAFC',
          dark: '#0B1220',
        },
        panel: {
          light: '#FFFFFF',
          dark: '#111A2E',
        },
        ink: {
          light: '#0F172A',
          dark: '#E5EAF5',
        },
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 4px 24px -6px rgba(15, 23, 42, 0.06)',
        'soft-dark': '0 2px 8px -2px rgba(0, 0, 0, 0.4), 0 4px 24px -6px rgba(0, 0, 0, 0.3)',
        glow: '0 0 0 4px rgba(249, 115, 22, 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgba(249, 115, 22, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(249, 115, 22, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2s infinite',
        shimmer: 'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [],
};

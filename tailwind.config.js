/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        romantic: {
          primary: '#2C73D2',     // Deep blue
          secondary: '#00A8CC',   // Bright teal
          accent: '#008F7A',      // Dark teal
          dark: '#0F172A',        // Very dark blue
          card: '#1E293B',        // Dark slate
          light: '#E2E8F0',       // Light gray
          muted: '#64748B',       // Muted blue-gray
        },
      },
      scale: {
        '102': '1.02',
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(44, 115, 210, 0.3)',
      },
    },
  },
  plugins: [],
};
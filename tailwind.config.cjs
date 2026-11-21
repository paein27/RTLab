// Paleta basada en el logo de Radio Transients Lab (RTL).
// Usa `brand-*` en lugar de `blue-*` para mantener una estética coherente.
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6fb',
          100: '#e4eaf5',
          200: '#c9d5eb',
          300: '#a0b5dc',
          400: '#6f8fd0',
          500: '#5072b8',
          600: '#3d5a99',
          700: '#31497d',
          800: '#253660',
          900: '#1b2540',
          950: '#111829',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

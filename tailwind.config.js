/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta de marca tomada de los mockups (botones #659A49).
        // Sobrescribe `green` para que toda la app use el mismo verde.
        green: {
          50:  '#F3F8EF',
          100: '#E4EFDB',
          200: '#C9E0B7',
          300: '#A8CD8C',
          400: '#88B867',
          500: '#73A855',
          600: '#659A49',
          700: '#557F3E',
          800: '#466934',
          900: '#35502A',
        },
        lime:  '#93D66B',
        sand:  '#EFEBE5',
        ink:   '#141414',
        field: '#E9EEF6',
        cal: {
          base:   '#DADADA',
          today:  '#7DBEFF',
          dark:   '#4A4A4A',
          yellow: '#F3BE2A',
          indigo: '#5257CF',
        },
      },
    },
  },
  plugins: [],
};

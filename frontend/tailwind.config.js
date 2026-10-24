/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        snack: {
          50: '#fdf8f6',
          100: '#f6ece6',
          200: '#eddcd4',
          300: '#e0a96d',
          400: '#a3634e',
          500: '#7a4233',
          600: '#633427',
          700: '#50291e',
          800: '#3c1d15',
          900: '#26120c',
          950: '#190a06'
        },
        cream: {
          50: '#fffdf9',
          100: '#fbf7ee',
          200: '#f5edd8',
          300: '#ede0bf'
        }
      }
    },
  },
  plugins: [],
}

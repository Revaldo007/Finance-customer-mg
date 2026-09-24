/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3763f4',
          600: '#2a4fd6',
          700: '#233fb0',
        },
      },
    },
  },
  plugins: [],
}

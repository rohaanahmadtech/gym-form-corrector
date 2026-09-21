/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT:'#22c55e', 50:'#f0fdf4', 100:'#dcfce7',
                 500:'#22c55e', 600:'#16a34a', 700:'#15803d' },
      },
      fontFamily: { sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','system-ui','sans-serif'] },
    },
  },
  plugins: [],
}
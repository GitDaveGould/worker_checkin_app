/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tablet-optimized spacing and sizing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        'tablet': '1.125rem',
        'tablet-lg': '1.25rem',
      },
      minHeight: {
        'touch-target': '44px',
      },
      minWidth: {
        'touch-target': '44px',
      }
    },
  },
  plugins: [],
}
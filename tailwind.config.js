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
        'dicom-dark': '#1a1a2e',
        'dicom-darker': '#0f0f1a',
        'dicom-accent': '#4a90d9',
      },
    },
  },
  plugins: [],
}

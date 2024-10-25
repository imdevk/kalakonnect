/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          'darkest': '#051f20',
          'darker': '#0b2b26',
          'dark': '#163832',
          'medium': '#235347',
          'light': '#8EB69B',
          'off-white': '#edf5ef',
          'lightest': '#daf1de',
        },
      },
    },
  },
  plugins: [],
}
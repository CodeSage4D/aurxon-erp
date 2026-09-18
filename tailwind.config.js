/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aurxon: {
          dark: '#192D55',
          blue: '#2270AF',
          glacier: '#0284c7',
          sky: '#38bdf8',
          accent: '#9E3BB3',
        },
      },
    },
  },
  plugins: [],
};

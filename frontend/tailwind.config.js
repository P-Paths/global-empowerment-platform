/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gep-navy': '#0D1125',      // Dark blue from Global Empowerment
        'gep-gold': '#D4AF37',       // Gold from Global Empowerment
        'gep-royal-blue': '#1238FF', // Royal blue accent
      },
    },
  },
  plugins: [],
}


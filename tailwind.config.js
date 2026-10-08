/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
        ethmoid: {
          50: '#F4F8F6',
          100: '#EAF2EE',
          200: '#D6E5DF',
          300: '#B2D3C7',
          400: '#8FC1AE',
          500: '#7EAE9B',
          600: '#6BA08D',
          700: '#4E8773',
          800: '#2D5949',
          900: '#1F3A30',
          950: '#142720',
        },
        clinical: {
          navy: '#0f172a',
          slate: '#334155',
          teal: '#0d9488',
          gold: '#d97706',
          silver: '#64748b',
          crimson: '#dc2626',
          emerald: '#059669',
        }
      },
    },
  },
  plugins: [],
};

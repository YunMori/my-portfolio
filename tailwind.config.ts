import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        main: '#0c0a09',
        surface: '#1c1917',
        highlight: '#292524',

        green: {
          400: '#6b9b6b',
          500: '#4a7c59',
          600: '#3a6347',
          900: '#1a2e1f',
        },
        brown: {
          300: '#c4a882',
          400: '#a18072',
          500: '#8d6e63',
          600: '#5d4037',
        }
      },
      fontFamily: {
        sans: ['var(--font-gowun-dodum)'],
        display: ['var(--font-syne)'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
};
export default config;

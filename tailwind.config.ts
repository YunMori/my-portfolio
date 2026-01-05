import type { Config } from "tailwindcss";

const config: Config = {
  // 다크모드 활성화
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 커스텀 컬러 팔레트 (Dark Khaki Theme)
        main: '#0c0a09',    // Stone-950
        surface: '#1c1917', // Stone-900
        highlight: '#292524', // Stone-800

        khaki: {
          400: '#d4c55e',
          500: '#a3a948',
          600: '#858a3a',
          900: '#3f421b',
        },
        brown: {
          400: '#a18072',
          500: '#8d6e63',
          600: '#5d4037',
        }
      },
      fontFamily: {
        // next/font와 연동될 변수명
        sans: ['var(--font-noto-sans-kr)'],
        display: ['var(--font-space-grotesk)'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'walk': 'walk 20s linear infinite',
        'hop': 'hop 0.5s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        walk: {
          '0%': { transform: 'translateX(-100px) scaleX(1)' },
          '45%': { transform: 'translateX(calc(100vw + 100px)) scaleX(1)' },
          '50%': { transform: 'translateX(calc(100vw + 100px)) scaleX(-1)' },
          '95%': { transform: 'translateX(-100px) scaleX(-1)' },
          '100%': { transform: 'translateX(-100px) scaleX(1)' }
        },
        hop: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
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
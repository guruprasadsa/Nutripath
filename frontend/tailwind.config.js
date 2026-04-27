/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: '#0A0A0D',
        bgSurface: '#131318',
        bgRaised: '#0E0E12',
        bgSidebar: '#0E0E12',
        jade: '#2EFF9A',
        mauve: '#C4A8FF',
        borderSubtle: 'rgba(255,255,255,0.06)',
        borderJade: 'rgba(46,255,154,0.25)',
        borderMauve: 'rgba(196,168,255,0.25)',
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.6)',
        textMuted: 'rgba(255,255,255,0.25)',
        textGhost: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        display: ['Instrument Serif', 'serif'],
      },
      borderWidth: {
        'subtle': '0.6px',
      },
      borderRadius: {
        'panel': '16px',
        'card': '12px',
        'pill': '20px',
        'icon': '8px',
      },
      spacing: {
        'panel': '14px',
        'padPanel': '18px',
        'padCard': '14px',
        'padSidebar': '10px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseScan: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      },
      animation: {
        floatIn: 'floatIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        pulseScan: 'pulseScan 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}

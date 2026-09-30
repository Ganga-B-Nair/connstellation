/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          void: '#05060f',
          deep: '#0a0d1f',
          panel: '#111631',
          line: '#1e2547',
        },
        star: {
          frontend: '#7dd3fc',
          backend: '#a78bfa',
          ai: '#f472b6',
          mobile: '#4ade80',
          design: '#fbbf24',
          business: '#fb923c',
          hardware: '#22d3ee',
          other: '#cbd5e1',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.9' },
        },
        flare: {
          '0%': { transform: 'scale(1)', opacity: '0.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        twinkle: 'twinkle 4s ease-in-out infinite',
        flare: 'flare 900ms ease-out forwards',
      },
    },
  },
  plugins: [],
};

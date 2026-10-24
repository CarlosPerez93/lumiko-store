/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#06050B',
          800: '#0A0812',
          700: '#100D1B',
          600: '#171326',
          500: '#221C33'
        },
        neon: {
          pink: '#FF3D8A',
          cyan: '#22D3EE',
          violet: '#8B5CF6',
          lime: '#C6F26B',
          amber: '#FFB347'
        }
      },
      fontFamily: {
        display: ['Sora', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 70px -18px rgba(255, 61, 138, 0.65)',
        'glow-cyan': '0 0 70px -18px rgba(34, 211, 238, 0.55)',
        card: '0 30px 80px -40px rgba(0, 0, 0, 0.95)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-26px,0) scale(1.04)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.08)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(-6%, -4%, 0) rotate(-4deg)' },
          '50%': { transform: 'translate3d(6%, 6%, 0) rotate(4deg)' }
        },
        blink: {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' }
        }
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'floatSlow 12s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 8s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'spin-slow': 'spinSlow 22s linear infinite',
        aurora: 'aurora 24s ease-in-out infinite',
        blink: 'blink 7s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

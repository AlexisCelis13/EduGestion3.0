/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired blue palette
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#76e0caff',
          300: '#5bd3bbff',
          400: '#53ceb5ff',
          500: '#48c9b0',  // Apple blue
          600: '#42b8a8',  // Apple link blue
          700: '#36a29fff',
          800: '#2aa195ff',
          900: '#1e918bff',
        },
        // Premium grays (Apple-style)
        surface: {
          50: '#fafafa',
          100: '#f5f5f7',  // Apple light gray
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#86868b',  // Apple secondary text
          500: '#6e6e73',
          600: '#424245',
          700: '#1d1d1f',  // Apple primary text
          800: '#121214',
          900: '#000000',
        },
        // Accent colors
        accent: {
          indigo: '#5856d6',
          purple: '#af52de',
          pink: '#ff2d55',
          green: '#34c759',
          teal: '#5ac8fa',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'subtitle': ['1.375rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
      },
      boxShadow: {
        'premium': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05)',
        'premium-lg': '0 0 0 1px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.04), 0 24px 48px rgba(0,0,0,0.08)',
        'premium-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.12)',
        'glow': '0 0 20px rgba(0, 237, 178, 0.3)',
        'glow-lg': '0 0 40px rgba(0,119,237,0.4)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.2)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        'pill': '9999px',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-in': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
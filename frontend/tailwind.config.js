/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#ffffff',
        'bg-secondary': '#fafafa',
        'bg-tertiary': '#f5f5f5',
        'bg-card': '#ffffff',
        'bg-glass': 'rgba(255, 255, 255, 0.85)',
        'border-subtle': '#e5e5e5',
        'border-hover': '#d4d4d4',
        'text-primary': '#000000',
        'text-secondary': '#0a0a0a',
        'text-muted': '#1a1a1a',
        'accent': '#b85c38',
        'accent-light': '#d97a56',
        'accent-dark': '#8b4226',
        'accent-bg': 'rgba(184, 92, 56, 0.07)',
        'gradient-start': '#b85c38',
        'gradient-end': '#d97a56',
        'success': '#16a34a',
        'warning': '#ca8a04',
        'error': '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', '"Noto Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'float-soft': 'float-soft 5s ease-in-out infinite',
        'dot-pulse': 'dot-pulse 2s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(26, 24, 22, 0.04), 0 1px 1px rgba(26, 24, 22, 0.03)',
        'md': '0 4px 12px rgba(26, 24, 22, 0.06), 0 2px 4px rgba(26, 24, 22, 0.04)',
        'lg': '0 12px 32px rgba(26, 24, 22, 0.08), 0 4px 8px rgba(26, 24, 22, 0.04)',
        'accent': '0 8px 24px rgba(184, 92, 56, 0.18), 0 2px 6px rgba(184, 92, 56, 0.12)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

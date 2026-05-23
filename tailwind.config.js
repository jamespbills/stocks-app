/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', './src/index.html'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--color-bg-base)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-overlay': 'var(--color-bg-overlay)',
        'bg-input': 'var(--color-bg-input)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',
        'interactive-hover': 'var(--color-interactive-hover)',
        'interactive-active': 'var(--color-interactive-active)',
        'price-up': 'var(--color-up)',
        'price-down': 'var(--color-down)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-tight)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-tight)' }],
        md: ['var(--text-md)', { lineHeight: 'var(--leading-normal)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-tight)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-tight)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }]
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)'
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)'
      },
      zIndex: {
        sticky: 'var(--z-sticky)',
        dropdown: 'var(--z-dropdown)',
        modal: 'var(--z-modal)',
        palette: 'var(--z-palette)',
        toast: 'var(--z-toast)'
      },
      transitionDuration: {
        fast: '100ms',
        default: '150ms',
        slow: '250ms'
      }
    }
  },
  plugins: []
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Toda la tipografía sube 3 puntos (4px) respecto de la escala por
      // defecto de Tailwind. Se toca acá y no clase por clase para que el
      // aumento sea parejo en toda la app.
      fontSize: {
        xs: ['1rem', { lineHeight: '1.4rem' }],        // 12px -> 16px
        sm: ['1.125rem', { lineHeight: '1.6rem' }],    // 14px -> 18px
        base: ['1.25rem', { lineHeight: '1.8rem' }],   // 16px -> 20px
        lg: ['1.375rem', { lineHeight: '1.9rem' }],    // 18px -> 22px
        xl: ['1.5rem', { lineHeight: '2rem' }],        // 20px -> 24px
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }], // 24px -> 28px
        '3xl': ['2.125rem', { lineHeight: '2.5rem' }], // 30px -> 34px
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],  // 36px -> 40px
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

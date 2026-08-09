/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        'card-elevated': 'rgb(var(--card-elevated) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        'primary-soft': 'rgb(var(--primary-soft) / <alpha-value>)',
        'primary-deep': 'rgb(var(--primary-deep) / <alpha-value>)',
        'accent-rose': 'rgb(var(--accent-rose) / <alpha-value>)',
        'accent-amber': 'rgb(var(--accent-amber) / <alpha-value>)',
        'accent-violet': 'rgb(var(--accent-violet) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        'success-foreground': 'rgb(var(--success-foreground) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        'warning-foreground': 'rgb(var(--warning-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
        'destructive-foreground': 'rgb(var(--destructive-foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
      },
      borderRadius: {
        '4xl': '32px',
        '5xl': '40px',
      },
    },
  },
  plugins: [],
}

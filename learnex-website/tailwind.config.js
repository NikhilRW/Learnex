/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(221, 39%, 11%)',
        foreground: 'hsl(210, 40%, 98%)',
        primary: {
          DEFAULT: 'hsl(217, 91%, 60%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(215, 16%, 19%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        accent: {
          DEFAULT: 'hsl(240, 82%, 68%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        border: 'hsl(215, 16%, 25%)',
        muted: 'hsl(215, 16%, 15%)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'hsl(210, 40%, 98%)',
            a: {
              color: 'hsl(217, 91%, 60%)',
              '&:hover': {
                color: 'hsl(217, 91%, 70%)',
              },
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
};

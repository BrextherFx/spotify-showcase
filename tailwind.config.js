/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171614",
        text: "#f5ede3",
        sand: "#d8cebc",
        ember: "#e87a38",
        gold: "#e9c47e",
        surface: "#121110",
        panel: "#1e1d1b",
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'sans-serif'],
        pixel: ['"Pixelify Sans"', 'monospace'],
      },
      animation: {
        'pop': 'pop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'rise': 'rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.2s infinite',
      },
      keyframes: {
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}

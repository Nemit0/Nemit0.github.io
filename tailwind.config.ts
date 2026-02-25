import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'var(--color-bg)',
          elevated: 'var(--color-bg-elevated)',
          subtle: 'var(--color-bg-subtle)',
        },
      },
    },
  },
  plugins: [],
};
export default config;

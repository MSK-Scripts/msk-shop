import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:        '#1b1b1d',
        surface:   '#242526',
        surface2:  '#2a2b2e',
        border:    '#3d3d3f',
        borderlt:  '#2e2f31',
        accent:    '#5eb131',
        accenthov: '#4e9827',
        text:      '#e3e3e3',
        muted:     '#8d9096',
        dim:       '#5c6370',
        danger:    '#e05c4b',
        discord:   '#5865F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

// Tailwind v4 nutzt CSS-First-Config in app/globals.css (@theme).
// Diese Datei ist nur noch ein leerer Stub für IDE-Hints und kann
// gelöscht werden, sobald alle Tools v4 verstehen.
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}

export default config

import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The type scale of app/globals.css (`--text-display` to `--text-label`).
 *
 * tailwind-merge only knows Tailwind's own sizes. Any other `text-*` it takes
 * for a colour, so `cn('text-[var(--color-primary-foreground)]', 'text-lead')`
 * dropped the colour: the large primary button (size `lg`, `text-lead`) lost
 * its white label and showed the inherited dark text on green. Found in
 * Phase 4 of the redesign on 28.10.2026.
 */
const FONT_SIZES = ['display', 'h2', 'h3', 'product', 'lead', 'body', 'small', 'label']

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZES }],
    },
  },
})

/**
 * Merges Tailwind classes safely (conflicts like `p-2 p-4` are resolved
 * correctly, the last one wins) and supports clsx patterns (arrays,
 * conditionals, objects).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

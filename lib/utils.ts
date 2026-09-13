import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind classes safely (conflicts like `p-2 p-4` are resolved
 * correctly, the last one wins) and supports clsx patterns (arrays,
 * conditionals, objects).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

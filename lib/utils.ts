import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Mergt Tailwind-Klassen sicher (Konflikte wie `p-2 p-4` werden korrekt
 * aufgelöst — letzte gewinnt) und unterstützt clsx-Patterns (Arrays,
 * Conditionals, Objekte).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

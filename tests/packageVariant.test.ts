import { describe, it, expect } from 'vitest'
import { resolveVariant } from '@/lib/config'

/**
 * The mapping comes from the real Tebex data, fetched on 22.08.2026:
 * category 2105296 = Encrypted Version, 2228937 = Source Version,
 * 3392436 = Subscriptions, where both variants sit side by side.
 */
describe('resolveVariant', () => {
  it('erkennt die Variante an der Katalogkategorie', () => {
    expect(resolveVariant({ name: 'MSK Handcuffs', category: { id: 2105296 } })).toBe('encrypted')
    expect(resolveVariant({ name: 'MSK Handcuffs', category: { id: 2228937 } })).toBe('source')
  })

  it('fällt bei den Abo-Paketen auf den Namen zurück, weil beide in einer Kategorie liegen', () => {
    expect(resolveVariant({ name: 'MSK Scripts - Encrypted Version', category: { id: 3392436 } })).toBe('encrypted')
    expect(resolveVariant({ name: 'MSK Scripts - Source Version',    category: { id: 3392436 } })).toBe('source')
  })

  it('lässt die Kategorie gewinnen, wenn der Name etwas anderes sagt', () => {
    // The category is maintained structure, the name is free text.
    expect(resolveVariant({ name: 'Irgendwas Source', category: { id: 2105296 } })).toBe('encrypted')
  })

  it('gibt null zurück, wenn nichts darauf hindeutet', () => {
    expect(resolveVariant({ name: 'MSK Fuel', category: { id: 999999 } })).toBeNull()
    expect(resolveVariant({ name: 'MSK Fuel' })).toBeNull()
    expect(resolveVariant({})).toBeNull()
  })

  it('greift nur auf ganze Wörter, nicht auf Teiltreffer', () => {
    // "resourced" contains "source", but is not a variant indication.
    expect(resolveVariant({ name: 'Fully resourced pack' })).toBeNull()
  })
})

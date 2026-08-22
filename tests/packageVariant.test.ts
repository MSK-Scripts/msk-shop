import { describe, it, expect } from 'vitest'
import { resolveVariant } from '@/lib/config'

/**
 * Die Zuordnung stammt aus den echten Tebex-Daten, abgerufen am 22.08.2026:
 * Kategorie 2105296 = Encrypted Version, 2228937 = Source Version,
 * 3392436 = Subscriptions, dort liegen beide Varianten nebeneinander.
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
    // Die Kategorie ist gepflegte Struktur, der Name ist Freitext.
    expect(resolveVariant({ name: 'Irgendwas Source', category: { id: 2105296 } })).toBe('encrypted')
  })

  it('gibt null zurück, wenn nichts darauf hindeutet', () => {
    expect(resolveVariant({ name: 'MSK Fuel', category: { id: 999999 } })).toBeNull()
    expect(resolveVariant({ name: 'MSK Fuel' })).toBeNull()
    expect(resolveVariant({})).toBeNull()
  })

  it('greift nur auf ganze Wörter, nicht auf Teiltreffer', () => {
    // "resourced" enthält "source", ist aber keine Variantenangabe.
    expect(resolveVariant({ name: 'Fully resourced pack' })).toBeNull()
  })
})

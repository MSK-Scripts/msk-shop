import { describe, expect, it } from 'vitest'

import { aboutFigures } from '@/lib/aboutFigures'

/**
 * The about page shows measured figures. Each must carry its source, and a
 * figure without a source must vanish instead of turning into a zero or an
 * estimate. The shop figures from Tebex are gone since the paid scripts went
 * free (05.11.2026).
 */

const byLabel = (figures: ReturnType<typeof aboutFigures>, part: string) =>
  figures.find(f => f.label.includes(part))

describe('aboutFigures', () => {
  it('lists Discord members, servers and documentation pages with their sources', () => {
    const figures = aboutFigures('de', 1627, 262, 252)
    expect(figures.map(f => f.label)).toEqual(['Mitglieder im Discord', 'Server auf msk_core', 'Doku-Seiten'])
    const discord = byLabel(figures, 'Discord')
    expect(discord?.value).toBe('1.627')
    expect(discord?.href).toBe('https://discord.gg/5hHSBRHvJE')
    expect(discord?.external).toBe(true)
    expect(byLabel(aboutFigures('en', 1627, 262, 252), 'Discord')?.value).toBe('1,627')
  })

  it('shows no shop figures anymore', () => {
    const labels = aboutFigures('en', 627, 262, 252).map(f => f.label).join(' ')
    expect(labels).not.toMatch(/buyer|refund|sale/i)
  })

  it('drops a source that returned nothing usable', () => {
    const figures = aboutFigures('en', null, null, 0)
    expect(figures).toEqual([])
    expect(byLabel(aboutFigures('en', 0, 262, 252), 'Discord')).toBeUndefined()
  })
})

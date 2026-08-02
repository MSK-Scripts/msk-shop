import { describe, it, expect, vi, beforeEach } from 'vitest'

const queryOne = vi.fn()
vi.mock('@/lib/db', () => ({ queryOne: (...a: unknown[]) => queryOne(...a) }))

const { loadShopStats, formatReversalRate } = await import('@/lib/shopStats')

/**
 * Die Zahlen ersetzen unbelegte Behauptungen auf der Startseite. Diese Tests
 * halten fest, dass lieber gar nichts angezeigt wird als etwas Falsches.
 */

const frisch = (over: Record<string, unknown> = {}) => ({
  unique_buyers: 1464,
  total_payments: 2310,
  completed_payments: 2113,
  refunds: 15,
  chargebacks: 1,
  reversal_rate: '0.00751',
  first_payment_at: new Date('2022-05-08T18:28:05Z'),
  updated_at: new Date(),
  ...over,
})

describe('loadShopStats', () => {
  beforeEach(() => { queryOne.mockReset(); vi.restoreAllMocks() })

  it('liest einen frischen Snapshot', async () => {
    queryOne.mockResolvedValue(frisch())
    const s = await loadShopStats()
    expect(s?.uniqueBuyers).toBe(1464)
    expect(s?.refunds).toBe(15)
    expect(s?.reversalRate).toBeCloseTo(0.00751, 6)
    expect(s?.firstPaymentAt?.getUTCFullYear()).toBe(2022)
  })

  it('gibt null zurück, wenn es keine Zeile gibt', async () => {
    queryOne.mockResolvedValue(null)
    await expect(loadShopStats()).resolves.toBeNull()
  })

  it('blendet einen veralteten Snapshot aus, statt ihn als aktuell zu zeigen', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const alt = new Date(Date.now() - 5 * 86_400_000)
    queryOne.mockResolvedValue(frisch({ updated_at: alt }))
    await expect(loadShopStats()).resolves.toBeNull()
  })

  it('akzeptiert einen Snapshot knapp innerhalb der Frist', async () => {
    const fast = new Date(Date.now() - 2.5 * 86_400_000)
    queryOne.mockResolvedValue(frisch({ updated_at: fast }))
    expect((await loadShopStats())?.uniqueBuyers).toBe(1464)
  })

  it('verwirft null Käufer als kaputten Lauf', async () => {
    queryOne.mockResolvedValue(frisch({ unique_buyers: 0 }))
    await expect(loadShopStats()).resolves.toBeNull()
  })

  it('überlebt eine nicht erreichbare Datenbank', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    queryOne.mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(loadShopStats()).resolves.toBeNull()
  })

  it('verträgt ein unbrauchbares Datum', async () => {
    queryOne.mockResolvedValue(frisch({ updated_at: 'kein Datum' }))
    await expect(loadShopStats()).resolves.toBeNull()
  })

  it('nimmt reversal_rate auch als Zahl statt als DECIMAL-String', async () => {
    queryOne.mockResolvedValue(frisch({ reversal_rate: 0.0075 }))
    expect((await loadShopStats())?.reversalRate).toBeCloseTo(0.0075, 6)
  })
})

describe('formatReversalRate', () => {
  it('schreibt Deutsch mit Komma', () => {
    expect(formatReversalRate(0.00751, 'de')).toBe('0,75')
  })

  it('schreibt Englisch mit Punkt', () => {
    expect(formatReversalRate(0.00751, 'en')).toBe('0.75')
  })

  it('rundet auf zwei Nachkommastellen', () => {
    expect(formatReversalRate(0, 'de')).toBe('0,00')
    expect(formatReversalRate(0.1234, 'en')).toBe('12.34')
  })
})

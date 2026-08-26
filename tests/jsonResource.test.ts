import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readJsonResource } from '@/lib/useAdminResource'

/**
 * Die Fehlerbehandlung des Lade-Helfers, den alle Admin-Tabs und die
 * Bild-Einreichungsseite benutzen.
 *
 * Anlass ist ein echter Fund vom 27.08.2026: `res.json()` wurde bedingungslos
 * gerufen. Bei einer 500 liefert Next eine HTML-Fehlerseite, bei 429 und 413
 * antwortet `proxy.ts` mit reinem Text -- das Parsen warf, und im UI stand
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 */

const FAIL = 'Could not load.'

function respond(init: { status?: number; body?: string }) {
  const status = init.status ?? 200
  vi.stubGlobal('fetch', vi.fn(async () => new Response(init.body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })))
}

beforeEach(() => { vi.unstubAllGlobals() })
afterEach(() => { vi.unstubAllGlobals() })

describe('readJsonResource', () => {
  it('returns the payload under the given key', async () => {
    respond({ body: JSON.stringify({ items: [1, 2, 3] }) })
    await expect(readJsonResource<number[]>('/x', 'items', FAIL)).resolves.toEqual([1, 2, 3])
  })

  it('uses the error field our own routes send', async () => {
    respond({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) })
    await expect(readJsonResource('/x', 'items', FAIL)).rejects.toThrow('Forbidden')
  })

  it('falls back to the caller sentence when an error page is not JSON', async () => {
    // Genau der Fall aus dem Bug: eine 500 mit HTML im Koerper.
    respond({ status: 500, body: '<!DOCTYPE html><html>…</html>' })
    await expect(readJsonResource('/x', 'items', FAIL)).rejects.toThrow(FAIL)
  })

  it('falls back for the plain-text 429 the proxy sends', async () => {
    respond({ status: 429, body: 'Too Many Requests' })
    await expect(readJsonResource('/x', 'items', FAIL)).rejects.toThrow(FAIL)
  })

  it('falls back for a completely empty error body', async () => {
    respond({ status: 502, body: '' })
    await expect(readJsonResource('/x', 'items', FAIL)).rejects.toThrow(FAIL)
  })

  it('treats a 200 without a usable body as a failure, not as empty data', async () => {
    // Sonst kaeme `undefined` zurueck und die Oberflaeche bliebe im Ladezustand.
    respond({ status: 200, body: '' })
    await expect(readJsonResource('/x', 'items', FAIL)).rejects.toThrow(FAIL)
  })

  it('never leaks the browser parser message', async () => {
    respond({ status: 500, body: 'not json' })
    await expect(readJsonResource('/x', 'items', FAIL)).rejects.not.toThrow(/JSON/)
  })
})

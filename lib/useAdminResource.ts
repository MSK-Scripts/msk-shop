'use client'

import { useCallback, useEffect, useState } from 'react'

interface AdminResource<T> {
  /** `null` until the first response arrives. */
  data:   T | null
  error:  string | null
  /** Refetch after a mutation. For event handlers only, never for effects. */
  reload: () => Promise<void>
}

/**
 * Load one admin API resource on mount.
 *
 * Every `/api/admin/*` list endpoint answers with `{ [key]: [...] }` on success
 * and `{ error }` on failure, so all admin tabs shared the same twenty-line
 * fetch block. This hook is that block.
 *
 * The fetch itself runs inside the effect and only touches state after the
 * await, which keeps mounting free of the extra render pass that
 * react-hooks/set-state-in-effect warns about. A previous error is therefore
 * cleared once the next response is in, not at the moment a reload starts.
 *
 * `key` and `failMessage` are expected to be constants. `url` may change: it
 * goes into the effect dependencies, so a new url refetches, and the `alive`
 * guard makes that race-safe — a response that arrives after the url moved on
 * cannot overwrite the newer one. The images tab relies on this to filter and
 * paginate server-side without a single setState inside an effect.
 */
/**
 * Eine Antwort holen und den Nutzdatenteil herausziehen.
 *
 * Steht als eigene Funktion neben dem Hook, damit sie ohne React-Renderer
 * testbar ist: die Fehlerbehandlung darin ist der Teil, der falsch war.
 *
 * `res.json()` blind aufzurufen war der Fehler. Eine 500 liefert Nexts
 * HTML-Fehlerseite, und 429 wie 413 kommen aus `proxy.ts` als reiner Text. Das
 * Parsen warf dann, und der Nutzer sah die Browser-Meldung "Unexpected end of
 * JSON input" statt eines Satzes, mit dem er etwas anfangen kann.
 */
export async function readJsonResource<T>(url: string, key: string, failMessage: string): Promise<T> {
  const res = await fetch(url)

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Kein JSON. Der Statuscode unten entscheidet, was das heisst.
  }

  if (!res.ok) {
    // Unsere eigenen Routen antworten mit { error }. Alles andere bekommt den
    // Satz des Aufrufers, nicht die Rohmeldung des Browsers.
    const reported = (body as { error?: unknown } | null)?.error
    throw new Error(typeof reported === 'string' ? reported : failMessage)
  }

  // 200 ohne verwertbaren Koerper ist ebenfalls ein Fehlerfall, nur ein
  // leiserer: ohne diese Zeile kaeme `undefined` als Daten zurueck und die
  // Oberflaeche bliebe im Ladezustand haengen.
  if (body === null || typeof body !== 'object') throw new Error(failMessage)

  return (body as Record<string, unknown>)[key] as T
}

export function useJsonResource<T>(url: string, key: string, failMessage: string): AdminResource<T> {
  const [data, setData]   = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchResource = useCallback(
    () => readJsonResource<T>(url, key, failMessage),
    [url, key, failMessage],
  )

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const next = await fetchResource()
        if (alive) { setData(next); setError(null) }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : failMessage)
      }
    }
    run()
    return () => { alive = false }
  }, [fetchResource, failMessage])

  const reload = useCallback(async () => {
    try {
      setData(await fetchResource())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : failMessage)
    }
  }, [fetchResource, failMessage])

  return { data, error, reload }
}

/**
 * Der historische Name, unter dem die Admin-Tabs den Hook kennen.
 *
 * Die Bild-Einreichungsseite nutzt dieselbe Mechanik, ist aber oeffentlich, und
 * ein Hook namens `useAdminResource` auf einer oeffentlichen Seite laesst den
 * naechsten Leser nach einer Rechtepruefung suchen, die es hier nie gab. Der
 * Alias kostet eine Zeile und spart diese Suche.
 */
export const useAdminResource = useJsonResource

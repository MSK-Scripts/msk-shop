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
 * All three arguments are expected to be constants — they go straight into the
 * effect dependencies.
 */
export function useAdminResource<T>(url: string, key: string, failMessage: string): AdminResource<T> {
  const [data, setData]   = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchResource = useCallback(async (): Promise<T> => {
    const res  = await fetch(url)
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? failMessage)
    return (body as Record<string, unknown>)[key] as T
  }, [url, key, failMessage])

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

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
 * guard makes that race-safe: a response that arrives after the url moved on
 * cannot overwrite the newer one. The images tab relies on this to filter and
 * paginate server-side without a single setState inside an effect.
 */
/**
 * Fetch a response and pull out the payload part.
 *
 * Lives as its own function next to the hook, so that it is testable without a
 * React renderer: the error handling in it is the part that was wrong.
 *
 * Calling `res.json()` blindly was the bug. A 500 returns Next's HTML error
 * page, and 429 as well as 413 come from `proxy.ts` as plain text. Parsing then
 * threw, and the user saw the browser message "Unexpected end of JSON input"
 * instead of a sentence they could do something with.
 */
export async function readJsonResource<T>(url: string, key: string, failMessage: string): Promise<T> {
  const res = await fetch(url)

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Not JSON. The status code below decides what that means.
  }

  if (!res.ok) {
    // Our own routes answer with { error }. Everything else gets the caller's
    // sentence, not the browser's raw message.
    const reported = (body as { error?: unknown } | null)?.error
    throw new Error(typeof reported === 'string' ? reported : failMessage)
  }

  // A 200 without a usable body is an error case too, just a quieter one:
  // without this line `undefined` would come back as data and the UI would
  // stay stuck in the loading state.
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
 * The historical name under which the admin tabs know the hook.
 *
 * The image submission page uses the same mechanism but is public, and a hook
 * called `useAdminResource` on a public page makes the next reader look for a
 * permission check that never existed here. The alias costs one line and saves
 * that search.
 */
export const useAdminResource = useJsonResource

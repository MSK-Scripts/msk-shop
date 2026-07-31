'use client'

import { useSyncExternalStore } from 'react'

// Nothing ever changes after hydration, so the subscribe callback is a no-op.
const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * `false` while rendering on the server and during the hydration render,
 * `true` from the first client render afterwards.
 *
 * Use this to gate anything that only exists in the browser (localStorage,
 * sessionStorage, `navigator`, persisted Zustand stores). Rendering the same
 * markup on both sides of the hydration boundary is what keeps React from
 * throwing away the subtree and leaving dead event handlers behind.
 *
 * Replaces the older `useState(false)` + `useEffect(() => setMounted(true))`
 * flag: `useSyncExternalStore` reaches the same result without a state update
 * inside an effect, so there is no extra render pass
 * (react-hooks/set-state-in-effect).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

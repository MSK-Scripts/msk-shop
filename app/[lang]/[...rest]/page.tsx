import { notFound } from 'next/navigation'

/**
 * Catch-all below the language segment, only so that an unknown address gets
 * the 404 page inside the shop layout of its language.
 *
 * Without it Next answers an unmatched `/en/...` with its bare default 404:
 * `app/[lang]/not-found.tsx` only catches `notFound()` calls, and a root
 * layout with a dynamic segment has no root `not-found` above it. The proxy
 * sends unknown addresses without a prefix here too (as `/en/...`).
 */
export default function UnknownPage() {
  notFound()
}

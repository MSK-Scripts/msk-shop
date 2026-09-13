import { NextResponse } from 'next/server'

/**
 * Response headers of the public read endpoints under `/api/images`.
 *
 * These three routes (list, categories, single image) deliver the same
 * collection the CDN serves to everyone anyway, and they do so without a
 * session. Giving them `Access-Control-Allow-Origin: *` is therefore not an
 * opening but an alignment with the images themselves: `cdn.msk-scripts.de` has
 * carried the header since day one, because a FiveM NUI with a `nui://` origin
 * could not reach the file otherwise. A consumer that looks up whether an image
 * exists for a model name before displaying it is in exactly the same position.
 *
 * **Deliberately no prefix match.** Under `/api/images` there is also
 * `/api/images/upload`: session cookie, write access, origin check as CSRF
 * protection. A rule on the prefix would have carried the header there and
 * opened exactly the hole the check closes. The header is therefore set by each
 * read route individually; whoever adds a new route under `/api/images` does
 * not get it for free and has to make a decision.
 *
 * No `Access-Control-Allow-Credentials`. With `*` it would not be allowed
 * anyway, and these routes have nothing a cookie would be worth sending for.
 */
export const PUBLIC_READ_HEADERS: Record<string, string> = {
  'Cache-Control':               'public, s-maxage=300, stale-while-revalidate=3600',
  'Access-Control-Allow-Origin': '*',
}

/** A publicly readable JSON response with the headers from above. */
export function publicJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PUBLIC_READ_HEADERS })
}

/**
 * Preflight for the same routes.
 *
 * A plain `fetch` without custom headers triggers no preflight, but a caller
 * with `Accept: application/json` or a custom header does. Without this handler
 * Next answers it with 405, and the actual request is never made: the endpoint
 * then looks like it works, and for half the use case it does not.
 */
export function corsPreflight(): NextResponse {
  return new NextResponse(null, {
    status:  204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age':       '86400',
    },
  })
}

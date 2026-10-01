import { renderLlmsTxt } from '@/lib/llms'
import { getPackages } from '@/lib/tebex'

/**
 * /llms.txt, see `renderLlmsTxt`.
 *
 * Exists once per site: `lib/lang.ts` lists the address in
 * `istEinmaligeAdresse`, so `/de/llms.txt` is not rewritten onto this route
 * and answers with the 404 it should.
 */

// Same setting as the sitemap route. What actually governs is the Tebex fetch
// behind it: it revalidates after 60 s, and Next takes the lowest value on a
// route, so the build lists this one with one minute. A new package therefore
// shows up here as promptly as on its own page.
export const revalidate = 3600

export async function GET(): Promise<Response> {
  // Fail-soft, like the sitemap: if Tebex does not answer (CI build without
  // secrets, API outage), the file still lists every fixed page instead of
  // taking the build or the request down.
  const packages = await getPackages().catch(err => {
    console.warn('[llms.txt] Tebex packages unavailable:', err)
    return []
  })

  return new Response(renderLlmsTxt(packages), {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

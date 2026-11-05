import { renderLlmsTxt } from '@/lib/llms'

/**
 * /llms.txt, see `renderLlmsTxt`.
 *
 * Exists once per site: `lib/routes.ts` lists the address in
 * `isExemptPath`, so `/de/llms.txt` is not rewritten onto this route
 * and answers with the 404 it should.
 *
 * No Tebex fetch any more: the paid scripts left the file on 05.11.2026, and
 * everything it lists now is fixed.
 */
export const revalidate = 3600

export async function GET(): Promise<Response> {
  return new Response(renderLlmsTxt(), {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

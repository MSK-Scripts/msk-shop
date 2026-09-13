import { type NextRequest } from 'next/server'

import { listImages, categoryExists, DEFAULT_PER_PAGE } from '@/lib/images'
import { publicJson, corsPreflight } from '@/lib/publicApi'

/**
 * Image list, public.
 *
 *   /api/images?category=vehicles&q=zentorno&tag=sports&page=1&per=60
 *
 * Two very different consumers: our own gallery and third-party scripts that
 * want to look up whether there is an image for a model name. That is why the
 * response stays lean and the URLs are absolute, so a consumer does not have
 * to assemble anything.
 *
 * The response is the same for every caller and rarely changes, so it may be
 * cached publicly. `stale-while-revalidate` keeps a cache expiry away from
 * the users.
 */
export const revalidate = 300

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const category = sp.get('category')?.trim() || undefined
  if (category && !(await categoryExists(category))) {
    return publicJson({ error: 'unknown category' }, 404)
  }

  const result = await listImages({
    category,
    q:    sp.get('q')   ?? undefined,
    tag:  sp.get('tag') ?? undefined,
    page: Number(sp.get('page') ?? 1),
    per:  Number(sp.get('per')  ?? DEFAULT_PER_PAGE),
  })

  return publicJson(result)
}

export const OPTIONS = corsPreflight

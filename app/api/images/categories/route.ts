import { type NextRequest } from 'next/server'

import { listCategories } from '@/lib/images'
import { isLang, DEFAULT_LANG } from '@/lib/lang'
import { publicJson, corsPreflight } from '@/lib/publicApi'

/**
 * Categories with counts, public.
 *
 *   /api/images/categories?lang=de
 *
 * The language is a parameter here and does not come from the request header:
 * the route lives under `/api` and is therefore excluded from the proxy's
 * language rewrite (see `istEinmaligeAdresse` in lib/lang.ts). An API address
 * exists exactly once, it carries no `/de/` prefix.
 */
export const revalidate = 300

export async function GET(request: NextRequest) {
  const raw  = request.nextUrl.searchParams.get('lang')
  const lang = isLang(raw) ? raw : DEFAULT_LANG

  const categories = await listCategories(lang)

  return publicJson(categories)
}

export const OPTIONS = corsPreflight

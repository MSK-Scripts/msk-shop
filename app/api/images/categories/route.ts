import { NextResponse, type NextRequest } from 'next/server'

import { listCategories } from '@/lib/images'
import { isLang, DEFAULT_LANG } from '@/lib/lang'

/**
 * Kategorien mit Anzahl, oeffentlich.
 *
 *   /api/images/categories?lang=de
 *
 * Die Sprache steht hier als Parameter und kommt nicht aus dem Request-Header:
 * die Route liegt unter `/api` und ist damit vom Sprach-Rewrite des Proxys
 * ausgenommen (siehe `istEinmaligeAdresse` in lib/lang.ts). Eine API-Adresse
 * gibt es genau einmal, sie traegt kein `/de/`-Praefix.
 */
export const revalidate = 300

export async function GET(request: NextRequest) {
  const raw  = request.nextUrl.searchParams.get('lang')
  const lang = isLang(raw) ? raw : DEFAULT_LANG

  const categories = await listCategories(lang)

  return NextResponse.json(categories, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  })
}

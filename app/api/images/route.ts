import { type NextRequest } from 'next/server'

import { listImages, categoryExists, DEFAULT_PER_PAGE } from '@/lib/images'
import { publicJson, corsPreflight } from '@/lib/publicApi'

/**
 * Bildliste, oeffentlich.
 *
 *   /api/images?category=vehicles&q=zentorno&tag=sports&page=1&per=60
 *
 * Zwei sehr verschiedene Verbraucher: die eigene Galerie und fremde Scripts,
 * die nachschlagen wollen, ob es ein Bild zu einem Modellnamen gibt. Deshalb
 * bleibt die Antwort schlank und die URLs sind absolut, damit ein Consumer
 * nichts zusammenbauen muss.
 *
 * Die Antwort ist fuer alle Aufrufer gleich und aendert sich selten, sie darf
 * also oeffentlich zwischengespeichert werden. `stale-while-revalidate` haelt
 * einen Cache-Ablauf von den Nutzern fern.
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

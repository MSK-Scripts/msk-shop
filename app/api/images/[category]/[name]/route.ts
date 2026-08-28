import { getImage } from '@/lib/images'
import { publicJson, corsPreflight } from '@/lib/publicApi'

/**
 * Einzelnes Bild, oeffentlich.
 *
 *   /api/images/vehicles/zentorno
 *
 * Gedacht fuer Scripts, die vor dem Anzeigen wissen wollen, ob es zu einem
 * Modellnamen ueberhaupt ein Bild gibt, und in welchen Massen. Wer das Bild
 * nur einbinden will, braucht diese Route nicht: die CDN-Adresse laesst sich
 * aus Kategorie und Modellname direkt bauen, genau dafuer ist sie flach.
 */
export const revalidate = 300

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; name: string }> },
) {
  const { category, name } = await params

  const image = await getImage(category, name.toLowerCase())
  if (!image) {
    return publicJson({ error: 'not found' }, 404)
  }

  return publicJson(image)
}

export const OPTIONS = corsPreflight

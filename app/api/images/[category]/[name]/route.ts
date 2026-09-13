import { getImage } from '@/lib/images'
import { publicJson, corsPreflight } from '@/lib/publicApi'

/**
 * Single image, public.
 *
 *   /api/images/vehicles/zentorno
 *
 * Meant for scripts that want to know, before displaying anything, whether a
 * model name has an image at all, and in which dimensions. Anyone who only
 * wants to embed the image does not need this route: the CDN address can be
 * built directly from category and model name, which is exactly why it is flat.
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

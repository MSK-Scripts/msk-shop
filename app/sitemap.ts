import type { MetadataRoute } from 'next'

import { getCategories, getPackages } from '@/lib/tebex'
import { absoluteUrl } from '@/lib/siteUrl'

// Die Sitemap zieht ihre dynamischen Einträge aus der Tebex-API. Gleiche
// Revalidierung wie die Katalogseiten, damit neue Pakete zeitnah drin stehen.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

/** Statische, öffentlich indexierbare Seiten mit ihrer relativen Wichtigkeit. */
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: Entry['changeFrequency'] }> = [
  { path: '/',                 priority: 1.0, changeFrequency: 'daily'   },
  { path: '/packages',         priority: 0.9, changeFrequency: 'daily'   },
  { path: '/resources',        priority: 0.7, changeFrequency: 'daily'   },
  { path: '/ticketbot',        priority: 0.8, changeFrequency: 'weekly'  },
  { path: '/ticketbot/stats',  priority: 0.5, changeFrequency: 'daily'   },
  { path: '/giveaway',         priority: 0.8, changeFrequency: 'weekly'  },
  { path: '/giveaway/stats',   priority: 0.5, changeFrequency: 'daily'   },
  { path: '/terms',            priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/terms/imprint',    priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/terms/privacy',    priority: 0.3, changeFrequency: 'yearly'  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(route => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority:        route.priority,
  }))

  // Fail-soft: Ist Tebex nicht erreichbar (CI-Build ohne Secrets, API-Ausfall),
  // wird trotzdem eine gültige Sitemap mit den statischen Seiten ausgeliefert,
  // statt den ganzen Build zu kippen.
  const [packages, categories] = await Promise.all([
    getPackages().catch(err => {
      console.warn('[sitemap] Tebex-Pakete nicht verfügbar:', err)
      return []
    }),
    getCategories().catch(err => {
      console.warn('[sitemap] Tebex-Kategorien nicht verfügbar:', err)
      return []
    }),
  ])

  const packageEntries: MetadataRoute.Sitemap = packages.map(pkg => ({
    url: absoluteUrl(`/packages/${pkg.id}`),
    lastModified,
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = categories.map(cat => ({
    url: absoluteUrl(`/categories/${cat.id}`),
    lastModified,
    changeFrequency: 'weekly',
    priority:        0.6,
  }))

  return [...staticEntries, ...packageEntries, ...categoryEntries]
}

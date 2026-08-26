import type { Metadata } from 'next'

import UploadClient from './UploadClient'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * Einreichungsseite fuer Community-Uploads.
 *
 * `force-dynamic`, weil die Seite an der Sitzung des Einreichenden haengt:
 * angemeldet sieht sie das Formular und die eigenen Einreichungen, ohne
 * Anmeldung die Discord-Schaltflaeche. Ein gecachter Zwischenstand waere hier
 * schlimmer als eine Abfrage mehr.
 *
 * Sie ist bewusst **nicht** auf noindex. Die Seite erklaert, was der Bestand
 * braucht, und ist damit selbst ein Einstieg; wer nach "fivem prop image"
 * sucht, ist genau die Person, die eins beisteuern koennte.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/images/upload', lang)
  return {
    title:       seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/images/upload'),
  }
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { lang } = await getRequestLang()
  const { error } = await searchParams

  // Der OAuth-Rueckkanal haengt seinen Fehlergrund an die Adresse. Er kommt aus
  // unserer eigenen Umleitung, wird aber trotzdem nicht roh angezeigt, sondern
  // im Client gegen die bekannten Schluessel aufgeloest.
  return <UploadClient lang={lang} initialError={typeof error === 'string' ? error : undefined} />
}

import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { ReportClient } from './ReportClient'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/report', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/report'),
  }
}

type Search = Promise<{ url?: string | string[] }>

export default async function ReportPage({ searchParams }: { searchParams: Search }) {
  // The prefilled URL is read here, on the server. Until 24.11.2026 the form
  // read it with `useSearchParams` behind a Suspense boundary, so the server
  // sent the footer first and streamed the heading and the form in after it:
  // the page's h1 came after four h2 in the HTML.
  const { url } = await searchParams
  return <ReportClient initialUrl={typeof url === 'string' ? url : ''} />
}

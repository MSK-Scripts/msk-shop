import { cookies, headers } from 'next/headers'
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang'
import { Hero } from '@/components/home/Hero'
import { TrustBar } from '@/components/home/TrustBar'
import { FeaturedPackages } from '@/components/home/FeaturedPackages'
import { WhyMSK } from '@/components/home/WhyMSK'
import { HowItWorks } from '@/components/home/HowItWorks'
import { CustomPackages } from '@/components/home/CustomPackages'
import { CTASection } from '@/components/home/CTASection'
import { openGraphFor } from '@/lib/seo'

export const metadata = {
  alternates: { canonical: '/' },
  openGraph:  openGraphFor({ url: '/' }),
}

export default async function HomePage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const lang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, headerStore.get('accept-language'))

  return (
    <>
      <Hero lang={lang} />
      <TrustBar lang={lang} />
      <FeaturedPackages lang={lang} />
      <WhyMSK lang={lang} />
      <HowItWorks lang={lang} />
      <CustomPackages lang={lang} />
      <CTASection lang={lang} />
    </>
  )
}

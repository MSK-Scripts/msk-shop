import { Hero } from '@/components/home/Hero'
import { TrustBar } from '@/components/home/TrustBar'
import { FeaturedPackages } from '@/components/home/FeaturedPackages'
import { WhyMSK } from '@/components/home/WhyMSK'
import { CustomPackages } from '@/components/home/CustomPackages'
import { CTASection } from '@/components/home/CTASection'

export const revalidate = 60

export default async function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedPackages />
      <WhyMSK />
      <CustomPackages />
      <CTASection />
    </>
  )
}

import { GiveawaySectionPage, giveawaySectionMetadata } from './sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySectionMetadata('overview')
}

export default function GiveawayOverviewPage() {
  return <GiveawaySectionPage section="overview" />
}

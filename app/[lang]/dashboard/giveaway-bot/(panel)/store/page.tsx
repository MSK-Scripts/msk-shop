import { GiveawaySectionPage, giveawaySectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySectionMetadata('store')
}

export default function GiveawayStorePage() {
  return <GiveawaySectionPage section="store" />
}

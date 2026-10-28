import { GiveawaySectionPage, giveawaySectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySectionMetadata('giveaways')
}

export default function GiveawayGiveawaysPage() {
  return <GiveawaySectionPage section="giveaways" />
}

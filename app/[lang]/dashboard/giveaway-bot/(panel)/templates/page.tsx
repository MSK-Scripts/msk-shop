import { GiveawaySectionPage, giveawaySectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySectionMetadata('templates')
}

export default function GiveawayTemplatesPage() {
  return <GiveawaySectionPage section="templates" />
}

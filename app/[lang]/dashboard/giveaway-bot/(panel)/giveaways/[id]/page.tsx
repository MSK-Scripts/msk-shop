import { GiveawayDetail } from '../../../GiveawayDetail'
import { GiveawaySubPage, giveawaySubPageMetadata } from '../../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySubPageMetadata('giveaway')
}

/** One giveaway. The id only selects among the giveaways of the session's server. */
export default async function GiveawayRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <GiveawaySubPage>
      <GiveawayDetail id={id} />
    </GiveawaySubPage>
  )
}

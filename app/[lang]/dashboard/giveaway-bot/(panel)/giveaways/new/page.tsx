import { NewGiveawayPage } from '../../../GiveawayDetail'
import { GiveawaySubPage, giveawaySubPageMetadata } from '../../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySubPageMetadata('newGiveaway')
}

/** `?template=<id>` starts from that template, as chosen in the template list. */
export default async function NewGiveawayRoute({ searchParams }: { searchParams: Promise<{ template?: string | string[] }> }) {
  const { template } = await searchParams
  return (
    <GiveawaySubPage>
      <NewGiveawayPage template={typeof template === 'string' ? template : undefined} />
    </GiveawaySubPage>
  )
}

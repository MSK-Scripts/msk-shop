import { TemplateEditor } from '../../../TemplatesArea'
import { GiveawaySubPage, giveawaySubPageMetadata } from '../../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySubPageMetadata('template')
}

/** One template. The id only selects among the templates of the session's server. */
export default async function TemplateRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <GiveawaySubPage>
      <TemplateEditor id={id} />
    </GiveawaySubPage>
  )
}

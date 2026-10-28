import { TemplateEditor } from '../../../TemplatesArea'
import { GiveawaySubPage, giveawaySubPageMetadata } from '../../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySubPageMetadata('newTemplate')
}

export default function NewTemplateRoute() {
  return (
    <GiveawaySubPage>
      <TemplateEditor />
    </GiveawaySubPage>
  )
}

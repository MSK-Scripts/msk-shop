import { GiveawaySectionPage, giveawaySectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return giveawaySectionMetadata('settings')
}

export default function GiveawaySettingsPage() {
  return <GiveawaySectionPage section="settings" />
}

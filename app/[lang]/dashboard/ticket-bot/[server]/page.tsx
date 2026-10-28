import { TicketBotSectionPage, ticketBotSectionMetadata } from './sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return ticketBotSectionMetadata('overview')
}

export default function TicketBotOverviewPage({ params }: { params: Promise<{ server: string }> }) {
  return <TicketBotSectionPage params={params} section="overview" />
}

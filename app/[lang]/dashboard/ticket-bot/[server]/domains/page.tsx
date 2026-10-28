import { TicketBotSectionPage, ticketBotSectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return ticketBotSectionMetadata('domains')
}

export default function TicketBotDomainsPage({ params }: { params: Promise<{ server: string }> }) {
  return <TicketBotSectionPage params={params} section="domains" />
}

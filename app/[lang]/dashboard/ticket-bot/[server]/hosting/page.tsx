import { TicketBotSectionPage, ticketBotSectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return ticketBotSectionMetadata('hosting')
}

export default function TicketBotHostingPage({ params }: { params: Promise<{ server: string }> }) {
  return <TicketBotSectionPage params={params} section="hosting" />
}

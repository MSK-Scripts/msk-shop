import { TicketBotSectionPage, ticketBotSectionMetadata } from '../sectionPage'

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  return ticketBotSectionMetadata('transcripts')
}

export default function TicketBotTranscriptsPage({ params }: { params: Promise<{ server: string }> }) {
  return <TicketBotSectionPage params={params} section="transcripts" />
}

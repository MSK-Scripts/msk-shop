import { loadResourceStats } from '@/lib/fivestats'
import ResourcesClient       from './ResourcesClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title:       'Resource Statistics – MSK Scripts',
  description: 'Live adoption statistics of MSK Scripts FiveM resources across all servers, powered by fivestats.io.',
}

export default async function ResourcesPage() {
  const stats = await loadResourceStats()
  return <ResourcesClient stats={stats} />
}

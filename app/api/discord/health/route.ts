import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface StatusResponse {
  status: {
    indicator:   'none' | 'minor' | 'major' | 'critical'
    description: string
  }
}

interface IncidentsResponse {
  incidents: Array<{
    name:   string
    status: string
    impact: 'none' | 'minor' | 'major' | 'critical'
  }>
}

// Severity ranking — higher = worse
const SEVERITY: Record<string, number> = { none: 0, minor: 1, major: 2, critical: 3, unknown: 1 }

export async function GET() {
  try {
    // Fetch both endpoints in parallel
    const [statusRes, incidentsRes] = await Promise.all([
      fetch('https://discordstatus.com/api/v2/status.json', {
        headers: { Accept: 'application/json' },
        signal:  AbortSignal.timeout(5000),
      }),
      fetch('https://discordstatus.com/api/v2/incidents/unresolved.json', {
        headers: { Accept: 'application/json' },
        signal:  AbortSignal.timeout(5000),
      }),
    ])

    if (!statusRes.ok || !incidentsRes.ok) {
      return NextResponse.json({ indicator: 'unknown' })
    }

    const statusData:    StatusResponse    = await statusRes.json()
    const incidentsData: IncidentsResponse = await incidentsRes.json()

    // Pick the highest severity between the status indicator and all active incidents
    let worstIndicator: string = statusData.status.indicator

    for (const incident of incidentsData.incidents) {
      if ((SEVERITY[incident.impact] ?? 0) > (SEVERITY[worstIndicator] ?? 0)) {
        worstIndicator = incident.impact
      }
    }

    // If there are ANY unresolved incidents, treat it at least as minor
    if (incidentsData.incidents.length > 0 && worstIndicator === 'none') {
      worstIndicator = 'minor'
    }

    return NextResponse.json({ indicator: worstIndicator })
  } catch {
    return NextResponse.json({ indicator: 'unknown' })
  }
}

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface StatusResponse {
  status: {
    indicator: 'none' | 'minor' | 'major' | 'critical'
    description: string
  }
}

export async function GET() {
  try {
    const res = await fetch('https://discordstatus.com/api/v2/status.json', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    if (!res.ok) {
      return NextResponse.json({ indicator: 'unknown', description: 'Could not reach Discord status page.' })
    }

    const data: StatusResponse = await res.json()
    return NextResponse.json({
      indicator:   data.status.indicator,
      description: data.status.description,
    })
  } catch {
    return NextResponse.json({ indicator: 'unknown', description: 'Could not reach Discord status page.' })
  }
}

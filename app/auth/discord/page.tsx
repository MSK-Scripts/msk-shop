'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

// Discord callback page — receives discord_id from Tebex OAuth redirect
// URL format: /auth/discord?discord_id=123&discord_tag=user%230&signature=...
function DiscordCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const discordId = searchParams.get('discord_id') || searchParams.get('discordId') || searchParams.get('id') || ''
  const discordTag = searchParams.get('discord_tag') || ''

  // Purely derived from the URL — no state, so nothing has to be set from an effect.
  const message = discordId
    ? `Discord connected as ${discordTag || discordId}! Returning to shop...`
    : 'Could not get Discord ID. Returning...'

  useEffect(() => {
    const returnPath = sessionStorage.getItem('discordReturnPath') || '/'
    const target = discordId
      ? `${returnPath}?discordLinked=true&discord_id=${encodeURIComponent(discordId)}`
      : `${returnPath}?discordLinked=error`

    const timer = setTimeout(() => router.push(target), discordId ? 600 : 1000)
    return () => clearTimeout(timer)
  }, [discordId, router])

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem-12rem)] items-center justify-center py-12">
      <Card className="w-full max-w-sm p-8 text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--color-primary)]" />
        <p className="mb-2 font-semibold">Connecting Discord…</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p>
      </Card>
    </div>
  )
}

export default function DiscordCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page flex min-h-[calc(100vh-4rem-12rem)] items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <DiscordCallback />
    </Suspense>
  )
}

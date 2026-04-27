'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Discord callback page — receives discord_id from Tebex OAuth redirect
// URL format: /auth/discord?discord_id=123&discord_tag=user%230&signature=...
function DiscordCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState('Processing Discord authentication...')

  useEffect(() => {
    const discordId = searchParams.get('discord_id') || searchParams.get('discordId') || searchParams.get('id') || ''
    const discordTag = searchParams.get('discord_tag') || ''

    console.log('[discord/callback] discord_id:', discordId, '| tag:', discordTag)

    // Get the return path stored before Discord auth
    const returnPath = sessionStorage.getItem('discordReturnPath') || '/'

    if (discordId) {
      setMessage(`Discord connected as ${discordTag || discordId}! Returning to shop...`)
      // Pass discord_id via URL — more reliable than sessionStorage timing
      setTimeout(() => {
        router.push(`${returnPath}?discordLinked=true&discord_id=${encodeURIComponent(discordId)}`)
      }, 600)
    } else {
      setMessage('Could not get Discord ID. Returning...')
      setTimeout(() => {
        router.push(`${returnPath}?discordLinked=error`)
      }, 1000)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-surface border border-borderlt rounded-xl p-8 max-w-sm w-full text-center">
        <Loader2 size={32} className="animate-spin text-accent mx-auto mb-4" />
        <p className="text-white font-semibold mb-2">Connecting Discord...</p>
        <p className="text-muted text-sm">{message}</p>
      </div>
    </div>
  )
}

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    }>
      <DiscordCallback />
    </Suspense>
  )
}

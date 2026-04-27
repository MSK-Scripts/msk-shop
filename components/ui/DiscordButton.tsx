'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface Props {
  variant?: 'hero' | 'cta'
}

export function DiscordButton({ variant = 'hero' }: Props) {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/discord')
      .then(r => r.json())
      .then(d => setOnline(d.online))
      .catch(() => setOnline(null))
  }, [])

  const href = 'https://discord.gg/5hHSBRHvJE'

  if (variant === 'hero') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-surface border border-borderlt hover:border-accent/40 rounded-lg px-5 py-2.5 transition-all group"
      >
        {/* Discord Wumpus icon */}
        <svg width="18" height="18" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <path d="M60.105 4.898A58.55 58.55 0 0 0 45.653.415a.22.22 0 0 0-.233.11 40.784 40.784 0 0 0-1.8 3.697 54.07 54.07 0 0 0-16.235 0 37.37 37.37 0 0 0-1.827-3.697.228.228 0 0 0-.233-.11 58.39 58.39 0 0 0-14.452 4.483.207.207 0 0 0-.095.082C1.578 18.73-.944 32.144.293 45.38a.244.244 0 0 0 .093.167c6.073 4.46 11.955 7.167 17.729 8.962a.23.23 0 0 0 .249-.082 42.08 42.08 0 0 0 3.627-5.9.225.225 0 0 0-.123-.312 38.772 38.772 0 0 1-5.539-2.64.228.228 0 0 1-.022-.378 31.17 31.17 0 0 0 1.1-.862.22.22 0 0 1 .23-.031c11.619 5.305 24.198 5.305 35.68 0a.219.219 0 0 1 .232.028c.356.293.728.593 1.103.865a.228.228 0 0 1-.02.378 36.384 36.384 0 0 1-5.54 2.637.227.227 0 0 0-.121.315 47.249 47.249 0 0 0 3.624 5.897.225.225 0 0 0 .249.084c5.801-1.794 11.684-4.502 17.757-8.961a.228.228 0 0 0 .092-.164c1.48-15.315-2.48-28.618-10.498-40.398a.18.18 0 0 0-.093-.084zm-36.38 32.427c-3.497 0-6.38-3.211-6.38-7.156 0-3.944 2.827-7.156 6.38-7.156 3.583 0 6.438 3.24 6.38 7.156 0 3.945-2.827 7.156-6.38 7.156zm23.593 0c-3.498 0-6.38-3.211-6.38-7.156 0-3.944 2.826-7.156 6.38-7.156 3.582 0 6.437 3.24 6.38 7.156 0 3.945-2.826 7.156-6.38 7.156z" fill="#5865F2"/>
        </svg>

        <span className="text-white font-bold text-sm">Join Discord</span>

        <span className="flex items-center gap-1.5 bg-bg border border-borderlt rounded-full px-2.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
          <span className="text-accent text-xs font-bold tabular-nums">
            {online !== null ? online.toLocaleString() : '…'}
          </span>
        </span>

        <ArrowRight size={14} className="text-muted group-hover:text-text group-hover:translate-x-0.5 transition-all shrink-0" />
      </a>
    )
  }

  // CTA variant — no icon, no online count, keeps existing discord button style
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="msk-btn-discord text-sm inline-flex items-center gap-2"
    >
      Join Discord
    </a>
  )
}

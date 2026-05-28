import Link from 'next/link'
import { ArrowRight, Github } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

      <div className="container-page relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">

        {/* Text-Spalte */}
        <div>
          <Badge variant="outline" className="mb-6">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            Live · Trusted by 500+ Servers
          </Badge>

          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Premium FiveM<br />
            Scripts.<br />
            <span className="text-[var(--color-primary)]">Built by a player.</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
            Clean code, regular updates, and real support — from the developer
            who codes every line himself.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/packages">
                Browse Packages
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/MSK-Scripts" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Terminal-Mockup */}
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
            {/* Terminal-Header */}
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_50%,var(--color-background))] px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-red-500/85" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/85" />
              <span className="h-3 w-3 rounded-full bg-green-500/85" />
              <span className="ml-2 font-mono text-xs text-[var(--color-muted-foreground)]">
                musiker15@fivem-server: ~
              </span>
            </div>

            {/* Terminal-Body */}
            <pre className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-7">
              <code>
                <span className="text-[var(--color-muted-foreground)]"># Load MSK Core</span>{'\n'}
                <span>ensure msk_core</span>{'\n\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_core </span>
                <span className="text-amber-500">v2.8.4</span>
                <span> ready</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>ESX bridge connected</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_garage loaded </span>
                <span className="text-[var(--color-success)]">✓</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_banking loaded </span>
                <span className="text-[var(--color-success)]">✓</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_jobs loaded </span>
                <span className="text-[var(--color-success)]">✓</span>{'\n\n'}
                <span className="text-[var(--color-muted-foreground)]">{'> 12 vehicles indexed in 42 ms'}</span>{'\n'}
                <span className="text-[var(--color-muted-foreground)]">{'> NUI rendered'}</span>{'\n\n'}
                <span className="font-semibold text-[var(--color-primary)]">$</span>{' '}
                <span className="opacity-80">Server ready.</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

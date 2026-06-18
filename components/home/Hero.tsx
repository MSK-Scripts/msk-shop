import Link from 'next/link'
import { ArrowRight, Github } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { homeTranslations, type Lang } from '@/lib/i18n'

export function Hero({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

      <div className="container-page relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">

        {/* Text-Spalte */}
        <div>
          <Badge variant="outline" className="mb-6">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            {t.hero_badge}
          </Badge>

          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {t.hero_h1_line1}<br />
            {t.hero_h1_line2}<br />
            <span className="text-[var(--color-primary)]">{t.hero_h1_accent}</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
            {t.hero_subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/packages">
                {t.hero_btn_browse}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/MSK-Scripts" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                {t.hero_btn_github}
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
                <span className="text-amber-500">v3.0.0</span>
                <span> ready</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>ESX bridge connected</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_handcuffs loaded </span>
                <span className="text-[var(--color-success)]">✓</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_garage loaded </span>
                <span className="text-[var(--color-success)]">✓</span>{'\n'}
                <span className="font-semibold text-[var(--color-info)]">[INFO]</span>{' '}
                <span>msk_vehiclekeys loaded </span>
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

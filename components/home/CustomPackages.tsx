import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE } from '@/content/custom-packages'

/**
 * Normalisiert Bildpfade aus custom-packages.ts. next/image akzeptiert nur
 * `/path`- oder `http(s)://`-URLs — die Content-Datei nutzt aber teilweise
 * reine Dateinamen (z. B. `msk_paste.png`). Hier defensiv mit `/` voranstellen,
 * damit Bestandsdaten ohne Migration weiter funktionieren.
 */
function resolveImageSrc(src: string): string {
  if (!src) return ''
  if (src.startsWith('/') || /^https?:\/\//i.test(src)) return src
  return `/${src}`
}

export function CustomPackages() {
  if (CUSTOM_PACKAGES.length === 0) {
    return null
  }

  return (
    <section className="container-page py-16 md:py-20">
      <div className="mb-10">
        <span className="eyebrow">GitHub &amp; More</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          {CUSTOM_PACKAGES_TITLE}
        </h2>
        <p className="mt-3 max-w-xl text-base text-[var(--color-muted-foreground)]">
          Free tools, Discord bots, and open-source libraries from the MSK ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CUSTOM_PACKAGES.map(pkg => (
          <Card key={pkg.id} hoverLift className="group flex flex-col overflow-hidden">
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))] to-[color-mix(in_oklab,var(--color-primary)_2%,var(--color-card))]">
              {pkg.image ? (
                <Image
                  src={resolveImageSrc(pkg.image)}
                  alt={pkg.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-2xl font-semibold tracking-wider text-[color-mix(in_oklab,var(--color-foreground)_18%,transparent)]">
                    {pkg.name.toLowerCase().replace(/\s+/g, '_')}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              {pkg.badges.length > 0 && (
                <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
                  {pkg.badges.map(b => (
                    <Badge key={b.label} variant={b.variant as BadgeVariant}>{b.label}</Badge>
                  ))}
                </div>
              )}
            </div>

            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.price && (
                  <span className={`font-mono text-base font-bold ${pkg.isFree ? 'text-[var(--color-muted-foreground)]' : 'text-[var(--color-primary)]'}`}>
                    {pkg.price}
                  </span>
                )}
              </div>
              <CardDescription>{pkg.description}</CardDescription>
              {pkg.tags && pkg.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pkg.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-[0.625rem] text-[var(--color-muted-foreground)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-3">
                <Button asChild size="sm" className="flex-[2]">
                  <a href={pkg.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {pkg.linkLabel}
                  </a>
                </Button>
                {pkg.secondaryLink && pkg.secondaryLinkLabel && (
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <a href={pkg.secondaryLink} target="_blank" rel="noopener noreferrer">
                      {pkg.secondaryLinkLabel}
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

import { Card } from '@/components/ui/Card'
import { HOME_FEATURES } from '@/content/home-features'

export function WhyMSK() {
  return (
    <section className="border-b border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
      <div className="container-page py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow mx-auto inline-flex">Benefits</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Why MSK Scripts?
          </h2>
          <p className="mt-4 text-base text-[var(--color-muted-foreground)]">
            No template farms. No corporate roadmap. Just well-crafted FiveM
            scripts you can trust.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} hoverLift className="group p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

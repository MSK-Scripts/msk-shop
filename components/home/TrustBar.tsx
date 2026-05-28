interface Kpi {
  number: string
  label: string
  emphasis?: string
}

const KPIS: Kpi[] = [
  { number: '500', emphasis: '+', label: 'Customers' },
  { number: '20',  emphasis: '+', label: 'Resources' },
  { number: '24/7',             label: 'Discord Support' },
  { number: 'ESX · QB',    label: 'Frameworks' },
]

export function TrustBar() {
  return (
    <section className="border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_60%,var(--color-background))]">
      <div className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4 md:py-12">
        {KPIS.map(kpi => (
          <div key={kpi.label} className="text-center">
            <div className={`font-mono font-bold leading-none text-[var(--color-foreground)] ${kpi.number.length > 5 ? 'text-xl md:text-2xl pt-3' : 'text-3xl md:text-4xl'}`}>
              {kpi.number}
              {kpi.emphasis && <span className="text-[var(--color-primary)]">{kpi.emphasis}</span>}
            </div>
            <div className="mt-2 text-xs text-[var(--color-muted-foreground)] md:text-sm">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

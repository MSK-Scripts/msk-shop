export function InfoSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-7 border-b border-borderlt" style={{ textAlign: 'center' }}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1.5">
        Welcome to
      </p>
      <h2 className="text-[22px] font-extrabold text-white mb-1">MSK Scripts Store</h2>
      <p className="text-sm text-muted mb-5">All prices are including tax.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl" style={{ margin: '0 auto' }}>
        <div className="bg-surface border border-borderlt rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
            About Us
          </p>
          <div className="flex flex-col gap-1.5 text-sm text-muted">
            {[
              'High quality scripts at low prices',
              'High quality free scripts',
              'High quality and custom scripts',
              'Friendly and fast support',
              'A friendly community',
              'Over 500 happy customers',
            ].map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-borderlt rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
            Free Scripts on GitHub
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: 'github.com/MSK-Scripts', href: 'https://github.com/MSK-Scripts' },
              { label: 'github.com/Musiker15', href: 'https://github.com/Musiker15' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-accent hover:border-accent/40 transition-colors"
              >
                ⇗ {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-borderlt text-xs text-muted">
            You&apos;ll need{' '}
            <code className="bg-surface2 border border-border rounded px-1.5 py-0.5 text-text font-mono text-[10px]">
              msk_core
            </code>{' '}
            for our scripts — download it for free on{' '}
            <a
              href="https://github.com/MSK-Scripts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-semibold hover:underline"
            >
              GitHub
            </a>
            .
          </div>
        </div>
      </div>
    </section>
  )
}

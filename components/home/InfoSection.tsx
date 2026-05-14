const ABOUT_US = [
  'MSK Scripts is built by a developer who is a passionate FiveM player at heart — someone who knows first-hand what makes a roleplay server great.',
  'What began as a small side project has grown into a shop for high-quality FiveM scripts, built on one simple principle: every script should not just work flawlessly, but actually be fun to use.',
  'There is no big company here — just one developer who personally codes, tests, and maintains every script. That means clean code, regular updates, and support that genuinely helps.',
  'Today MSK Scripts is trusted by roleplay communities that want to stand out — whether they are just getting started or already well established. Quality over quantity is not a slogan here; it is how we work.',
]

export function InfoSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-7 border-b border-borderlt" style={{ textAlign: 'center' }}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1.5">
        Welcome to
      </p>
      <h2 className="text-[22px] font-extrabold text-white mb-1">MSK Scripts Shop</h2>
      <p className="text-sm text-muted mb-5">Premium FiveM resources — all prices include VAT.</p>

      <div className="flex flex-col xl:flex-row gap-4 items-center xl:items-stretch xl:justify-center">
        {/* About Us — unchanged size */}
        <div className="bg-surface border border-borderlt rounded-xl p-5 w-full max-w-3xl text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
            About Us
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted leading-relaxed">
            {ABOUT_US.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
        </div>

        {/* Free FiveM Scripts on GitHub */}
        <div className="bg-surface border border-borderlt rounded-xl p-5 w-full max-w-3xl xl:w-80 xl:shrink-0 text-left flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
            Free FiveM Scripts on GitHub
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: 'github.com/Musiker15', href: 'https://github.com/Musiker15' },
              { label: 'github.com/MSK-Scripts', href: 'https://github.com/MSK-Scripts' },
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
          <div className="mt-auto pt-3 border-t border-borderlt text-xs text-muted">
            You&apos;ll need{' '}
            <code className="bg-surface2 border border-border rounded px-1.5 py-0.5 text-text font-mono text-[10px]">
              msk_core
            </code>{' '}
            for our fivem scripts — download it for free on{' '}
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

      {/* Backup — alternative About Us as a bullet list */}
      {/* <div className="bg-surface border border-borderlt rounded-xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">
          About Us
        </p>
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          {[
            'Built by a passionate FiveM player who knows what servers actually need',
            'Solo developer — every script is personally coded, tested, and maintained',
            'Focus on quality over quantity: clean code, thoughtful features, regular updates',
            'Real support from someone who understands the product inside out',
            'Made for servers that want to stand out with unique, well-crafted scripts',
            'Over 500 happy customers',
          ].map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div> */}
    </section>
  )
}

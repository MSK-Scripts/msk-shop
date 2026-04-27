import { DiscordButton } from '@/components/ui/DiscordButton'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg text-center py-16 px-6">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 600,
          height: 250,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(94,177,49,0.28) 0%, rgba(94,177,49,0.08) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 pointer-events-none"
        style={{
          width: 220,
          background: 'linear-gradient(90deg, transparent, #5eb131, transparent)',
        }}
      />
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
          <span className="text-accent">MSK</span>{' '}
          <span className="text-white">Scripts Shop</span>
        </h1>
        <p className="text-muted text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6">
          High quality FiveM resources &amp; Discord bots for your server
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="https://docu.msk-scripts.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-surface border border-borderlt hover:border-accent/40 rounded-lg px-5 py-2.5 transition-all text-sm font-bold text-white"
          >
            Documentation
          </a>
          <DiscordButton variant="hero" />
        </div>
      </div>
    </section>
  )
}

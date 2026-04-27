import { DiscordButton } from '@/components/ui/DiscordButton'

export function CTASection() {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-10">
      <div className="bg-surface border border-borderlt rounded-xl px-7 py-6 flex flex-col md:flex-row items-center justify-between gap-5">
        <div>
          <h3 className="text-[15px] font-bold text-white mb-1">Need help?</h3>
          <p className="text-xs text-muted">
            Join the MSK Scripts Discord for support, updates and community discussions.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <DiscordButton variant="cta" />
          <a
            href="https://github.com/MSK-Scripts"
            target="_blank"
            rel="noopener noreferrer"
            className="msk-btn-ghost text-sm"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  )
}

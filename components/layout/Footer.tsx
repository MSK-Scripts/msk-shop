import Link from 'next/link'
import Image from 'next/image'
import styles from './Footer.module.css'

const footerLinks = {
  Ticketbot: [
    { label: 'Verify', href: '/verify', external: false },
    { label: 'Dashboard', href: '/dashboard', external: false },
  ],
  Community: [
    { label: 'Discord', href: 'https://discord.gg/5hHSBRHvJE', external: true },
    { label: 'GitHub', href: 'https://github.com/MSK-Scripts', external: true },
    { label: 'Documentation', href: 'https://docu.msk-scripts.de', external: true },
  ],
  Legal: [
    { label: 'Imprint', href: '/terms/imprint', external: false },
    { label: 'Privacy Policy', href: '/terms/privacy', external: false },
    { label: 'Terms & Conditions', href: '/terms', external: false },
  ],
}

export function Footer() {
  return (
    <footer className="bg-surface border-t border-borderlt">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <Image 
                src="/logo.png" 
                alt="MSK Scripts Logo" 
                width={40} 
                height={40} 
                className="rounded" // Optional: Behält die leichten Rundungen bei
              />
              <span className="text-white font-bold text-sm">MSK Scripts</span>
            </div>
            <p className="text-dim text-xs leading-relaxed">FiveM Scripts with Heart 💚</p>
            <div className={styles.brandBadge}>Official</div>
          </div>

          <div className="flex gap-12">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-dim mb-3">
                  {title}
                </div>
                <ul className="flex flex-col gap-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted hover:text-text transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-xs text-muted hover:text-text transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-borderlt">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-[11px] text-dim">
            Copyright &copy; {new Date().getFullYear()} MSK Scripts. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-dim">This is an official site by MSK Scripts.</p>
            <span className="text-dim text-[11px]">|</span>
            <a href="https://tebex.io" target="_blank" rel="noopener noreferrer" className="text-[11px] text-dim hover:text-muted transition-colors">
              Powered by Tebex
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

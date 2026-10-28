import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { layoutTranslations, type Lang } from '@/lib/i18n'

/**
 * The 404 page inside the shop layout. Rendered by the catch-all for an
 * address the route table does not know, and by `app/[lang]/not-found.tsx`
 * when a page calls `notFound()` (an unknown package id, say).
 */
export function NotFoundContent({ lang }: { lang: Lang }) {
  const t = layoutTranslations[lang]
  return (
    <div className="container-page py-[clamp(4rem,2rem+6vw,10rem)]">
      <div className="grid max-w-[40rem] gap-5">
        <span className="kicker">{t.not_found_kicker}</span>
        <h1 className="text-display font-[750] tracking-[-0.02em]">{t.not_found_title}</h1>
        <p className="max-w-[34rem] text-lead text-[var(--color-muted-foreground)]">{t.not_found_text}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">{t.not_found_home}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/fivem">
              {t.not_found_fivem}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

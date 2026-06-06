'use client';

import { useRouter }    from 'next/navigation';
import { setLangCookie } from '@/lib/lang';
import type { Lang }    from '@/lib/i18n';
import { cn }           from '@/lib/utils';

// Server-Komponente liest die Sprache aus dem Cookie; dieser Toggle setzt das
// Cookie und triggert ein router.refresh(), wodurch die Seite neu gerendert wird.
export default function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-1 text-xs font-semibold">
      {(['en', 'de'] as const).map((l) => (
        <button
          key={l}
          onClick={() => { setLangCookie(l); router.refresh(); }}
          className={cn(
            'rounded px-2.5 py-1 uppercase transition-colors',
            lang === l
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

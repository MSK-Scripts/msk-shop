'use client'

import type { ReactNode } from 'react'

import { CopyField } from '@/components/dashboard/CopyField'
import { dashboardTranslations, type Lang } from '@/lib/i18n'

/**
 * "Point an A record here": the steps before the domain field (plan 6.4).
 *
 * Shared by both custom-domain flows, the transcripts one and the bot
 * dashboard one. The requirement is identical, and two copies of this block
 * would drift; the one that drifts is always the one nobody looks at.
 *
 * The last step is the form itself, passed in as `children`, so the field
 * stands where the list says "enter it below" and nowhere else.
 */
export function DnsSteps({ lang, serverIp, children }: {
  lang: Lang
  serverIp: string
  children: ReactNode
}) {
  const t = dashboardTranslations[lang]
  return (
    <ol className="grid gap-5">
      <Step n={1} title={t.dns_step1}>
        <dl className="grid max-w-[44rem] gap-x-6 gap-y-2 text-small @xl:grid-cols-[max-content_1fr]">
          <dt className="text-[var(--color-muted-foreground)]">{t.dns_type}</dt>
          <dd className="font-mono font-semibold">A</dd>
          <dt className="text-[var(--color-muted-foreground)]">{t.dns_name}</dt>
          <dd>{t.dns_name_value}</dd>
          <dt className="self-center text-[var(--color-muted-foreground)]">{t.dns_target}</dt>
          <dd>
            {serverIp
              ? <CopyField value={serverIp} copy={{ copy: t.botdash_copy, copied: t.botdash_copied, failed: t.botdash_copy_failed }} />
              : <span className="text-[var(--color-muted-foreground)]">{t.dns_target_missing}</span>}
          </dd>
        </dl>
      </Step>
      <Step n={2} title={t.dns_step2_title}>
        <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.dns_step2}</p>
      </Step>
      <Step n={3} title={t.dns_step3_title}>
        <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.dns_step3}</p>
        {children}
      </Step>
    </ol>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-2">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-[var(--color-primary)] font-semibold tabular-nums text-[var(--color-primary)]"
      >
        {n}
      </span>
      <div className="grid min-w-0 gap-2 pt-1">
        <p className="font-semibold">{title}</p>
        {children}
      </div>
    </li>
  )
}

import type { Lang } from '@/lib/i18n'

/**
 * Which language notice a legal page carries at the top.
 *
 * The legal texts follow German law, the German version is the original. Under
 * `/en` each page says how the translation relates to it, and the wording
 * differs on purpose (draft "Rechtstexte" of 27.10.2026, section 1.3):
 *
 *   - terms: the German version prevails, but a consumer may rely on the
 *     English one where it is more favourable (unclear terms go against the
 *     user of the terms, § 305c (2) BGB; Art. 5 Directive 93/13/EEC),
 *   - DPA: the German version prevails; it is only concluded with
 *     businesses, so the consumer sentence is left out,
 *   - privacy policy and withdrawal instructions: no precedence clause at
 *     all. Information under Art. 12 GDPR has to be right in the version the
 *     reader reads, and a faulty withdrawal instruction keeps the period from
 *     starting (§ 356 (3) BGB),
 *   - imprint: nothing.
 *
 * Under `/de` the pages with a notice get a small link to the translation.
 */
export type LegalNoticeKind = 'terms' | 'dpa' | 'privacy' | 'withdrawal' | 'imprint'

export interface LegalNotice {
  /** Bold first sentence, if any. */
  lead?: string
  text: string
  /** Text of the link to the other language version. */
  link: string
}

const EN: Record<LegalNoticeKind, LegalNotice | null> = {
  terms: {
    lead: 'This is an English translation of the German original.',
    text: 'Contract languages are German and English. If the two versions differ, the German version prevails. '
      + 'If you are a consumer, you may rely on this English version wherever it is more favourable to you.',
    link: 'Read the German version',
  },
  dpa: {
    lead: 'This is an English translation of the German original.',
    text: 'If the two versions differ, the German version prevails.',
    link: 'Read the German version',
  },
  privacy: {
    text: 'This privacy policy is also available in German. Both versions have the same content and are updated together.',
    link: 'Read the German version',
  },
  withdrawal: {
    text: 'Also available in German.',
    link: 'Read the German version',
  },
  imprint: null,
}

export function legalNotice(kind: LegalNoticeKind, lang: Lang): LegalNotice | null {
  if (lang === 'en') return EN[kind]
  return EN[kind] ? { text: '', link: 'Englische Übersetzung' } : null
}

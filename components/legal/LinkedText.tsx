import { Fragment, type ReactNode } from 'react'

/**
 * A sentence from `legalCopy` (lib/i18n.ts) with its link set in place.
 *
 * The draft legal copy keeps whole sentences, so the reviewed wording can
 * replace them in one go; the part in square brackets is the link text and
 * `{name}` placeholders take `values`. Splitting a sentence into three keys
 * around its link would scatter it again.
 */
export function LinkedText({
  template, values, link,
}: {
  template: string
  values?: Record<string, string>
  /** Renders the bracketed part. Without it the text stays plain. */
  link?: (text: string) => ReactNode
}) {
  let text = template
  for (const [key, value] of Object.entries(values ?? {})) text = text.replaceAll(`{${key}}`, value)
  const parts = text.split(/\[([^\]]+)\]/)
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{i % 2 === 1 && link ? link(part) : part}</Fragment>
      ))}
    </>
  )
}

/**
 * The bits of Discord's message markup the bot puts into a giveaway embed,
 * read into a small tree the preview renders as React text (EmbedPreview).
 *
 * Nothing here produces HTML. Every piece of text stays a string, and React
 * escapes it: an embed whose title is `<img onerror=…>` shows those
 * characters, it does not become an element. What is understood:
 *
 *   `<t:1793556000:R>`  a timestamp, `R` relative, the other styles absolute
 *   `<@123…>`, `<@!123…>`  a user mention
 *   `<@&123…>`  a role mention
 *   `<#123…>`  a channel mention
 *   `<:name:123…>`, `<a:name:123…>`  a custom emoji, shown by its name
 *   `**bold**`  the one emphasis the bot's texts use
 *
 * Anything else, a lone `<` or an unknown tag, is plain text.
 */

export type MarkupNode =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; children: MarkupNode[] }
  | { kind: 'time'; at: number; style: string }
  | { kind: 'user'; id: string }
  | { kind: 'role'; id: string }
  | { kind: 'channel'; id: string }
  | { kind: 'emoji'; name: string }

const SNOWFLAKE = '(\\d{17,20})'
const TOKEN = new RegExp(
  [
    '<t:(-?\\d{1,13})(?::([tTdDfFR]))?>',
    `<@!?${SNOWFLAKE}>`,
    `<@&${SNOWFLAKE}>`,
    `<#${SNOWFLAKE}>`,
    `<a?:(\\w{2,32}):${SNOWFLAKE}>`,
  ].join('|'),
  'g',
)
const BOLD = /\*\*([^*]+?)\*\*/g

function inline(text: string): MarkupNode[] {
  const out: MarkupNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) })
    if (m[1] !== undefined) out.push({ kind: 'time', at: Number(m[1]) * 1000, style: m[2] ?? 'f' })
    else if (m[3] !== undefined) out.push({ kind: 'user', id: m[3] })
    else if (m[4] !== undefined) out.push({ kind: 'role', id: m[4] })
    else if (m[5] !== undefined) out.push({ kind: 'channel', id: m[5] })
    else if (m[6] !== undefined) out.push({ kind: 'emoji', name: m[6] })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

/** The markup of one embed text as a tree of plain strings and known tokens. */
export function parseMarkup(text: string | null | undefined): MarkupNode[] {
  if (!text) return []
  const out: MarkupNode[] = []
  let last = 0
  for (const m of text.matchAll(BOLD)) {
    const at = m.index ?? 0
    if (at > last) out.push(...inline(text.slice(last, at)))
    out.push({ kind: 'bold', children: inline(m[1]) })
    last = at + m[0].length
  }
  if (last < text.length) out.push(...inline(text.slice(last)))
  return out
}

/** A Discord colour integer as `#rrggbb`, or null when it is none. */
export function embedColor(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 0xffffff) return null
  return `#${value.toString(16).padStart(6, '0')}`
}

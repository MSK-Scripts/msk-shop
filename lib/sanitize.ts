import sanitizeHtml from 'sanitize-html'

// Sanitizer for Tebex package/category descriptions. These come from a
// third-party API and are rendered via dangerouslySetInnerHTML, so we strip
// scripts, inline event handlers and dangerous URL schemes while keeping the
// formatting tags Tebex actually uses (headings, lists, links, images, …).
// Defense-in-depth on top of the strict CSP — even if the upstream content
// were tampered with, no executable markup survives.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'figure', 'figcaption', 'span',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'style'],
    a:   ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  // Drop href/src using javascript:, data:, etc. — only safe schemes survive.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    // Force safe rel on every link.
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

// ── Emoji shortcodes ────────────────────────────────────────────────────────
// Tebex' markdown renderer does NOT convert GitHub-style `:shortcode:` emoji,
// so they leak into the page as literal text (e.g. ":star2: The new …").
// We map the shortcodes that actually appear in our descriptions to Unicode.
// Unknown shortcodes are left untouched on purpose (no accidental replacements).
const EMOJI: Record<string, string> = {
  star2: '🌟', sparkles: '✨', clipboard: '📋', rocket: '🚀', fire: '🔥',
  gear: '⚙️', wrench: '🔧', hammer: '🔨', lock: '🔒', key: '🔑',
  shield: '🛡️', package: '📦', books: '📚', book: '📖', art: '🎨',
  zap: '⚡', tada: '🎉', warning: '⚠️', bulb: '💡', gem: '💎',
  globe_with_meridians: '🌐', computer: '💻', video_game: '🎮', car: '🚗',
  white_check_mark: '✅', heavy_check_mark: '✔️', x: '❌', star: '⭐',
  link: '🔗', bell: '🔔', money_with_wings: '💸', credit_card: '💳',
  page_facing_up: '📄', wave: '👋', point_right: '👉', mag: '🔍',
  floppy_disk: '💾', satellite: '📡', construction: '🚧', new: '🆕',
}

function replaceEmojiShortcodes(html: string): string {
  return html.replace(/:([a-z0-9_+-]+):/gi, (full, name: string) => {
    const emoji = EMOJI[name.toLowerCase()]
    return emoji ?? full
  })
}

// ── GFM pipe tables ─────────────────────────────────────────────────────────
// Tebex does not support GitHub-flavoured pipe tables either: the whole table
// arrives as raw pipe text inside a single <p>. We detect those paragraphs and
// rebuild a real <table>. Cell content may already contain inline HTML (links),
// which survives because '|' never appears inside the cells.
function splitPipeRow(line: string): string[] {
  // Strip a single leading/trailing pipe, then split on the remaining pipes.
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map(c => c.trim())
}

const SEPARATOR_CELL = /^:?-{1,}:?$/

function convertPipeTables(html: string): string {
  return html.replace(/<p>([\s\S]*?)<\/p>/g, (full, inner: string) => {
    const lines = inner
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)

    // Need at least a header row + separator row, all starting with a pipe.
    if (lines.length < 2 || !lines.every(l => l.startsWith('|'))) return full

    const sepCells = splitPipeRow(lines[1])
    const isSeparator = sepCells.length > 0 && sepCells.every(c => SEPARATOR_CELL.test(c))
    if (!isSeparator) return full

    const headerCells = splitPipeRow(lines[0])
    const bodyLines = lines.slice(2)

    // If the header row is entirely empty (common for "spec" key/value tables),
    // skip <thead> and render every row as a plain key/value body row.
    const headerEmpty = headerCells.every(c => c.length === 0)

    const cell = (tag: 'th' | 'td', c: string) => `<${tag}>${c}</${tag}>`
    const row = (tag: 'th' | 'td', cells: string[]) =>
      `<tr>${cells.map(c => cell(tag, c)).join('')}</tr>`

    const thead = headerEmpty ? '' : `<thead>${row('th', headerCells)}</thead>`
    const bodyRows = bodyLines.map(l => row('td', splitPipeRow(l))).join('')
    const tbody = `<tbody>${bodyRows}</tbody>`

    return `<table>${thead}${tbody}</table>`
  })
}

/**
 * Schneidet aus einer zweisprachigen Tebex-Beschreibung den passenden Block.
 *
 * Die Kategorietexte im Store sind als ein einziges HTML gepflegt, in der Form
 * `<p><strong>[GER]</strong></p><p>…</p><p><strong>[ENG]</strong></p><p>…</p>`.
 * Bis zum 22.08.2026 landete das komplett auf der Seite, also beide Sprachen
 * untereinander, und `plainExcerpt()` nahm für die Meta-Description immer den
 * deutschen Anfang, auch auf der englischen Fassung.
 *
 * Fehlt einer der beiden Marker, bleibt der Text unangetastet. Lieber der ganze
 * Text als ein halber, wenn die Struktur nicht die erwartete ist.
 *
 * Die Ränder werden bewusst nur grob geputzt: der Schnitt hinterlässt vorne
 * verwaiste schließende und hinten verwaiste öffnende Tags. Beides räumt
 * `sanitizeTebexHtml()` ohnehin auf, hier fallen nur die leeren Hüllen weg,
 * damit kein leerer Absatz stehen bleibt.
 */
export function pickLanguageBlock(html: string, lang: 'en' | 'de'): string {
  const ger = html.search(/\[GER\]/i)
  const eng = html.search(/\[ENG\]/i)
  if (ger < 0 || eng < 0) return html

  const wanted = lang === 'de' ? ger : eng
  const other  = lang === 'de' ? eng : ger
  const start  = wanted + 5
  const slice  = other > wanted ? html.slice(start, other) : html.slice(start)

  return slice
    .replace(/^(?:\s*<\/[a-z][^>]*>\s*)+/i, '')
    .replace(/(?:\s*<[a-z][^>]*>\s*)+$/i, '')
    .trim()
}

export function sanitizeTebexHtml(html: string | null | undefined): string {
  const pre = convertPipeTables(replaceEmojiShortcodes(html ?? ''))
  return sanitizeHtml(pre, OPTIONS)
}

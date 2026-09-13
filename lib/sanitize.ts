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
 * Cuts the matching block out of a bilingual Tebex description.
 *
 * The category texts in the store are maintained as a single HTML string, in
 * the form `<p><strong>[GER]</strong></p><p>…</p><p><strong>[ENG]</strong></p><p>…</p>`.
 * Until 22.08.2026 all of it ended up on the page, so both languages one below
 * the other, and `plainExcerpt()` always took the German opening for the meta
 * description, even on the English version.
 *
 * If either marker is missing, the text is left untouched. Better the whole
 * text than half of it when the structure is not the expected one.
 *
 * The edges are deliberately only roughly cleaned: the cut leaves orphaned
 * closing tags at the front and orphaned opening tags at the back.
 * `sanitizeTebexHtml()` cleans up both anyway, here only the empty shells are
 * dropped so that no empty paragraph is left behind.
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
    // The whitespace deliberately sits on only **one** side of the group. With
    // `\s*` at both ends, the same whitespace can be claimed by the end of one
    // repetition and by the start of the next, and for an input text that does
    // not match at the very end after all, the engine tries every possible
    // split. Measured with `'<a>' + ' <a>'.repeat(26) + '!'`:
    // 25.7 seconds before, 0 ms after (CodeQL js/redos, alert 69).
    .replace(/^\s*(?:<\/[a-z][^>]*>\s*)+/i, '')
    .replace(/(?:\s*<[a-z][^>]*>)+\s*$/i, '')
    .trim()
}

export function sanitizeTebexHtml(html: string | null | undefined): string {
  const pre = convertPipeTables(replaceEmojiShortcodes(html ?? ''))
  return sanitizeHtml(pre, OPTIONS)
}

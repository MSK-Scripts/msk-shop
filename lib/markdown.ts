import fs from 'fs'
import path from 'path'

const LEGAL_DIR = path.join(process.cwd(), 'content', 'legal')
// Allowlist of valid slugs — prevents path traversal attacks
const ALLOWED_SLUGS = ['impressum', 'privacy', 'terms'] as const
type LegalSlug = typeof ALLOWED_SLUGS[number]

export function getLegalContent(slug: string): string {
  // Validate slug against allowlist to prevent path traversal (e.g. ../../.env.local)
  if (!ALLOWED_SLUGS.includes(slug as LegalSlug)) {
    throw new Error(`Invalid legal slug: ${slug}`)
  }
  const filePath = path.join(LEGAL_DIR, `${slug}.md`)
  return fs.readFileSync(filePath, 'utf-8')
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty lines
    if (line.trim() === '') {
      i++
      continue
    }

    // H1
    if (line.startsWith('# ')) {
      output.push(`<h1 class="text-3xl font-extrabold text-white mb-4">${inline(line.slice(2))}</h1>`)
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      output.push(`<h2 class="text-white text-lg font-bold mt-10 mb-3 pt-2">${inline(line.slice(3))}</h2>`)
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      output.push(`<h3 class="text-white font-semibold mt-5 mb-2">${inline(line.slice(4))}</h3>`)
      i++
      continue
    }

    // Unordered list — collect consecutive list items
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(`<li class="ml-1">${inline(lines[i].slice(2))}</li>`)
        i++
      }
      output.push(`<ul class="list-disc pl-5 mt-3 mb-6 space-y-1">${items.join('')}</ul>`)
      continue
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('- ')
    ) {
      paraLines.push(inline(lines[i]))
      i++
    }
    if (paraLines.length > 0) {
      output.push(`<p class="mt-3 mb-5 leading-relaxed">${paraLines.join('<br />')}</p>`)
    }
  }

  return output.join('\n')
}

// Inline formatting: bold, italic, links
function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /\[(.+?)\]\((https?:\/\/.+?)\)/g,
      '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(
      /\[(.+?)\]\((mailto:.+?)\)/g,
      '<a href="$2" class="text-accent hover:underline">$1</a>'
    )
}

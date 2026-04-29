import fs from 'fs'
import path from 'path'

const LEGAL_DIR = path.join(process.cwd(), 'content', 'legal')

const ALLOWED_SLUGS = ['imprint', 'imprint-de', 'privacy', 'privacy-de', 'terms', 'terms-de'] as const
type LegalSlug = typeof ALLOWED_SLUGS[number]

export function getLegalContent(slug: string): string {
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

    // Empty line
    if (line.trim() === '') { i++; continue }

    // Horizontal rule ---
    if (/^-{3,}$/.test(line.trim())) {
      output.push('<hr class="border-borderlt my-6" />')
      i++; continue
    }

    // H1
    if (line.startsWith('# ')) {
      output.push(`<h1 class="text-3xl font-extrabold text-white mb-4">${inline(line.slice(2))}</h1>`)
      i++; continue
    }

    // H2
    if (line.startsWith('## ')) {
      output.push(`<h2 class="text-white text-lg font-bold mt-10 mb-3 pt-2">${inline(line.slice(3))}</h2>`)
      i++; continue
    }

    // H3
    if (line.startsWith('### ')) {
      output.push(`<h3 class="text-white font-semibold mt-5 mb-2">${inline(line.slice(4))}</h3>`)
      i++; continue
    }

    // Table — lines starting with |
    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      output.push(renderTable(tableLines))
      continue
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(`<li class="leading-relaxed">${inline(lines[i].slice(2))}</li>`)
        i++
      }
      output.push(`<ul class="list-disc pl-5 mt-3 mb-5 space-y-1.5">${items.join('')}</ul>`)
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li class="leading-relaxed">${inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`)
        i++
      }
      output.push(`<ol class="list-decimal pl-5 mt-3 mb-5 space-y-1.5">${items.join('')}</ol>`)
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('- ') &&
      !lines[i].startsWith('|') &&
      !/^-{3,}$/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i])
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

function renderTable(lines: string[]): string {
  // Filter separator rows like |---|---|
  const rows = lines.filter(l => !/^\|[\s\-:|]+\|$/.test(l.trim()))
  if (rows.length === 0) return ''

  const parseRow = (row: string): string[] =>
    row.split('|').slice(1, -1).map(cell => cell.trim())

  const [headerRow, ...bodyRows] = rows

  const headers = parseRow(headerRow)
    .map(h => `<th class="text-left px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wide">${inline(h)}</th>`)
    .join('')

  const body = bodyRows.map((row, ri) => {
    const cells = parseRow(row)
      .map(c => `<td class="px-4 py-2.5 text-xs leading-relaxed">${inline(c)}</td>`)
      .join('')
    const bg = ri % 2 === 1 ? 'bg-surface2/30' : ''
    return `<tr class="border-t border-borderlt ${bg}">${cells}</tr>`
  }).join('')

  return `<div class="overflow-x-auto my-5 rounded-lg border border-borderlt">
  <table class="w-full text-muted border-collapse">
    <thead><tr class="bg-surface2">${headers}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</div>`
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-surface2 text-accent text-xs font-mono px-1.5 py-0.5 rounded">$1</code>')
    .replace(
      /\[(.+?)\]\((https?:\/\/.+?)\)/g,
      '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(
      /\[(.+?)\]\((mailto:.+?)\)/g,
      '<a href="$2" class="text-accent hover:underline">$1</a>'
    )
}

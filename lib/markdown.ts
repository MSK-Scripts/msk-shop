import fs from 'fs'
import path from 'path'

const LEGAL_DIR = path.join(process.cwd(), 'content', 'legal')

const ALLOWED_SLUGS = [
  'imprint', 'imprint-de',
  'privacy', 'privacy-de',
  'terms',   'terms-de',
  // Widerrufsbelehrung (§ 356a BGB) und Auftragsverarbeitungsvertrag (Art. 28
  // DSGVO). Die Liste ist der Pfad-Traversal-Schutz dieser Datei — ein neuer
  // Rechtstext ohne Eintrag hier wirft, statt irgendeine Datei zu lesen.
  'widerruf', 'widerruf-de',
  'avv',      'avv-de',
] as const
type LegalSlug = typeof ALLOWED_SLUGS[number]

export function getLegalContent(slug: string): string {
  if (!ALLOWED_SLUGS.includes(slug as LegalSlug)) {
    throw new Error(`Invalid legal slug: ${slug}`)
  }
  const filePath = path.join(LEGAL_DIR, `${slug}.md`)
  return fs.readFileSync(filePath, 'utf-8')
}

// Renders markdown to plain HTML — styled via .legal-content CSS class in globals.css
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
      output.push('<hr />')
      i++; continue
    }

    // H1
    if (line.startsWith('# ')) {
      output.push(`<h1>${inline(line.slice(2))}</h1>`)
      i++; continue
    }

    // H2
    if (line.startsWith('## ')) {
      output.push(`<h2>${inline(line.slice(3))}</h2>`)
      i++; continue
    }

    // H3
    if (line.startsWith('### ')) {
      output.push(`<h3>${inline(line.slice(4))}</h3>`)
      i++; continue
    }

    // Blockquote — aufeinanderfolgende Zeilen mit '>'
    //
    // Gebraucht wird das genau einmal, aber an einer Stelle, an der es zählt:
    // der Hinweis auf das Widerspruchsrecht nach Art. 21 DSGVO muss sich vom
    // Fließtext abheben (die Aufsichtsbehörden verlangen eine hervorgehobene
    // Darstellung). Ohne diesen Zweig stand dort ein sichtbares '>' im Text.
    if (line.startsWith('>')) {
      const quoted: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoted.push(inline(lines[i].replace(/^>\s?/, '')))
        i++
      }
      output.push(`<blockquote><p>${quoted.join('<br />')}</p></blockquote>`)
      continue
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

    // Unordered list — supports - and *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`)
        i++
      }
      output.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`)
        i++
      }
      output.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('- ') &&
      !lines[i].startsWith('* ') &&
      !lines[i].startsWith('|') &&
      !lines[i].startsWith('>') &&
      !/^-{3,}$/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(inline(lines[i]))
      i++
    }
    if (paraLines.length > 0) {
      output.push(`<p>${paraLines.join('<br />')}</p>`)
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
    .map(h => `<th>${inline(h)}</th>`)
    .join('')

  const body = bodyRows.map(row => {
    const cells = parseRow(row)
      .map(c => `<td>${inline(c)}</td>`)
      .join('')
    return `<tr>${cells}</tr>`
  }).join('')

  return `<div class="table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div>`
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(
      /\[(.+?)\]\((https?:\/\/.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(
      /\[(.+?)\]\((mailto:.+?)\)/g,
      '<a href="$2">$1</a>'
    )
}

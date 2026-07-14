'use client'

// Composite editor for snippets.jsonc → snippets[]. Each snippet has
// name/description/content plus an optional embed (title + color, or null).

import { Plus, Trash2, ChevronDown } from 'lucide-react'
import type { FieldDef } from '@/lib/botconfig/schema'
import { DEFAULT_SNIPPET } from '@/lib/botconfig/schema'
import type { JSONPath } from '@/lib/botconfig/jsoncEdit'
import { getAtPath } from '@/lib/botconfig/jsoncEdit'
import type { Lang } from '@/lib/i18n'
import FormRenderer from './FormRenderer'
import { Toggle } from './inputs'

const L = (en: string, de: string) => ({ en, de })

function snippetFields(i: number): FieldDef[] {
  const b = (k: string): JSONPath => ['snippets', i, k]
  return [
    { path: b('name'), kind: 'text', label: L('Name', 'Name'), help: L('Used in /snippet send <name> (lowercase, no spaces).', 'Genutzt in /snippet send <name> (Kleinbuchstaben, keine Leerzeichen).') },
    { path: b('description'), kind: 'text', label: L('Description', 'Beschreibung') },
    { path: b('content'), kind: 'textarea', label: L('Content', 'Inhalt'), help: L('Placeholders: {user}, {staff}, {type}, {priority}.', 'Platzhalter: {user}, {staff}, {type}, {priority}.') },
  ]
}

function embedFields(i: number): FieldDef[] {
  const b = (k: string): JSONPath => ['snippets', i, 'embed', k]
  return [
    { path: b('title'), kind: 'text', label: L('Embed title', 'Embed-Titel') },
    { path: b('color'), kind: 'color', label: L('Embed color', 'Embed-Farbe') },
  ]
}

export default function SnippetsEditor({
  model, lang, edit, append, remove,
}: {
  model: unknown
  lang: Lang
  edit: (path: JSONPath, value: unknown) => void
  append: (arrayPath: JSONPath, item: unknown) => void
  remove: (arrayPath: JSONPath, index: number) => void
}) {
  const snippets = (getAtPath(model, ['snippets']) as unknown[]) ?? []

  return (
    <div className="flex flex-col gap-3">
      {snippets.map((s, i) => {
        const ss = (s ?? {}) as Record<string, unknown>
        const name = (ss.name as string) || `#${i + 1}`
        const hasEmbed = ss.embed != null
        return (
          <details key={i} className="group bg-surface2 border border-borderlt rounded-lg" open={i === 0}>
            <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180" />
                {name}
              </span>
              <button
                type="button"
                onClick={e => { e.preventDefault(); remove(['snippets'], i) }}
                className="text-danger/70 hover:text-danger transition-colors p-1"
                title={lang === 'de' ? 'Snippet entfernen' : 'Remove snippet'}
              >
                <Trash2 size={15} />
              </button>
            </summary>

            <div className="px-4 pb-4 pt-1 border-t border-borderlt flex flex-col gap-4">
              <FormRenderer model={model} fields={snippetFields(i)} lang={lang} onEdit={edit} issues={[]} />

              <div className="border-t border-borderlt pt-3">
                <Toggle
                  checked={hasEmbed}
                  onChange={on => edit(['snippets', i, 'embed'], on ? { title: '', color: '#5865F2' } : null)}
                  label={lang === 'de' ? 'Als Embed senden' : 'Send as embed'}
                />
                {hasEmbed && (
                  <div className="mt-3">
                    <FormRenderer model={model} fields={embedFields(i)} lang={lang} onEdit={edit} issues={[]} />
                  </div>
                )}
              </div>
            </div>
          </details>
        )
      })}

      <button
        type="button"
        onClick={() => append(['snippets'], DEFAULT_SNIPPET)}
        className="msk-btn-ghost justify-center"
      >
        <Plus size={15} /> {lang === 'de' ? 'Snippet hinzufügen' : 'Add snippet'}
      </button>
    </div>
  )
}

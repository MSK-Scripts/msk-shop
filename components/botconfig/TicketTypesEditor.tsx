'use client'

// Composite editor for config.jsonc → ticketTypes[] (up to 25), each with a
// nested questions[] builder (up to 5). Scalar fields reuse FormRenderer by
// constructing a FieldDef[] for the given array index; questions are rendered
// the same way plus add/remove controls.

import { Plus, Trash2, ChevronDown } from 'lucide-react'
import type { FieldDef } from '@/lib/botconfig/schema'
import { PRIORITY_OPTIONS, QUESTION_STYLE_OPTIONS, DEFAULT_TICKET_TYPE, DEFAULT_QUESTION } from '@/lib/botconfig/schema'
import type { SemanticIssue } from '@/lib/botconfig/validateConfig'
import type { JSONPath } from '@/lib/botconfig/jsoncEdit'
import { getAtPath } from '@/lib/botconfig/jsoncEdit'
import type { Lang } from '@/lib/i18n'
import FormRenderer from './FormRenderer'

const L = (en: string, de: string) => ({ en, de })
const MAX_TYPES = 25
const MAX_QUESTIONS = 5

function typeFields(i: number): FieldDef[] {
  const b = (k: string): JSONPath => ['ticketTypes', i, k]
  return [
    { path: b('codeName'), kind: 'text', label: L('Code name', 'Code-Name'), help: L('Lowercase, used internally.', 'Kleinbuchstaben, intern verwendet.') },
    { path: b('name'), kind: 'text', label: L('Display name', 'Anzeigename') },
    { path: b('description'), kind: 'text', label: L('Description', 'Beschreibung') },
    { path: b('emoji'), kind: 'emoji', label: L('Emoji', 'Emoji') },
    { path: b('color'), kind: 'color', label: L('Color', 'Farbe') },
    { path: b('categoryId'), kind: 'text', idKind: 'category', label: L('Category ID', 'Kategorie-ID') },
    { path: b('priority'), kind: 'select', options: PRIORITY_OPTIONS, label: L('Start priority', 'Start-Priorität') },
    { path: b('ticketNameOption'), kind: 'text', label: L('Channel name template', 'Kanalname-Vorlage'), help: L('USERNAME, USERID, TICKETCOUNT or empty for default.', 'USERNAME, USERID, TICKETCOUNT oder leer für Standard.') },
    { path: b('customDescription'), kind: 'textarea', label: L('Custom opening message', 'Eigene Eröffnungsnachricht') },
    { path: b('cantAccess'), kind: 'idList', idKind: 'role', label: L('Roles that cannot open this type', 'Rollen ohne Zugriff auf diesen Typ') },
    { path: b('staffRoles'), kind: 'idList', idKind: 'role', label: L('Type-specific staff roles', 'Typ-spezifische Team-Rollen') },
    { path: b('askQuestions'), kind: 'toggle', label: L('Ask questions on open', 'Fragen beim Öffnen stellen') },
  ]
}

function questionFields(ti: number, qi: number): FieldDef[] {
  const b = (k: string): JSONPath => ['ticketTypes', ti, 'questions', qi, k]
  return [
    { path: b('label'), kind: 'text', label: L('Label', 'Label') },
    { path: b('placeholder'), kind: 'text', label: L('Placeholder', 'Platzhalter') },
    { path: b('style'), kind: 'select', options: QUESTION_STYLE_OPTIONS, label: L('Style', 'Stil') },
    { path: b('maxLength'), kind: 'number', min: 1, label: L('Max length', 'Max. Länge') },
  ]
}

export default function TicketTypesEditor({
  model, lang, edit, append, remove, issues,
}: {
  model: unknown
  lang: Lang
  edit: (path: JSONPath, value: unknown) => void
  append: (arrayPath: JSONPath, item: unknown) => void
  remove: (arrayPath: JSONPath, index: number) => void
  issues: SemanticIssue[]
}) {
  const types = (getAtPath(model, ['ticketTypes']) as unknown[]) ?? []

  return (
    <div className="flex flex-col gap-3">
      {types.map((t, i) => {
        const tt = (t ?? {}) as Record<string, unknown>
        const name = (tt.name as string) || (tt.codeName as string) || `#${i + 1}`
        const questions = Array.isArray(tt.questions) ? (tt.questions as unknown[]) : []
        const asks = Boolean(tt.askQuestions)
        return (
          <details key={i} className="group bg-surface2 border border-borderlt rounded-lg" open={i === 0}>
            <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180" />
                {(tt.emoji as string) || '🎫'} {name}
              </span>
              <button
                type="button"
                onClick={e => { e.preventDefault(); remove(['ticketTypes'], i) }}
                className="text-danger/70 hover:text-danger transition-colors p-1"
                title={lang === 'de' ? 'Typ entfernen' : 'Remove type'}
              >
                <Trash2 size={15} />
              </button>
            </summary>

            <div className="px-4 pb-4 pt-1 border-t border-borderlt flex flex-col gap-4">
              <FormRenderer model={model} fields={typeFields(i)} lang={lang} onEdit={edit} issues={issues} />

              {asks && (
                <div className="border-t border-borderlt pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">
                      {lang === 'de' ? 'Fragen' : 'Questions'} ({questions.length}/{MAX_QUESTIONS})
                    </p>
                    <button
                      type="button"
                      disabled={questions.length >= MAX_QUESTIONS}
                      onClick={() => append(['ticketTypes', i, 'questions'], DEFAULT_QUESTION)}
                      className="msk-btn-ghost text-xs disabled:opacity-40"
                    >
                      <Plus size={13} /> {lang === 'de' ? 'Frage' : 'Question'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {questions.map((_, qi) => (
                      <div key={qi} className="bg-surface border border-borderlt rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-muted-foreground">#{qi + 1}</span>
                          <button
                            type="button"
                            onClick={() => remove(['ticketTypes', i, 'questions'], qi)}
                            className="text-danger/70 hover:text-danger transition-colors p-0.5"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <FormRenderer model={model} fields={questionFields(i, qi)} lang={lang} onEdit={edit} issues={issues} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        )
      })}

      <button
        type="button"
        disabled={types.length >= MAX_TYPES}
        onClick={() => append(['ticketTypes'], DEFAULT_TICKET_TYPE)}
        className="msk-btn-ghost justify-center disabled:opacity-40"
      >
        <Plus size={15} /> {lang === 'de' ? 'Ticket-Typ hinzufügen' : 'Add ticket type'} ({types.length}/{MAX_TYPES})
      </button>
    </div>
  )
}

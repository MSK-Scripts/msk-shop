'use client'

// Top-level form container for one config file. Parses the shared `content`
// string, wires the comment-preserving edit helpers, and renders the right
// form: config.jsonc → schema sections (+ ticketTypes composite),
// snippets.jsonc → SnippetsEditor. (.env is handled by EnvEditor separately.)

import { AlertTriangle, ChevronDown } from 'lucide-react'
import { CONFIG_SCHEMA } from '@/lib/botconfig/schema'
import type { SemanticIssue } from '@/lib/botconfig/validateConfig'
import {
  safeParse, editValue, appendArrayItem, removeArrayItem, type JSONPath,
} from '@/lib/botconfig/jsoncEdit'
import type { Lang } from '@/lib/i18n'
import FormRenderer from './FormRenderer'
import TicketTypesEditor from './TicketTypesEditor'
import SnippetsEditor from './SnippetsEditor'

export type FormFile = 'config' | 'snippet'

export default function ConfigForm({
  file, content, onContentChange, lang, issues,
}: {
  file: FormFile
  content: string
  onContentChange: (next: string) => void
  lang: Lang
  issues: SemanticIssue[]
}) {
  const model = safeParse(content)

  // Comment-preserving edit callbacks bound to the current content string.
  const edit = (path: JSONPath, value: unknown) => onContentChange(editValue(content, path, value))
  const append = (arrayPath: JSONPath, item: unknown) => onContentChange(appendArrayItem(content, arrayPath, item))
  const remove = (arrayPath: JSONPath, index: number) => onContentChange(removeArrayItem(content, arrayPath, index))

  if (model === undefined || typeof model !== 'object' || model === null) {
    return (
      <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 rounded-lg px-3 py-2.5 text-xs text-danger">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          {lang === 'de'
            ? 'Die Datei enthält Syntaxfehler und kann nicht als Formular angezeigt werden. Bitte im Datei-Modus korrigieren.'
            : 'This file has syntax errors and cannot be shown as a form. Please fix it in file mode.'}
        </span>
      </div>
    )
  }

  if (file === 'snippet') {
    return <SnippetsEditor model={model} lang={lang} edit={edit} append={append} remove={remove} />
  }

  return (
    <div className="flex flex-col gap-3">
      {CONFIG_SCHEMA.map((section, idx) => (
        <details key={section.id} className="group bg-surface border border-borderlt rounded-lg" open={idx === 0}>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm font-semibold text-foreground">
            <ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180" />
            {section.title[lang]}
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-borderlt flex flex-col gap-4">
            {section.composite === 'ticketTypes' && (
              <TicketTypesEditor model={model} lang={lang} edit={edit} append={append} remove={remove} issues={issues} />
            )}
            {section.fields.length > 0 && (
              <FormRenderer model={model} fields={section.fields} lang={lang} onEdit={edit} issues={issues} />
            )}
          </div>
        </details>
      ))}
    </div>
  )
}

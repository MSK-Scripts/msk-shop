'use client'

// Generic renderer: turns a list of FieldDefs into inputs, reading each value
// from the parsed model at its JSONPath and reporting edits back via onEdit.

import type { FieldDef } from '@/lib/botconfig/schema'
import type { SemanticIssue } from '@/lib/botconfig/validateConfig'
import type { JSONPath } from '@/lib/botconfig/jsoncEdit'
import { getAtPath } from '@/lib/botconfig/jsoncEdit'
import type { Lang } from '@/lib/i18n'
import {
  Field, Toggle, Select, TextField, TextArea, NumberInput, ColorPicker, EmojiInput, TagInput,
} from './inputs'

const samePath = (a: JSONPath, b: JSONPath) =>
  a.length === b.length && a.every((v, i) => v === b[i])

export function issueFor(issues: SemanticIssue[], path: JSONPath, lang: Lang): string | undefined {
  const hit = issues.find(i => i.path && samePath(i.path, path) && i.severity === 'error')
  return hit?.message[lang]
}

export default function FormRenderer({
  model, fields, lang, onEdit, issues,
}: {
  model: unknown
  fields: FieldDef[]
  lang: Lang
  onEdit: (path: JSONPath, value: unknown) => void
  issues: SemanticIssue[]
}) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map(f => {
        const raw = getAtPath(model, f.path)
        const err = issueFor(issues, f.path, lang)
        const key = f.path.join('.')

        if (f.kind === 'toggle') {
          return (
            <Toggle
              key={key}
              checked={Boolean(raw)}
              onChange={v => onEdit(f.path, v)}
              label={f.label[lang]}
              help={f.help?.[lang]}
            />
          )
        }

        const label = f.label[lang]
        const help = f.help?.[lang]
        const str = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)

        return (
          <Field key={key} label={label} help={help} error={err}>
            {f.kind === 'select' && (
              <Select value={str} onChange={v => onEdit(f.path, v)} options={f.options ?? []} lang={lang} />
            )}
            {f.kind === 'text' && (
              <TextField value={str} onChange={v => onEdit(f.path, v)} />
            )}
            {f.kind === 'textarea' && (
              <TextArea value={str} onChange={v => onEdit(f.path, v)} />
            )}
            {f.kind === 'number' && (
              <NumberInput
                value={typeof raw === 'number' ? raw : Number(raw) || 0}
                onChange={v => onEdit(f.path, v)}
                min={f.min}
                max={f.max}
              />
            )}
            {f.kind === 'color' && (
              <ColorPicker
                value={str}
                onChange={v => onEdit(f.path, v)}
                emptyHint={lang === 'de' ? 'leer = mainColor' : 'empty = mainColor'}
              />
            )}
            {f.kind === 'emoji' && (
              <EmojiInput value={str} onChange={v => onEdit(f.path, v)} />
            )}
            {f.kind === 'idList' && (
              <TagInput
                value={Array.isArray(raw) ? (raw as string[]) : []}
                onChange={v => onEdit(f.path, v)}
                idKind={f.idKind}
              />
            )}
          </Field>
        )
      })}
    </div>
  )
}

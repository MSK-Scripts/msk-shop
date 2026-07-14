'use client'

// Structured .env editor. Non-secret fields are controlled directly by the
// shared `content` string. Secret fields are masked: if a value is already set
// the input stays empty with a "leave blank to keep" placeholder and only
// patches `content` once the user actually types a new value.

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ENV_SCHEMA } from '@/lib/botconfig/schema'
import { parseEnv, setEnvValue } from '@/lib/botconfig/envEdit'
import { validateBotEnv } from '@/lib/botconfig/validateConfig'
import type { Lang } from '@/lib/i18n'
import { Field, TextField } from './inputs'

const PLACEHOLDER_RE = /^YOUR_.*_HERE$/

export default function EnvEditor({
  content, onChange, lang,
}: {
  content: string
  onChange: (next: string) => void
  lang: Lang
}) {
  // Local drafts for secret fields (absence = untouched → keep existing value).
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const env = parseEnv(content)
  const valueMap = new Map<string, string>([...env].map(([k, v]) => [k, v.value]))
  const warnings = validateBotEnv(valueMap)

  const isSet = (key: string) => {
    const v = env.get(key)?.value?.trim() ?? ''
    return v !== '' && !PLACEHOLDER_RE.test(v)
  }

  return (
    <div className="flex flex-col gap-4">
      {ENV_SCHEMA.map(f => {
        const label = f.label[lang] + (f.optional ? (lang === 'de' ? ' (optional)' : ' (optional)') : '')
        const help = f.help[lang]

        if (f.secret) {
          const touched = f.key in drafts
          const keepHint = lang === 'de' ? '•••• gesetzt — leer lassen zum Beibehalten' : '•••• set — leave blank to keep'
          return (
            <Field key={f.key} label={label} help={help}>
              <TextField
                value={touched ? drafts[f.key] : ''}
                placeholder={!touched && isSet(f.key) ? keepHint : ''}
                onChange={v => {
                  setDrafts(d => ({ ...d, [f.key]: v }))
                  onChange(setEnvValue(content, f.key, v))
                }}
              />
            </Field>
          )
        }

        return (
          <Field key={f.key} label={label} help={help}>
            <TextField
              value={env.get(f.key)?.value ?? ''}
              onChange={v => onChange(setEnvValue(content, f.key, v))}
            />
          </Field>
        )
      })}

      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5">
          {warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-yellow-400">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w.message[lang]}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

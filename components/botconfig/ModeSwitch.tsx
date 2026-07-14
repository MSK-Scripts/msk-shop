'use client'

import { LayoutList, FileCode } from 'lucide-react'
import type { Lang } from '@/lib/i18n'

export type ViewMode = 'form' | 'file'

export default function ModeSwitch({
  value, onChange, lang,
}: {
  value: ViewMode
  onChange: (v: ViewMode) => void
  lang: Lang
}) {
  const items: { id: ViewMode; label: string; Icon: typeof LayoutList }[] = [
    { id: 'form', label: lang === 'de' ? 'Formular' : 'Form', Icon: LayoutList },
    { id: 'file', label: lang === 'de' ? 'Datei' : 'File', Icon: FileCode },
  ]
  return (
    <div className="flex gap-1 bg-surface2 border border-borderlt rounded-lg p-1">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            value === id ? 'bg-accent text-black' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  )
}

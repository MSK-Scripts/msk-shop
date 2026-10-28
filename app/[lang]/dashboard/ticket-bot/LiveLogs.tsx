'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { useLang } from '@/components/i18n/LangProvider'
import { Pause, Play, Pulse, Trash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { dashboardTranslations } from '@/lib/i18n'
import { botLogStreamUrl } from './ticketBotApi'

/** At most this many lines stay in the console; older ones fall off the top. */
const MAX_LINES = 500

/**
 * Colour of a log line on the console surface. The colours are chosen
 * against `--color-console`, which is dark in both themes (tests/contrast.test.ts
 * measures every pair). No opacity suffixes: `/60` on the red of a stack line
 * landed at 3.2:1, the dimmed colour says the same and passes.
 */
export function logLineClass(line: string): string {
  if (line.startsWith('==>'))                                    return 'text-[var(--color-log-dim)] font-semibold pt-2'
  if (/\[FATAL\]|\[ERROR\]/.test(line))                         return 'text-[var(--color-log-error)]'
  if (/\[WARN\s*\]|\[WARN\]/.test(line))                        return 'text-[var(--color-log-warn)]'
  if (/\[OK\s*\]/.test(line) || line.includes('✔'))             return 'text-[var(--color-log-ok)]'
  if (/\[INFO\s*\]/.test(line))                                 return 'text-[var(--color-log-info)]'
  if (/\[Commands\]|\[Events\]|\[Components\]/.test(line))      return 'text-[var(--color-log-dim)]'
  if (/\[Ready\]|\[StaffReminder\]/.test(line))                 return 'text-[var(--color-log-ok)]'
  if (line.trim().startsWith('at '))                            return 'text-[var(--color-log-dim)] pl-4'
  return 'text-[var(--color-log-text)]'
}

/**
 * The live output of a hosted bot (plan 6.3 `LogViewer`, 6.4 "Logs").
 *
 * A tool for finding faults, not the centre of the page: it stays closed
 * until someone connects. While connected the text moves by itself, so it can
 * be paused (WCAG 2.2.2); lines that arrive meanwhile are kept and appear on
 * resume. The surface is the console token in both themes.
 */
export function LiveLogs({ guildId }: { guildId: string }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [frozen, setFrozen] = useState<string[] | null>(null)
  const [connection, setConnection] = useState<'disconnected' | 'connected' | 'error'>('disconnected')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    sourceRef.current?.close()
    setLines([])
    setConnection('disconnected')

    const es = new EventSource(botLogStreamUrl(guildId))
    sourceRef.current = es

    es.onmessage = (e: MessageEvent<string>) => {
      let line: string
      try {
        line = JSON.parse(e.data) as string
      } catch {
        return // ignore malformed or partial frames instead of breaking the console
      }
      setLines(prev => {
        const next = [...prev, line]
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next
      })
    }

    es.onerror = () => {
      // CONNECTING (0): the browser reconnects by itself, leave it be.
      // CLOSED (2): a permanent failure such as 401 or 403, clean up.
      setConnection('error')
      if (es.readyState === EventSource.CLOSED) sourceRef.current = null
    }

    es.onopen = () => setConnection('connected')
  }, [guildId])

  const disconnect = useCallback(() => {
    sourceRef.current?.close()
    sourceRef.current = null
    setConnection('disconnected')
  }, [])

  const shown = frozen ?? lines

  // Follow the newest line, unless paused.
  useEffect(() => {
    if (frozen || !scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines, frozen])

  // Close the stream when the page goes away.
  useEffect(() => () => { sourceRef.current?.close() }, [])

  function toggle() {
    if (!open) {
      setOpen(true)
      connect()
    } else {
      setOpen(false)
      setFrozen(null)
      disconnect()
      setLines([])
    }
  }

  return (
    <SectionCard
      title={t.bot_live_logs_title}
      description={t.bot_live_logs_desc}
      actions={
        open && connection === 'connected' ? <StatusBadge tone="success" icon={Pulse}>{t.bot_live_connected}</StatusBadge>
          : open && connection === 'error' ? <StatusBadge tone="warning">{t.bot_live_reconnecting}</StatusBadge>
          : <StatusBadge tone="neutral">{t.bot_live_disconnected}</StatusBadge>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={toggle} aria-pressed={open}>
            {open ? t.bot_live_disconnect : t.bot_live_connect}
          </Button>
          {open && (
            <Button variant="outline" onClick={() => setFrozen(frozen ? null : lines)} aria-pressed={frozen !== null}>
              {frozen ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {frozen ? t.bot_live_resume : t.bot_live_pause}
            </Button>
          )}
          {open && shown.length > 0 && (
            <Button variant="ghost" onClick={() => { setLines([]); setFrozen(f => (f ? [] : null)) }}>
              <Trash className="h-4 w-4" />
              {t.bot_live_clear}
            </Button>
          )}
        </div>

        {frozen && <p role="status" className="text-small text-[var(--color-muted-foreground)]">{t.bot_live_paused}</p>}

        {open && (
          <div
            ref={scrollRef}
            role="log"
            aria-label={t.bot_live_label}
            tabIndex={0}
            className="h-[clamp(16rem,45dvh,40rem)] overflow-y-auto rounded-md bg-[var(--color-console)] p-3 font-mono text-[0.8125rem] leading-relaxed"
          >
            {shown.length === 0 ? (
              <span className="text-[var(--color-log-dim)]">{t.bot_live_empty}</span>
            ) : (
              shown.map((line, i) => (
                <div key={i} className={`whitespace-pre-wrap break-all ${logLineClass(line)}`}>{line}</div>
              ))
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

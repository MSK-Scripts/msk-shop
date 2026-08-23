'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  AlertCircle, CheckCircle, Info, Loader2, RefreshCw,
  Play, Square, RotateCcw, Terminal, Download, X, ScrollText, Activity,
} from 'lucide-react'
import { dashboardTranslations, type Lang } from '@/lib/i18n'

// ── Types ──────────────────────────────────────────────────────────────────────
//
// This panel is the OUT-OF-BAND recovery layer for a hosted bot: it drives the
// PM2 process (the supervisor / dashboard.js) and streams its logs. Editing the
// bot's configuration, tickets, stats and per-user permissions now lives in the
// bot's own dashboard, reached via the "Open bot dashboard" button, so it is not
// duplicated here. Keeping start/stop/restart/update + logs at the PM2 level is
// deliberate: it still works when the supervisor or the bot dashboard is down,
// which is exactly when you need to bring things back up.

type BotStatus = 'online' | 'stopped' | 'stopping' | 'launching' | 'errored' | 'not_found' | 'unknown'

type Msg = { type: 'success' | 'error' | 'info'; text: string; detail?: string }

// ── Log line styling ───────────────────────────────────────────────────────────

// Farben gegen `--color-console` gewählt, die Fläche ist in beiden Themes
// dunkel. Bewusst ohne Deckkraft-Suffixe: `/60` auf dem Rot der Stapelzeilen
// landete bei 3,2:1, die gedämpfte Farbe sagt dasselbe und besteht.
function logLineClass(line: string): string {
  if (line.startsWith('==>'))                                    return 'text-[var(--color-log-dim)] font-semibold text-[10px] pt-2'
  if (/\[FATAL\]|\[ERROR\]/.test(line))                         return 'text-[var(--color-log-error)]'
  if (/\[WARN\s*\]|\[WARN\]/.test(line))                        return 'text-[var(--color-log-warn)]'
  if (/\[OK\s*\]/.test(line) || line.includes('✔'))             return 'text-[var(--color-log-ok)]'
  if (/\[INFO\s*\]/.test(line))                                 return 'text-[var(--color-log-info)]'
  if (/\[Commands\]|\[Events\]|\[Components\]/.test(line))      return 'text-[var(--color-log-dim)]'
  if (/\[Ready\]|\[StaffReminder\]/.test(line))                 return 'text-[var(--color-log-ok)]'
  if (line.trim().startsWith('at ') || line.trim().startsWith('  at ')) return 'text-[var(--color-log-dim)] pl-4'
  return 'text-[var(--color-log-text)]'
}

// ── Status helpers ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: BotStatus | null }) {
  if (!status) return <span className="w-2 h-2 rounded-full bg-border inline-block" />
  const colors: Record<BotStatus, string> = {
    online:    'bg-primary',
    stopped:   'bg-danger',
    stopping:  'bg-[var(--color-warning)]',
    launching: 'bg-[var(--color-warning)] animate-pulse',
    errored:   'bg-[var(--color-danger)] animate-pulse',
    not_found: 'bg-border',
    unknown:   'bg-border',
  }
  return <span className={`w-2 h-2 rounded-full inline-block ${colors[status]}`} />
}

// ── Message Banner ─────────────────────────────────────────────────────────────

function Banner({ msg, onClose }: { msg: Msg; onClose?: () => void }) {
  const styles = {
    success: 'bg-primary/10 border-primary/30 text-primary',
    error:   'bg-danger/10 border-danger/30 text-danger',
    info:    'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30 text-[var(--color-warning)]',
  }
  const Icon = msg.type === 'success' ? CheckCircle : msg.type === 'info' ? Info : AlertCircle
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs ${styles[msg.type]}`}>
      <div className="flex items-start gap-2">
        <Icon size={14} className="shrink-0 mt-0.5" />
        <span className="flex-1">{msg.text}</span>
        {onClose && (
          <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={13} />
          </button>
        )}
      </div>
      {msg.detail && (
        <pre className="mt-2 font-mono text-[11px] opacity-80 whitespace-pre-wrap break-all border-t border-current/20 pt-2">
          {msg.detail}
        </pre>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function BotConfigEditor({ lang, guildId }: { lang: Lang; guildId: string }) {
  const t = dashboardTranslations[lang]

  const STATUS_LABEL: Record<BotStatus, string> = {
    online:    t.bot_status_online,
    stopped:   t.bot_status_stopped,
    stopping:  t.bot_status_stopping,
    launching: t.bot_status_launching,
    errored:   t.bot_status_errored,
    not_found: t.bot_status_not_found,
    unknown:   t.bot_status_unknown,
  }

  // Bot control
  const [botStatus, setBotStatus]           = useState<BotStatus | null>(null)
  // A status fetch is already in flight from mount, so this starts out true.
  const [statusLoading, setStatusLoading]   = useState(true)
  const [actionLoading, setActionLoading]   = useState<'start' | 'stop' | 'restart' | null>(null)
  const [controlMsg, setControlMsg]         = useState<Msg | null>(null)

  // Update
  const [updateLoading, setUpdateLoading]   = useState(false)
  const [updateMsg, setUpdateMsg]           = useState<Msg | null>(null)

  // Logs (static error log)
  const [logs, setLogs]               = useState<string[] | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [showLogs, setShowLogs]       = useState(false)

  // Live log console
  const [liveOpen, setLiveOpen]             = useState(false)
  const [liveLines, setLiveLines]           = useState<string[]>([])
  const [liveStatus, setLiveStatus]         = useState<'disconnected' | 'connected' | 'error'>('disconnected')
  const liveScrollRef = useRef<HTMLDivElement>(null)
  const esRef         = useRef<EventSource | null>(null)

  // ── Bot status ─────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res  = await fetch(`/api/bot-logs?guildId=${guildId}`)
      const data = await res.json() as { lines?: string[]; error?: string }
      setLogs(data.lines ?? [])
    } catch {
      setLogs([])
    } finally { setLogsLoading(false) }
  }, [guildId])

  // Only touches state after the await, so the mount effect below stays free of
  // the extra render pass react-hooks/set-state-in-effect warns about.
  const runStatus = useCallback(async (): Promise<BotStatus | null> => {
    try {
      const res  = await fetch(`/api/bot-control?guildId=${guildId}`)
      const data = await res.json() as { status?: string; error?: string }
      const s    = res.ok ? (data.status as BotStatus ?? 'unknown') : 'unknown'
      setBotStatus(s)
      return s
    } catch {
      setBotStatus('unknown'); return null
    } finally { setStatusLoading(false) }
  }, [guildId])

  /** Refresh from a user action — shows the spinner right away. */
  const fetchStatus = useCallback((): Promise<BotStatus | null> => {
    setStatusLoading(true)
    return runStatus()
  }, [runStatus])

  useEffect(() => {
    async function run() { await runStatus() }
    run()
  }, [runStatus])

  // ── Live logs ──────────────────────────────────────────────────────────────

  const connectLiveLogs = useCallback(() => {
    esRef.current?.close()
    setLiveLines([])
    setLiveStatus('disconnected')

    const es = new EventSource(`/api/bot-logs-stream?guildId=${guildId}`)
    esRef.current = es

    es.onmessage = (e: MessageEvent<string>) => {
      let line: string
      try {
        line = JSON.parse(e.data) as string
      } catch {
        return // ignore malformed/partial frames instead of breaking the console
      }
      setLiveLines(prev => {
        const next = [...prev, line]
        return next.length > 500 ? next.slice(-500) : next
      })
    }

    es.onerror = () => {
      // readyState CONNECTING (0) = browser is auto-reconnecting — don't interfere.
      // readyState CLOSED (2)     = permanent failure (e.g. 401/403) — clean up.
      if (es.readyState === EventSource.CLOSED) {
        setLiveStatus('error')
        esRef.current = null
      } else {
        setLiveStatus('error') // show "reconnecting" label while browser retries
      }
    }

    es.onopen = () => setLiveStatus('connected')
  }, [guildId])

  const disconnectLiveLogs = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    setLiveStatus('disconnected')
  }, [])

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (liveScrollRef.current) {
      liveScrollRef.current.scrollTop = liveScrollRef.current.scrollHeight
    }
  }, [liveLines])

  // Cleanup EventSource on unmount
  useEffect(() => () => { esRef.current?.close() }, [])

  const toggleLiveLogs = () => {
    if (!liveOpen) {
      setLiveOpen(true)
      connectLiveLogs()
    } else {
      setLiveOpen(false)
      disconnectLiveLogs()
      setLiveLines([])
    }
  }

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action); setControlMsg(null); setShowLogs(false); setLogs(null)
    try {
      const res  = await fetch(`/api/bot-control?guildId=${guildId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; detail?: string }
      if (!res.ok) {
        setControlMsg({ type: 'error', text: data.error ?? t.bot_action_failed, detail: data.detail })
        return
      }
      const infoMsg = action === 'start' ? t.bot_starting
        : action === 'stop' ? t.bot_stopping_msg
        : t.bot_restarting
      setControlMsg({ type: 'info', text: infoMsg })

      setTimeout(async () => {
        const s = await fetchStatus()
        if (s === 'errored') {
          setControlMsg({ type: 'error', text: t.bot_crashed })
          setShowLogs(true)
          await fetchLogs()
        } else if (s === 'online' && action !== 'stop') {
          setControlMsg({ type: 'success', text: t.bot_running })
        } else if (s === 'stopped' && action === 'stop') {
          setControlMsg({ type: 'success', text: t.bot_stopped_msg })
        }
      }, 2500)
    } catch {
      setControlMsg({ type: 'error', text: t.bot_err_network })
    } finally { setActionLoading(null) }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    setUpdateLoading(true); setUpdateMsg(null)
    try {
      const res  = await fetch(`/api/bot-control?guildId=${guildId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update' }),
      })
      const data = await res.json() as { ok?: boolean; output?: string; error?: string; detail?: string }
      if (!res.ok) {
        setUpdateMsg({ type: 'error', text: data.error ?? t.bot_update_failed, detail: data.detail })
        return
      }
      const alreadyLatest = (data.output ?? '').includes('Already up to date')
      setUpdateMsg({
        type:   'success',
        text:   alreadyLatest ? t.bot_update_latest : t.bot_update_done,
        detail: data.output,
      })
    } catch {
      setUpdateMsg({ type: 'error', text: t.bot_update_err_network })
    } finally { setUpdateLoading(false) }
  }

  const isBusy      = actionLoading !== null || updateLoading
  const isOnline    = botStatus === 'online'
  const isStopped   = botStatus === 'stopped' || botStatus === 'errored'
  const isTransient = botStatus === 'launching' || botStatus === 'stopping'
  const notFound    = botStatus === 'not_found'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Bot Control Card ──────────────────────────────────────────────── */}
      <div className="bg-surface border border-borderlt rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={18} className="text-primary" />
          <h2 className="text-foreground font-bold text-base">{t.bot_control_title}</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-5">{t.bot_control_desc}</p>

        {/* Status row */}
        <div className="flex items-center justify-between bg-surface2 border border-borderlt rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-2">
            <StatusDot status={botStatus} />
            <span className="text-sm text-foreground font-medium">{botStatus ? STATUS_LABEL[botStatus] : '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            {botStatus === 'errored' && !showLogs && (
              <button
                onClick={() => { setShowLogs(true); void fetchLogs() }}
                className="flex items-center gap-1 text-xs text-[var(--color-warning)] hover:underline transition-colors"
              >
                <ScrollText size={13} /> {t.bot_show_logs}
              </button>
            )}
            <button onClick={() => fetchStatus()} disabled={statusLoading}
              className="text-dim hover:text-muted-foreground transition-colors p-1 rounded" title={t.bot_status_refresh}
            >
              {statusLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          </div>
        </div>

        {/* Error log panel */}
        {showLogs && (
          <div className="mb-4 border border-danger/30 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-danger/10 border-b border-danger/20">
              <span className="text-xs font-mono text-danger font-semibold flex items-center gap-1.5">
                <ScrollText size={12} /> {t.bot_log_title}
              </span>
              <button onClick={() => setShowLogs(false)} className="text-danger/60 hover:text-danger transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-72 p-3 bg-bg">
              {logsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" /> {t.bot_log_loading}
                </div>
              ) : logs && logs.length > 0 ? (
                <pre className="text-[11px] text-danger/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
                  {logs.join('\n')}
                </pre>
              ) : (
                <p className="text-xs text-dim">{t.bot_log_empty}</p>
              )}
            </div>
          </div>
        )}

        {controlMsg && <div className="mb-4"><Banner msg={controlMsg} onClose={() => setControlMsg(null)} /></div>}

        {/* Start / Restart / Stop */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => handleAction('start')}
            disabled={isBusy || isOnline || isTransient || notFound}
            className="msk-btn-ghost flex-1 justify-center" title={t.bot_start_title}
          >
            {actionLoading === 'start' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {t.bot_start}
          </button>

          <button onClick={() => handleAction('restart')}
            disabled={isBusy || isTransient || notFound || botStatus === null}
            className="msk-btn-primary flex-1 justify-center" title={t.bot_restart_title}
          >
            {actionLoading === 'restart' ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            {t.bot_restart}
          </button>

          <button onClick={() => handleAction('stop')}
            disabled={isBusy || isStopped || isTransient || notFound}
            className="msk-btn-ghost flex-1 justify-center text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
            title={t.bot_stop_title}
          >
            {actionLoading === 'stop' ? <Loader2 size={15} className="animate-spin" /> : <Square size={15} />}
            {t.bot_stop}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-borderlt my-4" />

        {/* Update section */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-foreground font-medium mb-0.5">{t.bot_update_title}</p>
            <p className="text-xs text-muted-foreground">{t.bot_update_desc}</p>
          </div>
          <button onClick={handleUpdate} disabled={isBusy}
            className="msk-btn-ghost shrink-0"
            title={t.bot_update_title_attr}
          >
            {updateLoading
              ? <><Loader2 size={15} className="animate-spin" /> {t.bot_updating}</>
              : <><Download size={15} /> {t.bot_update_btn}</>
            }
          </button>
        </div>

        {updateLoading && (
          <p className="mt-2 text-xs text-dim">{t.bot_update_wait}</p>
        )}

        {updateMsg && <div className="mt-3"><Banner msg={updateMsg} onClose={() => setUpdateMsg(null)} /></div>}
      </div>

      {/* ── Live Log Console Card ─────────────────────────────────────────── */}
      <div className="bg-surface border border-borderlt rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            <h2 className="text-foreground font-bold text-base">{t.bot_live_logs_title}</h2>
            {liveStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                {t.bot_live_connected}
              </span>
            )}
            {liveStatus === 'error' && (
              <span className="text-xs text-danger font-semibold">{t.bot_live_reconnecting}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {liveOpen && liveLines.length > 0 && (
              <button
                onClick={() => setLiveLines([])}
                className="text-xs text-dim hover:text-muted-foreground transition-colors px-2 py-1"
              >
                {t.bot_live_clear}
              </button>
            )}
            <button
              onClick={toggleLiveLogs}
              className={`msk-btn-ghost text-sm ${liveOpen ? 'text-danger border-danger/30 hover:bg-danger/10 hover:text-danger' : ''}`}
            >
              {liveOpen ? t.bot_live_disconnect : t.bot_live_connect}
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-4">{t.bot_live_logs_desc}</p>

        {liveOpen && (
          <div
            ref={liveScrollRef}
            className="bg-[var(--color-console)] border border-borderlt rounded-lg p-3 h-80 overflow-y-auto font-mono"
          >
            {liveLines.length === 0 ? (
              <span className="text-xs text-dim">{t.bot_live_empty}</span>
            ) : (
              liveLines.map((line, i) => (
                <div key={i} className={`text-[11px] whitespace-pre-wrap break-all leading-relaxed ${logLineClass(line)}`}>
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  )
}

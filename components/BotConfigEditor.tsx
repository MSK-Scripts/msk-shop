'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import { parse, type ParseError } from 'jsonc-parser'
import {
  Save, FileText, AlertCircle, CheckCircle, Info, Loader2, RefreshCw,
  Play, Square, RotateCcw, Terminal, Download, X, ScrollText, Activity,
} from 'lucide-react'
import { dashboardTranslations, type Lang } from '@/lib/i18n'

// ── Types ──────────────────────────────────────────────────────────────────────

const FILES = ['config', 'snippet', 'env', 'locale'] as const
type ConfigFile = typeof FILES[number]

const FILE_LABEL: Record<ConfigFile, string> = {
  config:  'config.jsonc',
  snippet: 'snippets.jsonc',
  env:     '.env',
  locale:  'locale.json', // placeholder — overridden by server response
}

type LocaleReason = 'missing' | 'no_lang' | 'invalid_lang' | 'config_parse_error' | 'config_missing'

interface LocaleMeta {
  filename:  string
  fallback:  boolean
  reason?:   LocaleReason
  requested?: string
}

type BotStatus = 'online' | 'stopped' | 'stopping' | 'launching' | 'errored' | 'not_found' | 'unknown'

type Msg = { type: 'success' | 'error' | 'info'; text: string; detail?: string }

// ── CodeMirror theme ───────────────────────────────────────────────────────────

const mskTheme = EditorView.theme({
  '&': { backgroundColor: '#1b1b1d', fontSize: '13px' },
  '.cm-content': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    padding: '12px 0',
  },
  '.cm-gutters': { backgroundColor: '#242526', borderRight: '1px solid #2e2f31', color: '#5c6370' },
  '.cm-activeLineGutter': { backgroundColor: '#2a2b2e' },
  '.cm-activeLine':       { backgroundColor: 'rgba(255,255,255,0.03)' },
  '.cm-cursor':           { borderLeftColor: '#5eb131' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(94,177,49,0.25) !important' },
  '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(94,177,49,0.25)' },
  '.cm-foldPlaceholder': { backgroundColor: '#2a2b2e', border: '1px solid #3d3d3f', color: '#8d9096' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
}, { dark: true })

// ── Validation ─────────────────────────────────────────────────────────────────

function validateJsonc(content: string, lang: Lang): string | null {
  const errors: ParseError[] = []
  parse(content, errors, { allowTrailingComma: true })
  if (errors.length === 0) return null
  return lang === 'de'
    ? `Syntaxfehler gefunden (${errors.length} Fehler). Kommentare mit // und /* */ sind erlaubt.`
    : `Syntax error found (${errors.length} error(s)). Comments with // and /* */ are allowed.`
}

function validateEnv(content: string, lang: Lang): string | null {
  const invalid: number[] = []
  content.split('\n').forEach((line, i) => {
    const t = line.trim()
    if (t === '' || t.startsWith('#')) return
    if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) invalid.push(i + 1)
  })
  if (invalid.length === 0) return null
  if (lang === 'de') {
    const where = invalid.length === 1 ? `Zeile ${invalid[0]}` : `Zeilen ${invalid.join(', ')}`
    return `Ungültiges .env-Format in ${where}. Erlaubt: SCHLÜSSEL=WERT, leere Zeilen und # Kommentare.`
  }
  const where = invalid.length === 1 ? `line ${invalid[0]}` : `lines ${invalid.join(', ')}`
  return `Invalid .env format on ${where}. Allowed: KEY=VALUE, empty lines and # comments.`
}

function validateJsonStrict(content: string, lang: Lang): string | null {
  try {
    JSON.parse(content)
    return null
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'parse error'
    return lang === 'de'
      ? `JSON-Syntaxfehler: ${detail}. Locale-Dateien erlauben keine Kommentare.`
      : `JSON syntax error: ${detail}. Locale files do not allow comments.`
  }
}

const validate = (file: ConfigFile, content: string, lang: Lang) => {
  if (file === 'env')    return validateEnv(content, lang)
  if (file === 'locale') return validateJsonStrict(content, lang)
  return validateJsonc(content, lang)
}

// ── Log line styling ───────────────────────────────────────────────────────────

function logLineClass(line: string): string {
  if (line.startsWith('==>'))                                    return 'text-accent/50 font-semibold text-[10px] pt-2'
  if (/\[FATAL\]|\[ERROR\]/.test(line))                         return 'text-red-400'
  if (/\[WARN\s*\]|\[WARN\]/.test(line))                        return 'text-yellow-400'
  if (/\[OK\s*\]/.test(line) || line.includes('✔'))             return 'text-green-400'
  if (/\[INFO\s*\]/.test(line))                                 return 'text-sky-400/90'
  if (/\[Commands\]|\[Events\]|\[Components\]/.test(line))      return 'text-zinc-400'
  if (/\[Ready\]|\[StaffReminder\]/.test(line))                 return 'text-accent/80'
  if (line.trim().startsWith('at ') || line.trim().startsWith('  at ')) return 'text-red-400/60 pl-4'
  return 'text-zinc-300'
}

// ── Status helpers ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: BotStatus | null }) {
  if (!status) return <span className="w-2 h-2 rounded-full bg-border inline-block" />
  const colors: Record<BotStatus, string> = {
    online:    'bg-accent',
    stopped:   'bg-danger',
    stopping:  'bg-yellow-400',
    launching: 'bg-yellow-400 animate-pulse',
    errored:   'bg-orange-500 animate-pulse',
    not_found: 'bg-border',
    unknown:   'bg-border',
  }
  return <span className={`w-2 h-2 rounded-full inline-block ${colors[status]}`} />
}

// ── Message Banner ─────────────────────────────────────────────────────────────

function Banner({ msg, onClose }: { msg: Msg; onClose?: () => void }) {
  const styles = {
    success: 'bg-accent/10 border-accent/30 text-accent',
    error:   'bg-danger/10 border-danger/30 text-danger',
    info:    'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
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

export default function BotConfigEditor({ lang, nonce }: { lang: Lang; nonce?: string }) {
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

  // Config editor
  const [activeFile, setActiveFile]     = useState<ConfigFile>('config')
  const [content, setContent]           = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loadingGet, setLoadingGet]     = useState(false)
  const [loadingSave, setLoadingSave]   = useState(false)
  const [editorMsg, setEditorMsg]       = useState<Msg | null>(null)
  const [localeMeta, setLocaleMeta]     = useState<LocaleMeta | null>(null)

  // Bot control
  const [botStatus, setBotStatus]           = useState<BotStatus | null>(null)
  const [statusLoading, setStatusLoading]   = useState(false)
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

  const isDirty = content !== savedContent

  // ── Config loading ─────────────────────────────────────────────────────────

  const loadFile = useCallback(async (file: ConfigFile) => {
    setLoadingGet(true)
    setEditorMsg(null)
    if (file === 'locale') setLocaleMeta(null)
    try {
      const res  = await fetch(`/api/bot-config?file=${file}`)
      const data = await res.json() as {
        content?: string; error?: string;
        filename?: string; fallback?: boolean; reason?: LocaleReason; requested?: string;
      }
      if (!res.ok) {
        setEditorMsg({ type: 'error', text: data.error ?? t.bot_err_load })
        setContent(''); setSavedContent(''); return
      }
      setContent(data.content ?? ''); setSavedContent(data.content ?? '')
      if (file === 'locale' && data.filename) {
        setLocaleMeta({
          filename:  data.filename,
          fallback:  !!data.fallback,
          reason:    data.reason,
          requested: data.requested,
        })
      }
    } catch {
      setEditorMsg({ type: 'error', text: t.bot_err_network_load })
    } finally { setLoadingGet(false) }
  }, [t])

  useEffect(() => { loadFile(activeFile) }, [activeFile, loadFile])

  const handleTabSwitch = (file: ConfigFile) => {
    if (file === activeFile) return
    if (isDirty && !confirm(t.bot_unsaved_confirm)) return
    setActiveFile(file)
  }

  const handleSave = async () => {
    const err = validate(activeFile, content, lang)
    if (err) { setEditorMsg({ type: 'error', text: err }); return }

    setLoadingSave(true); setEditorMsg(null)
    try {
      const res  = await fetch(`/api/bot-config?file=${activeFile}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setEditorMsg({ type: 'error', text: data.error ?? t.bot_err_load }); return }
      setSavedContent(content)
      const fileLabel = activeFile === 'locale' && localeMeta?.filename
        ? localeMeta.filename
        : FILE_LABEL[activeFile]
      setEditorMsg({ type: 'success', text: `${fileLabel} ${t.bot_saved_msg}` })
      // After saving a fallback file, refresh meta so the banner disappears.
      if (activeFile === 'locale' && localeMeta?.fallback) {
        void loadFile('locale')
      }
    } catch {
      setEditorMsg({ type: 'error', text: t.bot_err_network_save })
    } finally { setLoadingSave(false) }
  }

  // ── Bot status ─────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res  = await fetch('/api/bot-logs')
      const data = await res.json() as { lines?: string[]; error?: string }
      setLogs(data.lines ?? [])
    } catch {
      setLogs([])
    } finally { setLogsLoading(false) }
  }, [])

  const fetchStatus = useCallback(async (): Promise<BotStatus | null> => {
    setStatusLoading(true)
    try {
      const res  = await fetch('/api/bot-control')
      const data = await res.json() as { status?: string; error?: string }
      const s    = res.ok ? (data.status as BotStatus ?? 'unknown') : 'unknown'
      setBotStatus(s)
      return s
    } catch {
      setBotStatus('unknown'); return null
    } finally { setStatusLoading(false) }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // ── Live logs ──────────────────────────────────────────────────────────────

  const connectLiveLogs = useCallback(() => {
    esRef.current?.close()
    setLiveLines([])
    setLiveStatus('disconnected')

    const es = new EventSource('/api/bot-logs-stream')
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
  }, [])

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
      const res  = await fetch('/api/bot-control', {
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
      const res  = await fetch('/api/bot-control', {
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

      {/* ── Bot Control + Live Logs — side by side ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

      {/* ── Bot Control Card ──────────────────────────────────────────────── */}
      <div className="bg-surface border border-borderlt rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={18} className="text-accent" />
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
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
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
            <Activity size={18} className="text-accent" />
            <h2 className="text-foreground font-bold text-base">{t.bot_live_logs_title}</h2>
            {liveStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
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
            className="bg-bg border border-borderlt rounded-lg p-3 h-80 overflow-y-auto font-mono"
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

      </div>{/* end grid: Bot Control + Live Logs */}

      {/* ── Config Editor Card ────────────────────────────────────────────── */}
      <div className="bg-surface border border-borderlt rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={18} className="text-accent" />
          <h2 className="text-foreground font-bold text-base">{t.bot_config_title}</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-5">{t.bot_config_desc}</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface2 border border-borderlt rounded-lg p-1 mb-4 w-fit">
          {FILES.map(f => {
            const isLocale = f === 'locale'
            const label = isLocale && localeMeta?.filename
              ? (localeMeta.fallback ? `${localeMeta.filename} (fallback)` : localeMeta.filename)
              : FILE_LABEL[f]
            return (
              <button key={f} onClick={() => handleTabSwitch(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                  f === activeFile ? 'bg-accent text-black' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            )
          })}
          <button onClick={() => loadFile(activeFile)} disabled={loadingGet}
            className="ml-1 px-2 py-1.5 rounded text-dim hover:text-muted-foreground transition-colors" title={t.bot_reload}
          >
            {loadingGet ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>

        {/* .env warning */}
        {activeFile === 'env' && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-yellow-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{t.bot_env_warning}</span>
          </div>
        )}

        {/* Locale fallback banner */}
        {activeFile === 'locale' && localeMeta?.fallback && (() => {
          const fname = localeMeta.filename
          const req   = localeMeta.requested ?? fname
          const text =
            localeMeta.reason === 'missing'
              ? t.bot_locale_fb_missing.replace('{requested}', req).replace('{filename}', fname)
              : localeMeta.reason === 'no_lang'
                ? t.bot_locale_fb_no_lang
                : localeMeta.reason === 'invalid_lang'
                  ? t.bot_locale_fb_invalid
                  : t.bot_locale_fb_cfg_err // config_missing / config_parse_error
          return (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-yellow-400">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>{text}</span>
            </div>
          )
        })()}

        {editorMsg && <div className="mb-3"><Banner msg={editorMsg} onClose={() => setEditorMsg(null)} /></div>}

        {/* Editor */}
        <div className="border border-borderlt rounded-lg overflow-hidden mb-4">
          {loadingGet ? (
            <div className="flex items-center justify-center h-64 bg-bg">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CodeMirror
              value={content} height="700px"
              extensions={[
                // Nonce CodeMirror's runtime-injected <style> elements so the
                // strict `style-src 'self' 'nonce-…'` CSP doesn't block them
                // (without this the editor renders blank).
                ...(nonce ? [EditorView.cspNonce.of(nonce)] : []),
                ...(activeFile !== 'env' ? [json(), mskTheme] : [mskTheme]),
              ]}
              theme="dark"
              onChange={(val) => { setContent(val); setEditorMsg(null) }}
              basicSetup={{
                lineNumbers: true, highlightActiveLineGutter: true, highlightActiveLine: true,
                foldGutter: activeFile !== 'env', autocompletion: false,
                bracketMatching: activeFile !== 'env', closeBrackets: activeFile !== 'env',
                indentOnInput: true,
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-dim">{isDirty && !loadingGet ? t.bot_unsaved : ''}</span>
          <button onClick={handleSave} disabled={loadingSave || loadingGet || !isDirty} className="msk-btn-primary">
            {loadingSave
              ? <><Loader2 size={15} className="animate-spin" /> {t.bot_saving}</>
              : <><Save size={15} /> {t.bot_save}</>
            }
          </button>
        </div>
      </div>

    </div>
  )
}

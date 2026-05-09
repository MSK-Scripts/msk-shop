'use client'

import { useState, useEffect, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import { parse, type ParseError } from 'jsonc-parser'
import {
  Save, FileText, AlertCircle, CheckCircle, Info, Loader2, RefreshCw,
  Play, Square, RotateCcw, Terminal, Download, X, ScrollText,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

const FILES = ['config', 'snippet', 'env'] as const
type ConfigFile = typeof FILES[number]

const FILE_LABEL: Record<ConfigFile, string> = {
  config:  'config.jsonc',
  snippet: 'snippet.jsonc',
  env:     '.env',
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

function validateJsonc(content: string): string | null {
  const errors: ParseError[] = []
  parse(content, errors, { allowTrailingComma: true })
  return errors.length === 0 ? null
    : `Syntaxfehler gefunden (${errors.length} Fehler). Kommentare mit // und /* */ sind erlaubt.`
}

function validateEnv(content: string): string | null {
  const invalid: number[] = []
  content.split('\n').forEach((line, i) => {
    const t = line.trim()
    if (t === '' || t.startsWith('#')) return
    if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) invalid.push(i + 1)
  })
  if (invalid.length === 0) return null
  return `Ungültiges .env-Format in ${invalid.length === 1 ? `Zeile ${invalid[0]}` : `Zeilen ${invalid.join(', ')}`}. Erlaubt: SCHLÜSSEL=WERT, leere Zeilen und # Kommentare.`
}

const validate = (file: ConfigFile, content: string) =>
  file === 'env' ? validateEnv(content) : validateJsonc(content)

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BotStatus, string> = {
  online:    'Online',
  stopped:   'Gestoppt',
  stopping:  'Wird gestoppt…',
  launching: 'Startet…',
  errored:   'Fehler / Abgestürzt',
  not_found: 'Nicht registriert',
  unknown:   'Unbekannt',
}

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

export default function BotConfigEditor() {
  // Config editor
  const [activeFile, setActiveFile]     = useState<ConfigFile>('config')
  const [content, setContent]           = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loadingGet, setLoadingGet]     = useState(false)
  const [loadingSave, setLoadingSave]   = useState(false)
  const [editorMsg, setEditorMsg]       = useState<Msg | null>(null)

  // Bot control
  const [botStatus, setBotStatus]           = useState<BotStatus | null>(null)
  const [statusLoading, setStatusLoading]   = useState(false)
  const [actionLoading, setActionLoading]   = useState<'start' | 'stop' | 'restart' | null>(null)
  const [controlMsg, setControlMsg]         = useState<Msg | null>(null)

  // Update
  const [updateLoading, setUpdateLoading]   = useState(false)
  const [updateMsg, setUpdateMsg]           = useState<Msg | null>(null)

  // Logs
  const [logs, setLogs]           = useState<string[] | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [showLogs, setShowLogs]   = useState(false)

  const isDirty = content !== savedContent

  // ── Config loading ─────────────────────────────────────────────────────────

  const loadFile = useCallback(async (file: ConfigFile) => {
    setLoadingGet(true)
    setEditorMsg(null)
    try {
      const res  = await fetch(`/api/bot-config?file=${file}`)
      const data = await res.json() as { content?: string; error?: string }
      if (!res.ok) {
        setEditorMsg({ type: 'error', text: data.error ?? 'Fehler beim Laden der Datei' })
        setContent(''); setSavedContent(''); return
      }
      setContent(data.content ?? ''); setSavedContent(data.content ?? '')
    } catch {
      setEditorMsg({ type: 'error', text: 'Netzwerkfehler beim Laden' })
    } finally { setLoadingGet(false) }
  }, [])

  useEffect(() => { loadFile(activeFile) }, [activeFile, loadFile])

  const handleTabSwitch = (file: ConfigFile) => {
    if (file === activeFile) return
    if (isDirty && !confirm('Du hast ungespeicherte Änderungen. Tab trotzdem wechseln?')) return
    setActiveFile(file)
  }

  const handleSave = async () => {
    const err = validate(activeFile, content)
    if (err) { setEditorMsg({ type: 'error', text: err }); return }

    setLoadingSave(true); setEditorMsg(null)
    try {
      const res  = await fetch(`/api/bot-config?file=${activeFile}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setEditorMsg({ type: 'error', text: data.error ?? 'Fehler beim Speichern' }); return }
      setSavedContent(content)
      setEditorMsg({ type: 'success', text: `${FILE_LABEL[activeFile]} gespeichert — starte den Bot neu, damit die Änderungen aktiv werden.` })
    } catch {
      setEditorMsg({ type: 'error', text: 'Netzwerkfehler beim Speichern' })
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

  // Returns the new status so callers can react to it immediately
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

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action); setControlMsg(null); setShowLogs(false); setLogs(null)
    try {
      const res  = await fetch('/api/bot-control', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; detail?: string }
      if (!res.ok) {
        setControlMsg({ type: 'error', text: data.error ?? 'Aktion fehlgeschlagen', detail: data.detail })
        return
      }
      const label = { start: 'gestartet', stop: 'gestoppt', restart: 'neugestartet' }[action]
      setControlMsg({ type: 'info', text: `Bot wird ${label}…` })

      // Poll status after PM2 has time to update; auto-show logs on crash
      setTimeout(async () => {
        const s = await fetchStatus()
        if (s === 'errored') {
          setControlMsg({ type: 'error', text: 'Der Bot ist abgestürzt. Fehler-Log wird geladen…' })
          setShowLogs(true)
          await fetchLogs()
        } else if (s === 'online' && action !== 'stop') {
          setControlMsg({ type: 'success', text: 'Bot läuft.' })
        } else if (s === 'stopped' && action === 'stop') {
          setControlMsg({ type: 'success', text: 'Bot wurde gestoppt.' })
        }
      }, 2500)
    } catch {
      setControlMsg({ type: 'error', text: 'Netzwerkfehler' })
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
        setUpdateMsg({ type: 'error', text: data.error ?? 'Update fehlgeschlagen', detail: data.detail })
        return
      }
      const alreadyLatest = (data.output ?? '').includes('Already up to date')
      setUpdateMsg({
        type:   'success',
        text:   alreadyLatest ? 'Der Bot ist bereits auf dem neuesten Stand.' : 'Update abgeschlossen. Starte den Bot neu, um die neue Version zu laden.',
        detail: data.output,
      })
    } catch {
      setUpdateMsg({ type: 'error', text: 'Netzwerkfehler beim Update' })
    } finally { setUpdateLoading(false) }
  }

  const isBusy      = actionLoading !== null || updateLoading  // any operation running
  const isActing    = actionLoading !== null
  const isOnline    = botStatus === 'online'
  const isStopped   = botStatus === 'stopped' || botStatus === 'errored'
  const isTransient = botStatus === 'launching' || botStatus === 'stopping'
  const notFound    = botStatus === 'not_found'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Config Editor Card ────────────────────────────────────────────── */}
      <div className="bg-surface border border-borderlt rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={18} className="text-accent" />
          <h2 className="text-white font-bold text-base">Bot Konfiguration</h2>
        </div>
        <p className="text-muted text-sm mb-5">
          Bearbeite die Konfigurationsdateien deines Bots. Gespeicherte Änderungen werden erst nach einem Neustart aktiv.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface2 border border-borderlt rounded-lg p-1 mb-4 w-fit">
          {FILES.map(f => (
            <button key={f} onClick={() => handleTabSwitch(f)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                f === activeFile ? 'bg-accent text-black' : 'text-muted hover:text-white'
              }`}
            >
              {FILE_LABEL[f]}
            </button>
          ))}
          <button onClick={() => loadFile(activeFile)} disabled={loadingGet}
            className="ml-1 px-2 py-1.5 rounded text-dim hover:text-muted transition-colors" title="Neu laden"
          >
            {loadingGet ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
        </div>

        {/* .env warning */}
        {activeFile === 'env' && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5 mb-4 text-xs text-yellow-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Die <code className="font-mono">.env</code>-Datei enthält sensible Zugangsdaten wie den Discord-Token. Gib diese nicht weiter.</span>
          </div>
        )}

        {editorMsg && <div className="mb-3"><Banner msg={editorMsg} onClose={() => setEditorMsg(null)} /></div>}

        {/* Editor */}
        <div className="border border-borderlt rounded-lg overflow-hidden mb-4">
          {loadingGet ? (
            <div className="flex items-center justify-center h-64 bg-bg">
              <Loader2 size={20} className="animate-spin text-muted" />
            </div>
          ) : (
            <CodeMirror
              value={content} height="420px"
              extensions={activeFile !== 'env' ? [json(), mskTheme] : [mskTheme]}
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
          <span className="text-xs text-dim">{isDirty && !loadingGet ? '● Ungespeicherte Änderungen' : ''}</span>
          <button onClick={handleSave} disabled={loadingSave || loadingGet || !isDirty} className="msk-btn-primary">
            {loadingSave ? <><Loader2 size={15} className="animate-spin" /> Speichert...</> : <><Save size={15} /> Speichern</>}
          </button>
        </div>
      </div>

      {/* ── Bot Control Card ──────────────────────────────────────────────── */}
      <div className="bg-surface border border-borderlt rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={18} className="text-accent" />
          <h2 className="text-white font-bold text-base">Bot-Steuerung</h2>
        </div>
        <p className="text-muted text-sm mb-5">
          Starte, stoppe oder aktualisiere den Bot. Konfigurationsänderungen werden erst nach einem Neustart aktiv.
        </p>

        {/* Status row */}
        <div className="flex items-center justify-between bg-surface2 border border-borderlt rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-2">
            <StatusDot status={botStatus} />
            <span className="text-sm text-white font-medium">{botStatus ? STATUS_LABEL[botStatus] : '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            {botStatus === 'errored' && !showLogs && (
              <button
                onClick={() => { setShowLogs(true); void fetchLogs() }}
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                <ScrollText size={13} /> Logs anzeigen
              </button>
            )}
            <button onClick={() => fetchStatus()} disabled={statusLoading}
              className="text-dim hover:text-muted transition-colors p-1 rounded" title="Status aktualisieren"
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
                <ScrollText size={12} /> PM2 Error Log (letzte 100 Zeilen)
              </span>
              <button onClick={() => setShowLogs(false)} className="text-danger/60 hover:text-danger transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-72 p-3 bg-bg">
              {logsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={13} className="animate-spin" /> Logs werden geladen…
                </div>
              ) : logs && logs.length > 0 ? (
                <pre className="text-[11px] text-danger/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
                  {logs.join('\n')}
                </pre>
              ) : (
                <p className="text-xs text-dim">Keine Log-Einträge gefunden.</p>
              )}
            </div>
          </div>
        )}

        {controlMsg && <div className="mb-4"><Banner msg={controlMsg} onClose={() => setControlMsg(null)} /></div>}

        {/* Start / Restart / Stop */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => handleAction('start')}
            disabled={isBusy || isOnline || isTransient || notFound}
            className="msk-btn-ghost flex-1 justify-center" title="Bot starten"
          >
            {actionLoading === 'start' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Starten
          </button>

          <button onClick={() => handleAction('restart')}
            disabled={isBusy || isTransient || notFound || botStatus === null}
            className="msk-btn-primary flex-1 justify-center" title="Bot neu starten"
          >
            {actionLoading === 'restart' ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            Neustart
          </button>

          <button onClick={() => handleAction('stop')}
            disabled={isBusy || isStopped || isTransient || notFound}
            className="msk-btn-ghost flex-1 justify-center text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
            title="Bot stoppen"
          >
            {actionLoading === 'stop' ? <Loader2 size={15} className="animate-spin" /> : <Square size={15} />}
            Stoppen
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-borderlt my-4" />

        {/* Update section */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white font-medium mb-0.5">Bot aktualisieren</p>
            <p className="text-xs text-muted">
              Lädt die neueste Version via <code className="font-mono text-dim">git pull</code> und installiert neue Abhängigkeiten.
              Danach ist ein Neustart erforderlich.
            </p>
          </div>
          <button onClick={handleUpdate} disabled={isBusy}
            className="msk-btn-ghost shrink-0"
            title="Auf neueste Version aktualisieren"
          >
            {updateLoading
              ? <><Loader2 size={15} className="animate-spin" /> Aktualisiert…</>
              : <><Download size={15} /> Aktualisieren</>
            }
          </button>
        </div>

        {updateLoading && (
          <p className="mt-2 text-xs text-dim">
            Bitte warte — <code className="font-mono">npm install</code> kann bis zu 2 Minuten dauern…
          </p>
        )}

        {updateMsg && <div className="mt-3"><Banner msg={updateMsg} onClose={() => setUpdateMsg(null)} /></div>}
      </div>

    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { Notice, type NoticeTone } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { useLang } from '@/components/i18n/LangProvider'
import {
  ArrowCounterClockwise, ArrowsClockwise, CircleNotch, DownloadSimple, Play, Scroll, Stop,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { dashboardTranslations } from '@/lib/i18n'
import { botStatusLabel, botStatusTone, toBotStatus, type BotStatus } from './botStatus'
import { botAction, fetchBotLogs, fetchBotStatus } from './ticketBotApi'

type Msg = { tone: NoticeTone; text: string; detail?: string }

/**
 * Start, stop, restart and update of a hosted bot (plan 6.4, "Steuerung").
 *
 * The out-of-band recovery layer: it drives the PM2 process directly and
 * still works when the bot or its own dashboard is down, which is exactly
 * when it is needed.
 *
 * One main action that follows the state: "Start bot" while it stands,
 * "Restart bot" while it runs. Stopping is the secondary action and asks
 * first, because the community is without a ticket bot afterwards. A running
 * action shows on its own button.
 *
 * `initialStatus` is for a test that renders the control in a known state;
 * the page passes nothing and the status is fetched on mount.
 */
export function BotControl({ guildId, initialStatus = null }: { guildId: string; initialStatus?: BotStatus | null }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const [status, setStatus] = useState<BotStatus | null>(initialStatus)
  // A status fetch is already in flight from mount, so this starts out true.
  const [statusLoading, setStatusLoading] = useState(initialStatus === null)
  const [action, setAction] = useState<'start' | 'stop' | 'restart' | null>(null)
  const [controlMsg, setControlMsg] = useState<Msg | null>(null)
  const [stopOpen, setStopOpen] = useState(false)

  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateMsg, setUpdateMsg] = useState<Msg | null>(null)

  const [logs, setLogs] = useState<string[] | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const { data } = await fetchBotLogs(guildId)
      setLogs(data.lines ?? [])
    } catch {
      setLogs([])
    } finally { setLogsLoading(false) }
  }, [guildId])

  // Only touches state after the await, so the mount effect below stays free
  // of the extra render pass react-hooks/set-state-in-effect warns about.
  const runStatus = useCallback(async (): Promise<BotStatus | null> => {
    try {
      const { ok, data } = await fetchBotStatus(guildId)
      const next = ok ? toBotStatus(data.status) : 'unknown'
      setStatus(next)
      return next
    } catch {
      setStatus('unknown'); return null
    } finally { setStatusLoading(false) }
  }, [guildId])

  /** Refresh from a user action: shows the spinner right away. */
  const refreshStatus = useCallback((): Promise<BotStatus | null> => {
    setStatusLoading(true)
    return runStatus()
  }, [runStatus])

  useEffect(() => {
    if (initialStatus !== null) return
    async function run() { await runStatus() }
    void run()
  }, [runStatus, initialStatus])

  async function runAction(next: 'start' | 'stop' | 'restart') {
    setAction(next); setControlMsg(null); setShowLogs(false); setLogs(null)
    try {
      const { ok, data } = await botAction(guildId, next)
      if (!ok) {
        setControlMsg({ tone: 'danger', text: data.error ?? t.bot_action_failed, detail: data.detail })
        return
      }
      setControlMsg({
        tone: 'info',
        text: next === 'start' ? t.bot_starting : next === 'stop' ? t.bot_stopping_msg : t.bot_restarting,
      })

      // PM2 answers at once; whether the bot really came up shows a moment later.
      setTimeout(async () => {
        const after = await refreshStatus()
        if (after === 'errored') {
          setControlMsg({ tone: 'danger', text: t.bot_crashed })
          setShowLogs(true)
          await loadLogs()
        } else if (after === 'online' && next !== 'stop') {
          setControlMsg({ tone: 'success', text: t.bot_running })
        } else if (after === 'stopped' && next === 'stop') {
          setControlMsg({ tone: 'success', text: t.bot_stopped_msg })
        }
      }, 2500)
    } catch {
      setControlMsg({ tone: 'danger', text: t.bot_err_network })
    } finally { setAction(null) }
  }

  async function confirmStop() {
    await runAction('stop')
    setStopOpen(false)
  }

  async function runUpdate() {
    setUpdateLoading(true); setUpdateMsg(null)
    try {
      const { ok, data } = await botAction(guildId, 'update')
      if (!ok) {
        setUpdateMsg({ tone: 'danger', text: data.error ?? t.bot_update_failed, detail: data.detail })
        return
      }
      const alreadyLatest = (data.output ?? '').includes('Already up to date')
      setUpdateMsg({ tone: 'success', text: alreadyLatest ? t.bot_update_latest : t.bot_update_done, detail: data.output })
    } catch {
      setUpdateMsg({ tone: 'danger', text: t.bot_update_err_network })
    } finally { setUpdateLoading(false) }
  }

  const busy        = action !== null || updateLoading
  const stopped     = status === 'stopped' || status === 'errored'
  const transient   = status === 'launching' || status === 'stopping'
  const unavailable = status === null || status === 'not_found'
  const primary     = stopped ? 'start' : 'restart'

  return (
    <SectionCard
      title={t.bot_control_title}
      description={t.bot_control_desc}
      actions={
        <div className="flex items-center gap-2">
          {status
            ? <StatusBadge tone={botStatusTone(status)}>{botStatusLabel(status, lang)}</StatusBadge>
            : <StatusBadge tone="neutral" icon={CircleNotch}>{t.bot_status_checking}</StatusBadge>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refreshStatus()}
            disabled={statusLoading}
            aria-label={t.bot_status_refresh}
            title={t.bot_status_refresh}
          >
            <ArrowsClockwise className={statusLoading ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
          </Button>
        </div>
      }
    >
      <div className="grid gap-5">
        {controlMsg && (
          <Notice
            tone={controlMsg.tone}
            role={controlMsg.tone === 'danger' ? 'alert' : 'status'}
            onDismiss={() => setControlMsg(null)}
            dismissLabel={t.dismiss}
          >
            {controlMsg.text}
            {controlMsg.detail && <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-small">{controlMsg.detail}</pre>}
          </Notice>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => void runAction(primary)}
            disabled={busy || transient || unavailable}
            aria-busy={action === primary || undefined}
          >
            {action === primary || transient
              ? <CircleNotch className="h-4 w-4 animate-spin" />
              : primary === 'start' ? <Play className="h-4 w-4" /> : <ArrowCounterClockwise className="h-4 w-4" />}
            {transient ? botStatusLabel(status!, lang) : primary === 'start' ? t.bot_start : t.bot_restart}
          </Button>
          {!stopped && (
            <Button
              variant="outline"
              onClick={() => setStopOpen(true)}
              disabled={busy || transient || unavailable}
              aria-haspopup="dialog"
            >
              <Stop className="h-4 w-4" />
              {t.bot_stop}
            </Button>
          )}
          {status === 'errored' && (
            <Button variant="ghost" onClick={() => { setShowLogs(v => !v); if (!showLogs) void loadLogs() }} aria-expanded={showLogs}>
              <Scroll className="h-4 w-4" />
              {showLogs ? t.bot_hide_logs : t.bot_show_logs}
            </Button>
          )}
        </div>

        {showLogs && (
          <div className="grid gap-2">
            <p className="text-small font-semibold">{t.bot_log_title}</p>
            <div tabIndex={0} className="max-h-72 overflow-auto rounded-md bg-[var(--color-console)] p-3">
              {logsLoading ? (
                <p role="status" className="flex items-center gap-2 text-small text-[var(--color-log-dim)]">
                  <CircleNotch className="h-4 w-4 animate-spin" /> {t.bot_log_loading}
                </p>
              ) : logs && logs.length > 0 ? (
                <pre className="whitespace-pre-wrap break-all font-mono text-[0.8125rem] leading-relaxed text-[var(--color-log-error)]">
                  {logs.join('\n')}
                </pre>
              ) : (
                <p className="text-small text-[var(--color-log-dim)]">{t.bot_log_empty}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 border-t border-[var(--color-border)] pt-5">
          <div className="grid gap-1">
            <h3 className="font-semibold">{t.bot_update_title}</h3>
            <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.bot_update_desc}</p>
          </div>
          <Button variant="outline" className="w-fit" onClick={runUpdate} disabled={busy} aria-busy={updateLoading || undefined}>
            {updateLoading ? <CircleNotch className="h-4 w-4 animate-spin" /> : <DownloadSimple className="h-4 w-4" />}
            {updateLoading ? t.bot_updating : t.bot_update_btn}
          </Button>
          {updateLoading && <p role="status" className="text-small text-[var(--color-muted-foreground)]">{t.bot_update_wait}</p>}
          {updateMsg && (
            <Notice
              tone={updateMsg.tone}
              role={updateMsg.tone === 'danger' ? 'alert' : 'status'}
              onDismiss={() => setUpdateMsg(null)}
              dismissLabel={t.dismiss}
            >
              {updateMsg.text}
              {updateMsg.detail && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-small">{updateMsg.detail}</pre>}
            </Notice>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        onConfirm={confirmStop}
        title={t.bot_stop_confirm_title}
        description={t.bot_stop_confirm_desc}
        confirmLabel={t.bot_stop}
        cancelLabel={t.cancel}
        busy={action === 'stop'}
      />
    </SectionCard>
  )
}

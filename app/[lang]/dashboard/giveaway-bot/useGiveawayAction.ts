'use client'

import { useCallback, useState } from 'react'

import type { ActionResult } from './giveawayApi'
import type { GiveawayCopy } from './GiveawayProvider'

/**
 * A refusal of the bot or the route in words: what went wrong and what to do
 * (plan 6.3). Anything unknown keeps its code, so it can still be searched
 * for; a made-up label would hide it.
 */
export function errorText(t: GiveawayCopy, result: Pick<ActionResult, 'status' | 'data'>): string {
  const code = result.data.error
  if (code === 'network') return t.err_network
  if (result.status === 429) return t.err_rate_limited
  const known: Record<string, string> = {
    control_unreachable:    t.err_unreachable,
    control_disabled:       t.err_unreachable,
    bot_not_in_guild:       t.err_not_in_guild,
    unauthorized:           t.err_session,
    reauth_required:        t.store_reauth,
    owner_only:             t.store_err_owner,
    encryption_unavailable: t.store_no_key,
    invalid_secret:         t.store_err_invalid,
    tebex_unreachable:      t.store_err_unreachable,
    invalid_token:          t.store_err_token,
    invalid_url:            t.store_err_url,
    not_configured:         t.store_err_not_set,
    not_found:              t.e_not_found,
    not_active:             t.e_not_active,
    not_paused:             t.e_not_paused,
    not_ended:              t.e_not_ended,
    still_running:          t.e_still_running,
    not_started:            t.e_not_started,
    not_scheduled:          t.e_not_scheduled,
    invalid_start:          t.e_start_invalid,
    start_in_past:          t.e_start_past,
    start_too_far:          t.e_start_far,
    no_valid:               t.e_no_valid,
    winners_locked:         t.e_winners_locked,
    invalid_channel:        t.e_channel,
    missing_fields:         t.e_title,
    invalid_duration:       t.e_duration,
    invalid_winners:        t.e_winners,
    too_many_prizes:        t.e_prizes,
    invalid_percent:        t.e_percent,
    invalid_validity:       t.e_valid_days,
    invalid_packages:       t.e_packages,
    too_many_packages:      t.e_packages,
    invalid_codes:          t.e_codes,
    name_taken:             t.tpl_err_taken,
    template_limit:         t.tpl_err_limit,
    invalid_name:           t.tpl_err_name,
  }
  if (code && known[code]) return known[code]
  return t.err_code.replace('{code}', code || String(result.status))
}

/**
 * Runs one request at a time per area and remembers which one, so its button
 * can show that it is busy. A network failure comes back as a result like
 * any other refusal, with the code `network`.
 */
export function useBusy() {
  const [busy, setBusy] = useState<string | null>(null)
  const run = useCallback(async <T,>(key: string, request: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
    setBusy(key)
    try {
      return await request()
    } catch {
      return { ok: false, status: 0, data: { error: 'network' } as ActionResult<T>['data'] }
    } finally {
      setBusy(null)
    }
  }, [])
  return { busy, run }
}

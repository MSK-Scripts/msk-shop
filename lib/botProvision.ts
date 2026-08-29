import { randomBytes }     from 'crypto'
import { createServer }    from 'net'
import { writeFile, mkdir, chmod, rm, readdir, rename, access } from 'fs/promises'
import { join, resolve, sep } from 'path'
import { query, queryOne } from '@/lib/db'
import { botDir, quote }   from '@/lib/botEnv'
import { dashboardUrl }    from '@/lib/dashboardHost'

// =============================================================================
// Self-service bot hosting — the pieces both the API routes and the detached
// provisioning worker need.
// =============================================================================
// The split is deliberate. Anything fast and reversible (validating the form,
// picking a port, writing DNS + vhost, staging the .env) happens in the request,
// so the customer learns immediately if something is wrong. Everything slow
// (`git clone`, `npm install`, starting the bot, waiting for it to come up)
// happens in scripts/bot-provision.js as a DETACHED process, because a deploy
// restarting msk-shop must not abort a half-finished installation.
// =============================================================================

/** Public repository — cloned over HTTPS on purpose. The server also holds a
 *  deploy key, but depending on it would make provisioning fail for a reason no
 *  customer-facing message could ever explain. */
export const BOT_REPO = 'https://github.com/MSK-Scripts/discord_ticketbot.git'

/** Loopback ports handed to hosted bots' dashboards. */
const PORT_RANGE_START = 3050
const PORT_RANGE_END   = 3199

export type HostingStep =
  | 'queued' | 'clone' | 'configure' | 'install' | 'start' | 'health' | 'done'

export interface HostingJob {
  guild_id:   string
  status:     'running' | 'failed' | 'done'
  step:       HostingStep
  error:      string | null
  log:        string | null
  started_at: string
  updated_at: string
}

// ── Port allocation ──────────────────────────────────────────────────────────

function portFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const srv = createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => srv.close(() => resolve(true)))
    srv.listen(port, '127.0.0.1')
  })
}

/**
 * Pick a loopback port for a new hosted bot.
 *
 * Checked against BOTH the database and the machine. The database alone is not
 * enough — a port can be held by something that is not a hosted bot at all — and
 * the machine alone is not enough either, because a stopped bot's port is free
 * right now and would be handed to a second bot that then collides the moment
 * the first one starts again.
 */
export async function allocateBotPort(): Promise<number> {
  const taken = new Set(
    (await query<{ bot_port: number }>('SELECT bot_port FROM ticketbot_guilds WHERE bot_port IS NOT NULL'))
      .map(r => Number(r.bot_port)),
  )

  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (taken.has(port)) continue
    if (await portFree(port)) return port
  }
  throw new Error('No free dashboard port available')
}

// ── The .env we hand the bot ─────────────────────────────────────────────────

export interface HostingForm {
  /** Discord bot token. */
  token:        string
  /** Discord application (client) id. */
  clientId:     string
  /** Discord OAuth2 client secret — the bot's own dashboard login needs it. */
  clientSecret: string
  /** Optional external database; empty means the bundled SQLite file. */
  databaseUrl?: string
  /** Let every member sign in and see their own tickets. */
  publicPortal?: boolean
}

const SNOWFLAKE_RE = /^\d{17,20}$/

/**
 * Validate the three values we actually ask the customer for. Everything else in
 * the .env we know or generate ourselves, which is the reason this form is short
 * enough that people finish it.
 *
 * The token is NOT checked against Discord here. A syntactic check would reject
 * valid tokens whenever Discord changes its format, and a live check would make
 * the form depend on Discord being reachable. The bot itself is the honest
 * judge: if the token is wrong it says so in its log, and that log is what the
 * customer gets back.
 */
export function validateHostingForm(f: Partial<HostingForm>): string | null {
  if (!f.token || f.token.trim().length < 20)  return 'invalid_token'
  if (!SNOWFLAKE_RE.test(String(f.clientId)))  return 'invalid_client_id'
  if (!f.clientSecret || f.clientSecret.trim().length < 16) return 'invalid_client_secret'
  if (f.databaseUrl && !/^(mysql|postgres|sqlite):/i.test(f.databaseUrl.trim())) return 'invalid_database_url'
  return null
}

export interface EnvContext {
  guildId:     string
  apiKey:      string
  port:        number
  host:        string
  proxySecret: string | null
  baseUrl:     string
}

/**
 * Compose a complete .env for a freshly cloned bot.
 *
 * Written from scratch rather than patched into .env.example, because at this
 * point there is no file yet — and because a generated file makes it obvious
 * that the values below are ours, not the customer's to guess. SESSION_SECRET is
 * minted here so it is unique per installation; letting the bot generate one on
 * first start would work too, but then it lives only on disk and a restore from
 * backup could silently reuse another guild's.
 */
export function buildBotEnv(form: HostingForm, ctx: EnvContext): string {
  const lines = [
    '# Generated by the MSK hosting dashboard. Values you entered are marked.',
    '# Edit this file through the dashboard, not by hand: the bot is restarted',
    '# for you and the result is checked.',
    '',
    '# ── Discord (from you) ───────────────────────────────────────────────────',
    `TOKEN=${quote(form.token.trim())}`,
    `CLIENT_ID=${quote(form.clientId.trim())}`,
    `CLIENT_SECRET=${quote(form.clientSecret.trim())}`,
    `GUILD_ID=${quote(ctx.guildId)}`,
    '',
    '# ── MSK transcript service (filled in for you) ───────────────────────────',
    `MSK_API_KEY=${quote(ctx.apiKey)}`,
    `MSK_API_URL=${quote(ctx.baseUrl)}`,
    '',
    '# ── Database ─────────────────────────────────────────────────────────────',
    '# Empty = the bundled SQLite file in data/tickets.db.',
    `DATABASE_URL=${quote((form.databaseUrl ?? '').trim())}`,
    '',
    '# ── Web dashboard ────────────────────────────────────────────────────────',
    '# Bound to loopback: the only way in is the Apache vhost on the host below,',
    '# which is why DASHBOARD_HOST must stay 127.0.0.1.',
    'DASHBOARD_ENABLED="true"',
    'DASHBOARD_HOST="127.0.0.1"',
    `DASHBOARD_PORT=${quote(String(ctx.port))}`,
    `DASHBOARD_PUBLIC_URL=${quote(dashboardUrl(ctx.host))}`,
    'DASHBOARD_ALLOW_INSECURE="false"',
    `DASHBOARD_PUBLIC_PORTAL=${quote(form.publicPortal ? 'true' : 'false')}`,
    `SESSION_SECRET=${quote(randomBytes(32).toString('hex'))}`,
  ]

  // Only when the proxy is configured on our side. An empty secret here would
  // let anything that reaches the loopback port claim to be an authenticated
  // owner, so it is better to have no trusted-proxy path at all.
  if (ctx.proxySecret) {
    lines.push(
      '',
      '# Lets the msk-scripts.de owner fallback in without a Discord login.',
      `DASHBOARD_TRUST_PROXY_SECRET=${quote(ctx.proxySecret)}`,
    )
  }

  lines.push('')
  return lines.join('\n')
}

// ── Staging the .env for the detached worker ─────────────────────────────────
//
// The worker cannot be handed the token on its command line — `ps` is readable
// by every user on the box. So the composed .env is written to a 0600 file that
// only the app user can read, and the worker moves it into place and deletes it.

const stagingDir = () => join(process.env.BOT_CONFIG_BASE_PATH || '/opt/customer_ticketbots', '.staging')

export const stagedEnvPath = (guildId: string) => join(stagingDir(), `${guildId}.env`)

export async function stageBotEnv(guildId: string, content: string): Promise<void> {
  // Validate the guild id through botDir before it is used to build any path.
  botDir(guildId)

  await mkdir(stagingDir(), { recursive: true, mode: 0o700 })
  await chmod(stagingDir(), 0o700)

  const path = stagedEnvPath(guildId)
  await writeFile(path, content, { mode: 0o600 })
  await chmod(path, 0o600)
}

export async function discardStagedEnv(guildId: string): Promise<void> {
  await rm(stagedEnvPath(guildId), { force: true }).catch(() => {})
}

// ── Job state ────────────────────────────────────────────────────────────────

export async function getHostingJob(guildId: string): Promise<HostingJob | null> {
  return queryOne<HostingJob>('SELECT * FROM ticketbot_hosting_jobs WHERE guild_id = ?', [guildId])
}

/**
 * Claim the single job slot for this guild.
 *
 * Returns false when a run is already active, which is the whole point: two
 * concurrent runs would clone into the same directory and fight over the same
 * PM2 name. A previous `failed` or `done` row is overwritten — that is a retry.
 */
export async function claimHostingJob(guildId: string): Promise<boolean> {
  const existing = await getHostingJob(guildId)
  if (existing?.status === 'running') return false

  await query(
    `INSERT INTO ticketbot_hosting_jobs (guild_id, status, step, error, log, started_at)
          VALUES (?, 'running', 'queued', NULL, NULL, NOW())
     ON DUPLICATE KEY UPDATE
          status = 'running', step = 'queued', error = NULL, log = NULL, started_at = NOW()`,
    [guildId],
  )
  return true
}

export async function setHostingStep(guildId: string, step: HostingStep): Promise<void> {
  await query('UPDATE ticketbot_hosting_jobs SET step = ? WHERE guild_id = ?', [step, guildId])
}

/** Mark the run as failed. `log` is the tail the customer sees — it is the only
 *  thing that explains a rejected token, so it is stored, not just logged. */
export async function failHostingJob(guildId: string, error: string, log?: string): Promise<void> {
  await query(
    `UPDATE ticketbot_hosting_jobs SET status = 'failed', error = ?, log = ? WHERE guild_id = ?`,
    [error.slice(0, 500), log ? tailLines(log, 40) : null, guildId],
  )
}

export async function finishHostingJob(guildId: string): Promise<void> {
  await query(
    `UPDATE ticketbot_hosting_jobs SET status = 'done', step = 'done', error = NULL, log = NULL WHERE guild_id = ?`,
    [guildId],
  )
}

/** Last `n` non-empty lines, with ANSI colour codes stripped — the bot's log is
 *  heavily coloured and the escape sequences are noise in a web page.
 *
 *  Anchored on the ESC byte, written as an escape sequence rather than pasted in
 *  literally: the bot tags every line with `[INFO ]`, `[Ready]` and friends, so
 *  a pattern that matched brackets alone would eat the words that make the log
 *  worth showing. */
export function tailLines(text: string, n: number): string {
  const plain = text.replace(/\x1b\[[0-9;]*m/g, '')
  const lines = plain.split(/\r?\n/).filter(l => l.trim() !== '')
  return lines.slice(-n).join('\n').slice(-8000)
}

// ── Archived installations ───────────────────────────────────────────────────
//
// Removing hosting RENAMES the directory to `<guildId>_archived_<timestamp>`
// instead of deleting it (lib/hostedBot.ts), and the daily cron hard-deletes it
// 14 days later. In that window the whole installation is still there — most
// importantly the ticket history in its database.
//
// So setting hosting up again is not necessarily a fresh start, and the customer
// is the only one who can say which it should be. Provisioning therefore refuses
// to guess: it reports the archives and waits for an explicit choice.

/** Directory names are minted by archiveHostedBot(): guild id, the marker, and
 *  an ISO timestamp with `:` and `.` replaced by `-`. */
const archiveName = (guildId: string) => new RegExp(`^${guildId}_archived_[0-9T-]{10,25}$`)

export interface BotArchive {
  /** Directory name under BOT_CONFIG_BASE_PATH. */
  name:       string
  /** When it was archived, as far as the name can tell. */
  archivedAt: string
}

/** Archived installations for this guild, newest first. */
export async function findArchives(guildId: string): Promise<BotArchive[]> {
  botDir(guildId)   // validates the guild id before it goes into a pattern

  const base = process.env.BOT_CONFIG_BASE_PATH!
  const re   = archiveName(guildId)

  let entries: string[]
  try {
    entries = await readdir(base)
  } catch {
    return []
  }

  return entries
    .filter(name => re.test(name))
    .sort()
    .reverse()
    .map(name => ({
      name,
      // `2026-08-29T20-30-15` back into something a browser can parse. Best
      // effort: the name is the only record we have, and a slightly wrong
      // timestamp is better than hiding the archive.
      archivedAt: name.slice(guildId.length + '_archived_'.length)
        .replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3') + 'Z',
    }))
}

function archivePath(guildId: string, name: string): string {
  if (!archiveName(guildId).test(name)) throw new Error(`Not an archive of this guild: ${name}`)
  const base     = process.env.BOT_CONFIG_BASE_PATH!
  const resolved = resolve(join(base, name))
  if (!resolved.startsWith(resolve(base) + sep)) throw new Error('Path traversal detected')
  return resolved
}

/**
 * Bring the newest archived installation back under its live name.
 *
 * Only the rename happens here. The worker then finds a directory that already
 * has a package.json, skips cloning, writes the new .env over the old one and
 * reinstalls the dependencies — which is what makes an archive from a different
 * bot version usable again.
 */
export async function restoreArchive(guildId: string, name: string): Promise<void> {
  const from = archivePath(guildId, name)
  const to   = botDir(guildId)

  // Refuse rather than overwrite: a live directory here means something is
  // already installed, and merging the two would be guesswork with someone's
  // ticket history.
  if (await access(to).then(() => true, () => false)) {
    throw new Error('A live installation already exists for this guild')
  }
  await rename(from, to)
}

/**
 * Delete every archived installation of this guild, for good.
 *
 * Called only when the customer explicitly chose a fresh start over restoring.
 * It destroys the ticket history, which is why nothing calls it implicitly and
 * why the choice is never defaulted.
 */
export async function discardArchives(guildId: string): Promise<number> {
  const archives = await findArchives(guildId)
  for (const a of archives) {
    await rm(archivePath(guildId, a.name), { recursive: true, force: true })
  }
  return archives.length
}

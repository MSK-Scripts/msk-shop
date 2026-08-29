import { randomBytes }  from 'crypto'
import { execFile }     from 'child_process'
import { promisify }    from 'util'
import { DNS_ZONE, createHostRecords, deleteHostRecords, isManagedHost } from '@/lib/ionosDns'

const execFileAsync = promisify(execFile)

// =============================================================================
// Public host for a hosted bot's own dashboard
// =============================================================================
// Every hosted bot gets `tickets-<12 hex>.msk-scripts.de`, pointed at this server
// by an A/AAAA pair (lib/ionosDns.ts) and served by an Apache vhost that proxies
// straight to the bot's loopback port (scripts/bot-vhost-create.sh).
//
// Why a host per bot instead of the single bot-dashboard.msk-scripts.de proxy we
// already have: that proxy authenticates through msk-shop, and msk-shop only
// knows the OWNER of a guild (authorizeGuild → discord_user_id). A customer's
// support team has no msk-shop account, so they could never get in — and the
// proxy additionally short-circuits the bot's /auth/login. On its own host the
// bot runs its own Discord OAuth and resolves its own permissions, which is what
// the customer's staff actually need. The old proxy stays as the owner's
// login-free fallback for when the OAuth credentials are misconfigured.
//
// The name is random rather than derived from the guild id on purpose: a
// guessable `tickets-<guild_id>` would publish which Discord servers host here.
// =============================================================================

const SUDO           = 'sudo'
const CREATE_SCRIPT  = '/opt/msk-shop/scripts/bot-vhost-create.sh'
const DELETE_SCRIPT  = '/opt/msk-shop/scripts/bot-vhost-delete.sh'

/** A fresh `tickets-<12 hex>.msk-scripts.de`. 48 bits is far more than enough to
 *  never collide in practice, and short enough that the customer can retype it
 *  into the Discord redirect URI without getting it wrong. */
export function generateDashboardHost(): string {
  return `tickets-${randomBytes(6).toString('hex')}.${DNS_ZONE}`
}

/** True for a host we minted ourselves (as opposed to a customer's own domain). */
export function isGeneratedHost(host: string | null | undefined): boolean {
  return !!host && /^tickets-[0-9a-f]{12}\./.test(host.toLowerCase()) && isManagedHost(host)
}

export class DashboardHostError extends Error {
  constructor(message: string, readonly kind: 'dns' | 'vhost' | 'ssl' = 'vhost') {
    super(message)
    this.name = 'DashboardHostError'
  }
}

function vhostError(err: unknown): DashboardHostError {
  // bot-vhost-create.sh exits 20 for certbot failures and 10 for Apache ones.
  const code = (err as { code?: unknown })?.code
  if (code === 20) {
    return new DashboardHostError(
      'Could not issue an SSL certificate for this domain. Check that its DNS record points to our server.',
      'ssl',
    )
  }
  return new DashboardHostError('Failed to configure the web server for this domain.', 'vhost')
}

/**
 * Publish `host` in front of the bot listening on `port`.
 *
 * Order matters and is deliberate: DNS first, vhost second. A record without a
 * vhost answers with the default site (which denies everything) — harmless and
 * invisible. A vhost without DNS is the reverse: Apache holds a ServerName
 * nobody can reach, and in certbot mode issuance fails outright. So the cheap,
 * reversible step goes first.
 *
 * Idempotent on both halves: the records are replaced, and a2ensite over an
 * existing config just rewrites it.
 */
export async function publishDashboardHost(host: string, port: number, opts: { certbot?: boolean } = {}): Promise<void> {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new DashboardHostError(`Invalid dashboard port: ${port}`)
  }

  const mode = opts.certbot ? 'certbot' : 'wildcard'

  // Only names inside our own zone get DNS records — a customer's own domain is
  // their DNS to manage, and we could not write their zone anyway.
  if (!opts.certbot) {
    if (!isManagedHost(host)) throw new DashboardHostError(`Not a managed host: ${host}`, 'dns')
    try {
      await createHostRecords(host)
    } catch (err) {
      throw new DashboardHostError(
        `Could not create the DNS records for ${host}: ${err instanceof Error ? err.message : 'unknown error'}`,
        'dns',
      )
    }
  }

  try {
    await execFileAsync(SUDO, [
      CREATE_SCRIPT,
      host,
      String(port),
      mode,
      process.env.ADMIN_EMAIL ?? 'info@msk-scripts.de',
    ], { timeout: 180_000 })
  } catch (err) {
    console.error('[dashboardHost] vhost creation failed:', err)
    // Roll the DNS back so a retry starts from a clean state instead of finding
    // records that promise a host nothing serves.
    if (!opts.certbot) {
      await deleteHostRecords(host).catch(e => console.error('[dashboardHost] DNS rollback failed:', e))
    }
    throw vhostError(err)
  }
}

/**
 * Take `host` down again: vhost first, then DNS.
 *
 * Reverse order of publishing, and for the same reason — the step that makes the
 * host stop answering runs first. Neither half throws: this runs in teardown
 * paths (hosting removed, subscription cancelled) where the caller must be able
 * to finish the rest of the cleanup even if one piece is already gone.
 */
export async function unpublishDashboardHost(host: string | null | undefined): Promise<void> {
  if (!host) return

  try {
    await execFileAsync(SUDO, [DELETE_SCRIPT, host], { timeout: 60_000 })
  } catch (err) {
    console.error(`[dashboardHost] Failed to remove vhost for ${host}:`, err)
  }

  if (isManagedHost(host)) {
    try {
      await deleteHostRecords(host)
    } catch (err) {
      console.error(`[dashboardHost] Failed to remove DNS records for ${host}:`, err)
    }
  }
}

/** The URL the customer opens, and the base of the OAuth redirect URI they have
 *  to register in the Discord developer portal. */
export const dashboardUrl = (host: string) => `https://${host}`

/** The exact value Discord needs under OAuth2 → Redirects. The bot builds it as
 *  `<DASHBOARD_PUBLIC_URL>/auth/callback`; if this and the portal disagree, the
 *  login fails with a Discord error page and nothing in our logs. */
export const dashboardRedirectUri = (host: string) => `https://${host}/auth/callback`

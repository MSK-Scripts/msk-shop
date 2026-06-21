import { NextResponse }  from 'next/server';
import { createHmac }    from 'crypto';
import { rename }        from 'fs/promises';
import { exec }          from 'child_process';
import { join, resolve } from 'path';
import { promisify }     from 'util';
import { query, queryOne, withTransaction } from '@/lib/db';
import type { Tier }     from '@/lib/tiers';

const execAsync = promisify(exec);

// ── GitHub Sponsors Webhook ────────────────────────────────────────────────────
//
// Configure in GitHub → Settings → Sponsors → Webhooks
// Events: sponsorship (created, cancelled, tier_changed, pending_cancellation)
//
// Set the secret in your .env.local as GITHUB_SPONSORS_WEBHOOK_SECRET

// ── Constants ──────────────────────────────────────────────────────────────────

const GUILD_ID_RE = /^\d{17,20}$/;

// ── Types ──────────────────────────────────────────────────────────────────────

interface GuildRow { guild_id: string; is_hosted: number }

interface SponsorshipPayload {
  action: 'created' | 'cancelled' | 'tier_changed' | 'pending_cancellation' | 'edited';
  sponsorship: {
    sponsor: {
      login: string;
    };
    tier: {
      monthly_price_in_dollars: number;
    };
  };
}

// ── Tier Mapping ───────────────────────────────────────────────────────────────

/** Map GitHub Sponsors monthly amount → internal tier. */
function resolveGitHubTier(monthlyUsd: number): Tier {
  if (monthlyUsd >= 8) return 'premium_plus';
  if (monthlyUsd >= 4) return 'premium';
  return 'basic';
}

// ── Signature Verification ─────────────────────────────────────────────────────

/** Verify the GitHub webhook signature (HMAC-SHA256). */
async function verifyGitHubSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = process.env.GITHUB_SPONSORS_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[github-sponsors] GITHUB_SPONSORS_WEBHOOK_SECRET is not set.');
    return false;
  }

  const signature = req.headers.get('x-hub-signature-256') ?? '';
  if (!signature.startsWith('sha256=')) return false;

  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Hosted Bot Archiving ───────────────────────────────────────────────────────

/**
 * Called when a sponsorship is cancelled or downgraded below Premium+.
 * Stops the PM2 process, renames the bot directory to archive it,
 * and sets is_hosted = 0 in the database.
 */
async function archiveHostedBot(githubUsername: string): Promise<void> {
  const guild = await queryOne<GuildRow>(
    'SELECT guild_id, is_hosted FROM ticketbot_guilds WHERE github_username = ?',
    [githubUsername],
  );

  // Nothing to do if the guild isn't hosted or doesn't exist yet.
  if (!guild?.is_hosted || !guild.guild_id || !GUILD_ID_RE.test(guild.guild_id)) return;

  const guildId = guild.guild_id;
  const base    = process.env.BOT_CONFIG_BASE_PATH;
  if (!base) {
    console.warn('[github-sponsors] BOT_CONFIG_BASE_PATH not set — skipping hosted bot archive');
    return;
  }

  const resolvedBase = resolve(base);
  const botPath      = resolve(join(base, guildId));

  // Path traversal guard — guild_id already passes GUILD_ID_RE but double-check.
  if (!botPath.startsWith(resolvedBase + '/') && !botPath.startsWith(resolvedBase + '\\')) {
    console.error(`[github-sponsors] Path traversal detected for guild: ${guildId}`);
    return;
  }

  // 1. Stop and remove the PM2 process — ignore errors (may already be stopped/absent).
  const appName = `ticketbot-${guildId}`;
  try {
    await execAsync(`pm2 stop ${appName}`,   { timeout: 10_000 });
    await execAsync(`pm2 delete ${appName}`, { timeout: 10_000 });
    console.info(`[github-sponsors] PM2: stopped and deleted ${appName}`);
  } catch (err) {
    console.warn(`[github-sponsors] PM2 stop/delete failed (may already be absent): ${String(err)}`);
  }

  // 2. Rename bot directory to archive it.
  const timestamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const archivePath = resolve(join(base, `${guildId}_archived_${timestamp}`));
  try {
    await rename(botPath, archivePath);
    console.info(`[github-sponsors] Archived: ${botPath} → ${archivePath}`);
  } catch (err) {
    console.error(`[github-sponsors] Directory archive failed: ${String(err)}`);
    // Continue — still update is_hosted in the DB even if rename failed.
  }

  // 3. Mark as no longer hosted in the database.
  await query(
    'UPDATE ticketbot_guilds SET is_hosted = 0 WHERE guild_id = ?',
    [guildId],
  );
  console.info(`[github-sponsors] is_hosted = 0 set for guild ${guildId}`);
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // 1. Read raw body for signature verification (must be done before .json())
  const rawBody = await req.text();

  // 2. Verify GitHub signature
  const valid = await verifyGitHubSignature(req, rawBody);
  if (!valid) {
    console.warn('[github-sponsors] Invalid webhook signature.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // 3. Parse payload
  let payload: SponsorshipPayload;
  try {
    payload = JSON.parse(rawBody) as SponsorshipPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { action, sponsorship } = payload;
  const githubUsername = sponsorship?.sponsor?.login;

  if (!githubUsername) {
    return NextResponse.json({ error: 'Missing sponsor login.' }, { status: 400 });
  }

  // Map action to a string literal so CodeQL's taint tracker sees a clean value.
  // .replace()-based sanitizers are not recognised by CodeQL; a switch with
  // literal returns fully breaks the taint chain.
  const logAction: string = (() => {
    switch (action) {
      case 'created':              return 'created';
      case 'cancelled':            return 'cancelled';
      case 'tier_changed':         return 'tier_changed';
      case 'pending_cancellation': return 'pending_cancellation';
      case 'edited':               return 'edited';
      default:                     return 'unknown';
    }
  })();

  // GitHub usernames are alphanumeric + hyphens (1–39 chars). Anything that
  // does not match is replaced with a safe placeholder before logging.
  const logUsername: string = /^[a-zA-Z0-9-]{1,39}$/.test(githubUsername)
    ? githubUsername
    : '[invalid-username]';

  console.info(`[github-sponsors] Action: ${logAction} | Sponsor: ${logUsername}`);

  // 4. Handle each action. The two DB writes per action run in a single
  //    transaction so a partial failure cannot leave the sponsors table and the
  //    guilds table inconsistent. The hosted-bot archive (filesystem + PM2) runs
  //    only after the DB transaction has committed. Any failure returns 500 so
  //    GitHub retries instead of the handler silently reporting success.
  try {
    switch (action) {
      case 'created':
      case 'tier_changed': {
        const tier   = resolveGitHubTier(sponsorship.tier.monthly_price_in_dollars);
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 32); // ~1 month buffer

        await withTransaction(async (conn) => {
          // Update sponsors lookup table
          await conn.execute(
            `INSERT INTO ticketbot_sponsors (github_username, tier, active)
             VALUES (?, ?, TRUE)
             ON DUPLICATE KEY UPDATE tier = ?, active = TRUE`,
            [githubUsername, tier, tier],
          );
          // Update guild record if already linked
          await conn.execute(
            `UPDATE ticketbot_guilds
             SET tier = ?, active = TRUE, expires_at = ?
             WHERE github_username = ?`,
            [tier, expiry, githubUsername],
          );
        });
        console.info(`[github-sponsors] Upgraded ${logUsername} → ${tier}`);

        // Archive the hosted bot only if the tier dropped completely to basic.
        // A downgrade from Premium+ to Premium keeps the directory intact.
        if (tier === 'basic') {
          await archiveHostedBot(githubUsername);
        }
        break;
      }

      case 'cancelled':
      case 'pending_cancellation': {
        await withTransaction(async (conn) => {
          // Update sponsors lookup table
          await conn.execute(
            `INSERT INTO ticketbot_sponsors (github_username, tier, active)
             VALUES (?, 'basic', FALSE)
             ON DUPLICATE KEY UPDATE tier = 'basic', active = FALSE`,
            [githubUsername],
          );
          // Downgrade guild record if already linked
          await conn.execute(
            `UPDATE ticketbot_guilds
             SET tier = 'basic', expires_at = NULL
             WHERE github_username = ?`,
            [githubUsername],
          );
        });
        console.info(`[github-sponsors] Downgraded ${logUsername} → basic`);

        // Archive the hosted bot if the guild had one.
        await archiveHostedBot(githubUsername);
        break;
      }

      default:
        // Ignore unknown actions (e.g. 'edited')
        break;
    }
  } catch (err) {
    console.error('[github-sponsors] Failed to process webhook:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

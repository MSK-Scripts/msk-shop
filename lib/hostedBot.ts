import { rename }        from 'fs/promises';
import { exec }          from 'child_process';
import { join, resolve } from 'path';
import { promisify }     from 'util';
import { query, queryOne } from '@/lib/db';
import { unpublishDashboardHost } from '@/lib/dashboardHost';
import type { ScopedGuildId } from '@/lib/guildScope';

const execAsync   = promisify(exec);
const GUILD_ID_RE = /^\d{17,20}$/;

interface HostedRow {
  is_hosted:        number;
  dashboard_host:   string | null;
  dashboard_domain: string | null;
}

/**
 * Archive a hosted bot when its guild drops below a hosting-eligible tier
 * (cancellation / downgrade to basic). Stops + removes the PM2 process, takes
 * the dashboard's public host down (vhost + DNS records), renames the bot
 * directory to archive it, and clears is_hosted in the database.
 *
 * Safe to call for any guild id: it no-ops when the guild isn't hosted or the
 * base path isn't configured. Filesystem/PM2 errors are logged, never thrown —
 * the DB flag is still cleared so the dashboard reflects reality.
 */
export async function archiveHostedBot(guildId: ScopedGuildId): Promise<void> {
  if (!GUILD_ID_RE.test(guildId)) return;

  const guild = await queryOne<HostedRow>(
    `SELECT is_hosted, dashboard_host, dashboard_domain
       FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );
  if (!guild?.is_hosted) return;

  const base = process.env.BOT_CONFIG_BASE_PATH;
  if (!base) {
    console.warn('[hostedBot] BOT_CONFIG_BASE_PATH not set — skipping hosted bot archive');
    return;
  }

  const resolvedBase = resolve(base);
  const botPath      = resolve(join(base, guildId));

  // Path traversal guard — guildId already passes GUILD_ID_RE but double-check.
  if (!botPath.startsWith(resolvedBase + '/') && !botPath.startsWith(resolvedBase + '\\')) {
    console.error(`[hostedBot] Path traversal detected for guild: ${guildId}`);
    return;
  }

  // 1. Stop and remove the PM2 process — ignore errors (may already be absent).
  const appName = `ticketbot-${guildId}`;
  try {
    await execAsync(`pm2 stop ${appName}`,   { timeout: 10_000 });
    await execAsync(`pm2 delete ${appName}`, { timeout: 10_000 });
    console.info(`[hostedBot] PM2: stopped and deleted ${appName}`);
  } catch (err) {
    console.warn(`[hostedBot] PM2 stop/delete failed (may already be absent): ${String(err)}`);
  }

  // 2. Take the public host(s) down. Without this a cancelled customer keeps an
  // Apache vhost pointing at a port that is now free to be handed to the NEXT
  // customer's bot, and a DNS record we still pay attention to. Both halves are
  // best effort by design — see unpublishDashboardHost.
  for (const host of [guild.dashboard_host, guild.dashboard_domain]) {
    if (host) await unpublishDashboardHost(host);
  }

  // 3. Rename bot directory to archive it.
  const timestamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const archivePath = resolve(join(base, `${guildId}_archived_${timestamp}`));
  try {
    await rename(botPath, archivePath);
    console.info(`[hostedBot] Archived: ${botPath} → ${archivePath}`);
  } catch (err) {
    console.error(`[hostedBot] Directory archive failed: ${String(err)}`);
    // Continue — still clear is_hosted even if the rename failed.
  }

  // 4. Mark as no longer hosted and forget the hosts we just removed — leaving
  // them in the row would make a later re-activation try to "repair" a name
  // whose DNS records are gone.
  await query(
    `UPDATE ticketbot_guilds
        SET is_hosted = 0, bot_port = NULL,
            dashboard_host = NULL, dashboard_domain = NULL,
            dashboard_domain_status = 'none'
      WHERE guild_id = ?`,
    [guildId],
  );
  console.info(`[hostedBot] is_hosted = 0 set for guild ${guildId}`);
}

import { execFile }   from 'child_process';
import { promisify }  from 'util';
import { query, queryOne } from '@/lib/db';
import type { ScopedGuildId } from '@/lib/guildScope';

const execFileAsync = promisify(execFile);

/**
 * Tear down a guild's custom domain when it loses its premium entitlement
 * (cancellation / downgrade to basic).
 *
 * - If the domain is currently active, removes the Apache vhost + Let's Encrypt
 *   cert via vhost-delete.sh (best-effort: filesystem/cert errors are logged,
 *   never thrown, so a downgrade never fails on domain teardown).
 * - Demotes domain_status to 'pending_dns' but KEEPS custom_domain, so a customer
 *   who later re-subscribes gets their saved domain back and only has to
 *   re-validate. While the guild is basic, the tier gate in /api/domain/validate
 *   blocks any re-activation, so a non-premium guild can never serve from the
 *   custom domain again on its own.
 *
 * Safe to call for any guild id — no-ops when the guild has no domain configured.
 *
 * Verlangt einen `ScopedGuildId`: die Funktion reisst einer fremden Guild die
 * Domain weg, wenn man ihr die falsche Id gibt. Woher die Id kommt, muss der
 * Aufrufer belegen — siehe lib/guildScope.ts.
 */
export async function teardownCustomDomain(guildId: ScopedGuildId): Promise<void> {
  const row = await queryOne<{ custom_domain: string | null; domain_status: string }>(
    'SELECT custom_domain, domain_status FROM ticketbot_guilds WHERE guild_id = ?',
    [guildId],
  );
  if (!row?.custom_domain) return;

  if (row.domain_status === 'active') {
    try {
      await execFileAsync('sudo', ['/opt/msk-shop/scripts/vhost-delete.sh', row.custom_domain]);
    } catch (err) {
      console.error(`[customDomain] vhost teardown failed for guild ${guildId}:`, err);
    }
  }

  await query(
    `UPDATE ticketbot_guilds SET domain_status = 'pending_dns' WHERE guild_id = ?`,
    [guildId],
  );
}

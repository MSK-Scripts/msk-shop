import { query } from './db';

/**
 * Append a row to the admin audit log. Called after every successful write
 * action in the admin dashboard so there is a permanent record of who did what.
 *
 * Never throws in a way that should abort the caller's response — the action has
 * already happened by the time we log it. Failures are swallowed and logged to
 * the server console instead.
 *
 * @param discordUserId  the acting admin (from the authorized session)
 * @param action         short verb, e.g. "payment.create_free", "coupon.delete"
 * @param target         the affected id/ign (txn id, coupon id, username, …)
 * @param detail         optional structured context, stored as JSON
 */
export async function writeAudit(
  discordUserId: string,
  action: string,
  target?: string | null,
  detail?: unknown,
): Promise<void> {
  try {
    await query(
      `INSERT INTO msk_admin_audit (discord_user_id, action, target, detail)
       VALUES (?, ?, ?, ?)`,
      [
        discordUserId,
        action,
        target ?? null,
        detail === undefined ? null : JSON.stringify(detail),
      ],
    );
  } catch (err) {
    console.error('[admin/audit] failed to write audit row:', err);
  }
}

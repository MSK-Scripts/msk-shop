import { queryOne } from './db';
import { parseAdminSession } from './adminSession';
import {
  AdminPermission,
  AdminTeamMember,
  memberHasPermission,
  parseAdminPermissions,
} from './adminPerms';

/** Raw row shape from msk_admin_team. */
interface AdminTeamRow {
  discord_user_id: string;
  display_name:    string | null;
  is_owner:        number;
  // mysql2 returns JSON columns already parsed on MySQL, but MariaDB may hand
  // back a string — handle both in loadAdminMember().
  permissions:     string | unknown[];
  active:          number;
}

/**
 * Load an active admin team member from the database. Returns null if the user
 * is not on the allowlist or has been deactivated. Permissions are validated
 * against the known set, so an unknown/removed permission string is ignored
 * rather than trusted.
 */
export async function loadAdminMember(discordUserId: string): Promise<AdminTeamMember | null> {
  const row = await queryOne<AdminTeamRow>(
    `SELECT discord_user_id, display_name, is_owner, permissions, active
       FROM msk_admin_team
      WHERE discord_user_id = ? AND active = 1`,
    [discordUserId],
  );
  if (!row) return null;

  return {
    discordUserId: row.discord_user_id,
    displayName:   row.display_name,
    isOwner:       row.is_owner === 1,
    permissions:   parseAdminPermissions(row.permissions),
    active:        row.active === 1,
  };
}

export type AdminAuthResult =
  | { ok: true;  member: AdminTeamMember }
  | { ok: false; status: 401 | 403 };

/**
 * Authorize an admin request. Pass the raw `msk_admin_session` cookie value and,
 * optionally, the permission the route requires.
 *
 *  - 401 → not logged in / bad session / not on the allowlist
 *  - 403 → logged in but missing the required permission
 *
 * Usage in a route handler:
 *   const auth = await authorizeAdmin(req.cookies.get(ADMIN_SESSION_COOKIE)?.value, 'coupons.manage');
 *   if (!auth.ok) return NextResponse.json({ error: '…' }, { status: auth.status });
 */
export async function authorizeAdmin(
  sessionToken: string | undefined,
  required?: AdminPermission,
): Promise<AdminAuthResult> {
  if (!sessionToken) return { ok: false, status: 401 };

  const session = parseAdminSession(sessionToken);
  if (!session) return { ok: false, status: 401 };

  const member = await loadAdminMember(session.discordUserId);
  if (!member) return { ok: false, status: 401 };

  if (required && !memberHasPermission(member, required)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, member };
}

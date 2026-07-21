import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { query, queryOne } from '@/lib/db';
import { isAdminPermission, parseAdminPermissions, type AdminPermission } from '@/lib/adminPerms';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

interface TeamRow {
  discord_user_id: string;
  display_name:    string | null;
  is_owner:        number;
  permissions:     string | unknown[];
  active:          number;
}

export const GET = adminRoute('team.manage', async () => {
  const rows = await query<TeamRow>(
    `SELECT discord_user_id, display_name, is_owner, permissions, active
       FROM msk_admin_team
      ORDER BY is_owner DESC, created_at ASC`,
  );
  const members = rows.map(r => ({
    discordUserId: r.discord_user_id,
    displayName:   r.display_name,
    isOwner:       r.is_owner === 1,
    permissions:   parseAdminPermissions(r.permissions),
    active:        r.active === 1,
  }));
  return NextResponse.json({ members });
});

// Add (or re-activate) a team member. is_owner can NEVER be set via the API —
// only the ADMIN_OWNER_DISCORD_ID seed grants owner status.
export const POST = adminRoute('team.manage', async ({ req, member }) => {
  const body          = await req.json().catch(() => null);
  const discordUserId = typeof body?.discordUserId === 'string' ? body.discordUserId.trim() : '';
  const displayName   = typeof body?.displayName === 'string' ? (body.displayName.trim() || null) : null;
  const permissions: AdminPermission[] = (Array.isArray(body?.permissions) ? body.permissions : []).filter(isAdminPermission);

  if (!/^\d{5,32}$/.test(discordUserId)) {
    return NextResponse.json({ error: 'A valid Discord user id is required.' }, { status: 400 });
  }

  // Self-guard: a member must not edit their own row through POST. The PATCH
  // route blocks self-escalation, but POST's INSERT ... ON DUPLICATE KEY UPDATE
  // would otherwise let a non-owner re-write their OWN permissions to the full
  // set (real privilege escalation). Editing yourself is not a valid team
  // operation here — the owner seed / PATCH cover legitimate cases.
  if (discordUserId === member.discordUserId) {
    return NextResponse.json({ error: 'You cannot modify your own account here.' }, { status: 403 });
  }

  // Never let the owner row be overwritten through this route.
  const existing = await queryOne<{ is_owner: number }>(
    'SELECT is_owner FROM msk_admin_team WHERE discord_user_id = ?', [discordUserId],
  );
  if (existing?.is_owner === 1) {
    return NextResponse.json({ error: 'The owner cannot be modified.' }, { status: 403 });
  }

  await query(
    `INSERT INTO msk_admin_team (discord_user_id, display_name, is_owner, permissions, active, created_by)
     VALUES (?, ?, 0, ?, 1, ?)
     ON DUPLICATE KEY UPDATE display_name = COALESCE(VALUES(display_name), display_name), permissions = VALUES(permissions), active = 1`,
    [discordUserId, displayName, JSON.stringify(permissions), member.discordUserId],
  );
  await writeAudit(member.discordUserId, 'team.add', discordUserId, { permissions });
  return NextResponse.json({ success: true });
});

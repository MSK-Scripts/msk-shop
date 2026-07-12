import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { query, queryOne } from '@/lib/db';
import { isAdminPermission, type AdminPermission } from '@/lib/adminPerms';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

/** Returns true/false if the row exists (owner flag), or null if not found. */
async function ownerFlag(discordUserId: string): Promise<boolean | null> {
  const row = await queryOne<{ is_owner: number }>(
    'SELECT is_owner FROM msk_admin_team WHERE discord_user_id = ?', [discordUserId],
  );
  return row ? row.is_owner === 1 : null;
}

// Update a member's permissions / active state. The owner is never editable
// here, and a member cannot lock themselves out.
export const PATCH = adminRoute<{ discordUserId: string }>('team.manage', async ({ req, member, params }) => {
  const target = params.discordUserId;

  const isOwner = await ownerFlag(target);
  if (isOwner === null) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  if (isOwner)          return NextResponse.json({ error: 'The owner cannot be modified.' }, { status: 403 });

  const body        = await req.json().catch(() => null);
  const permissions: AdminPermission[] = (Array.isArray(body?.permissions) ? body.permissions : []).filter(isAdminPermission);
  const active      = typeof body?.active === 'boolean' ? body.active : true;

  // Self-edit guards (owner-self is already blocked above, so `member` here is a
  // non-owner editing their own row):
  //  - cannot drop team.manage or deactivate themselves (lockout)
  //  - cannot grant themselves permissions they don't already have (no self-
  //    escalation / separation of duties). Granting rights to OTHERS stays allowed.
  if (target === member.discordUserId) {
    if (!permissions.includes('team.manage')) {
      return NextResponse.json({ error: 'You cannot remove your own "Manage team" permission.' }, { status: 403 });
    }
    if (!active) {
      return NextResponse.json({ error: 'You cannot deactivate yourself.' }, { status: 403 });
    }
    const escalated = permissions.filter(p => !member.permissions.includes(p));
    if (escalated.length > 0) {
      return NextResponse.json({ error: 'You cannot grant yourself additional permissions.' }, { status: 403 });
    }
  }

  await query(
    'UPDATE msk_admin_team SET permissions = ?, active = ? WHERE discord_user_id = ?',
    [JSON.stringify(permissions), active ? 1 : 0, target],
  );
  await writeAudit(member.discordUserId, 'team.update', target, { permissions, active });
  return NextResponse.json({ success: true });
});

// Remove a member. Cannot remove the owner or yourself.
export const DELETE = adminRoute<{ discordUserId: string }>('team.manage', async ({ member, params }) => {
  const target = params.discordUserId;

  if (target === member.discordUserId) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 403 });
  }
  const isOwner = await ownerFlag(target);
  if (isOwner === null) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  if (isOwner)          return NextResponse.json({ error: 'The owner cannot be removed.' }, { status: 403 });

  await query('DELETE FROM msk_admin_team WHERE discord_user_id = ?', [target]);
  await writeAudit(member.discordUserId, 'team.remove', target);
  return NextResponse.json({ success: true });
});

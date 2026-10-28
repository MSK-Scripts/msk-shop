import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { maskPersonalData, maskPersonalText } from '@/lib/adminMask';
import { query }        from '@/lib/db';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

interface AuditRow {
  id:              number;
  discord_user_id: string;
  display_name:    string | null;
  action:          string;
  target:          string | null;
  detail:          unknown;
  created_at:      string | Date;
}

/**
 * The detail as JSON text, with every email and IP address in it masked. A
 * ban reason or a note can carry one, and the log keeps it for good.
 */
function maskedDetail(detail: unknown): string | null {
  if (detail === null || detail === undefined) return null;
  if (typeof detail !== 'string') return JSON.stringify(maskPersonalData(detail));
  try {
    return JSON.stringify(maskPersonalData(JSON.parse(detail)));
  } catch {
    return maskPersonalText(detail);
  }
}

// Read the 100 most recent admin actions, with the name the acting admin has
// on the team (plan 6.6: the log names people, not Discord ids). LEFT JOIN, so
// an entry of someone who left the team keeps its id.
export const GET = adminRoute('team.manage', async () => {
  const rows = await query<AuditRow>(
    `SELECT a.id, a.discord_user_id, t.display_name, a.action, a.target, a.detail, a.created_at
       FROM msk_admin_audit a
       LEFT JOIN msk_admin_team t ON t.discord_user_id = a.discord_user_id
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT 100`,
  );
  const entries = rows.map(r => ({
    id:            r.id,
    discordUserId: r.discord_user_id,
    adminName:     r.display_name ?? null,
    action:        r.action,
    target:        r.target === null ? null : maskPersonalText(r.target),
    detail:        maskedDetail(r.detail),
    createdAt:     new Date(r.created_at).toISOString(),
  }));
  return NextResponse.json({ entries }, { headers: { 'Cache-Control': 'no-store' } });
});

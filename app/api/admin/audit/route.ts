import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { query }        from '@/lib/db';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

interface AuditRow {
  id:              number;
  discord_user_id: string;
  action:          string;
  target:          string | null;
  detail:          unknown;
  created_at:      string | Date;
}

// Read the 100 most recent admin actions.
export const GET = adminRoute('team.manage', async () => {
  const rows = await query<AuditRow>(
    `SELECT id, discord_user_id, action, target, detail, created_at
       FROM msk_admin_audit
      ORDER BY created_at DESC, id DESC
      LIMIT 100`,
  );
  const entries = rows.map(r => ({
    id:            r.id,
    discordUserId: r.discord_user_id,
    action:        r.action,
    target:        r.target,
    detail:        typeof r.detail === 'string' ? r.detail : (r.detail ? JSON.stringify(r.detail) : null),
    createdAt:     new Date(r.created_at).toISOString(),
  }));
  return NextResponse.json({ entries });
});

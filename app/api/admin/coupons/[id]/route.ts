import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin }  from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

export const DELETE = adminRoute<{ id: string }>('coupons.manage', async ({ member, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid coupon id.' }, { status: 400 });
  }
  await tebexPlugin.coupons.remove(id);
  await writeAudit(member.discordUserId, 'coupon.delete', params.id);
  return NextResponse.json({ success: true });
});

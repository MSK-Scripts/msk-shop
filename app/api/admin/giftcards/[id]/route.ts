import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin }  from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// Top up a gift card's balance.
export const PUT = adminRoute<{ id: string }>('giftcards.manage', async ({ req, member, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid gift card id.' }, { status: 400 });
  }
  const body   = await req.json().catch(() => null);
  const amount = typeof body?.amount === 'number' ? body.amount : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
  }

  await tebexPlugin.giftCards.topUp(id, String(amount));
  await writeAudit(member.discordUserId, 'giftcard.topup', params.id, { amount });
  return NextResponse.json({ success: true });
});

// Void (disable) a gift card.
export const DELETE = adminRoute<{ id: string }>('giftcards.manage', async ({ member, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid gift card id.' }, { status: 400 });
  }
  await tebexPlugin.giftCards.void(id);
  await writeAudit(member.discordUserId, 'giftcard.void', params.id);
  return NextResponse.json({ success: true });
});

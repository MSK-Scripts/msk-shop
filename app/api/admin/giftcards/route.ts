import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin, unwrapList, type TebexGiftCard } from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

export const GET = adminRoute('giftcards.manage', async () => {
  const giftCards = unwrapList<TebexGiftCard>(await tebexPlugin.giftCards.list());
  return NextResponse.json({ giftCards });
});

// Create a gift card with a starting balance.
export const POST = adminRoute('giftcards.manage', async ({ req, member }) => {
  const body   = await req.json().catch(() => null);
  const amount = typeof body?.amount === 'number' ? body.amount : NaN;
  const note   = typeof body?.note === 'string' ? (body.note.trim() || undefined) : undefined;
  const expiresAt = typeof body?.expiresAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.expiresAt)
    ? `${body.expiresAt} 00:00:00`
    : undefined;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
  }

  const result = await tebexPlugin.giftCards.create(amount, note, expiresAt);
  await writeAudit(member.discordUserId, 'giftcard.create', null, { amount });
  return NextResponse.json({ result });
});

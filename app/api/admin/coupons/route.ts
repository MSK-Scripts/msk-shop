import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin }  from '@/lib/tebexPlugin';
import { couponState, countCouponStates, isTrue } from '@/lib/couponStatus';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

/**
 * Lists every coupon with its state attached, so the dashboard can show the
 * usable ones by default and still reveal the history without a second round
 * trip. Filtering server-side would mean re-reading all ~35 upstream pages
 * every time someone flips the toggle.
 *
 * Trimmed to the fields the table renders: the raw payload is roughly three
 * times the size and carries nothing else the UI uses.
 */
export const GET = adminRoute('coupons.manage', async () => {
  const { coupons: all, truncated } = await tebexPlugin.coupons.listAll();
  const now = Date.now();

  const coupons = all.map(c => ({
    id:         c.id,
    code:       c.code,
    discount:   c.discount,
    effective:  { type: c.effective?.type },
    expiresAt:  isTrue(c.expire?.expire_never) ? null : (c.expire?.date ?? null),
    redeemsLeft: isTrue(c.expire?.redeem_unlimited) ? null : Number(c.expire?.limit ?? 0),
    username:   c.username || null,
    note:       c.note || null,
    state:      couponState(c, now),
  }));

  return NextResponse.json({ result: { coupons, counts: countCouponStates(all, now), truncated } });
});

// Create a simple coupon (cart-wide, or scoped to package/category ids).
export const POST = adminRoute('coupons.manage', async ({ req, member }) => {
  const body = await req.json().catch(() => null);

  const code         = typeof body?.code === 'string' ? body.code.trim() : '';
  const discountType = body?.discountType === 'value' ? 'value' : 'percentage';
  const amount       = typeof body?.amount === 'number' ? body.amount : NaN;
  const effectiveOn  = ['cart', 'package', 'category'].includes(body?.effectiveOn) ? body.effectiveOn : 'cart';
  const ids          = (typeof body?.ids === 'string' ? body.ids.split(',') : [])
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => Number.isInteger(n) && n > 0);

  if (!code)                                 return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
  if (effectiveOn !== 'cart' && ids.length === 0) return NextResponse.json({ error: 'Provide at least one package/category id.' }, { status: 400 });

  const result = await tebexPlugin.coupons.create({
    code,
    effective_on:        effectiveOn,
    packages:            effectiveOn === 'package'  ? ids : [],
    categories:          effectiveOn === 'category' ? ids : [],
    discount_type:       discountType,
    discount_amount:     discountType === 'value'      ? amount : 0,
    discount_percentage: discountType === 'percentage' ? amount : 0,
    redeem_unlimited:    true,
    expire_never:        true,
    basket_type:         'both',
  });
  await writeAudit(member.discordUserId, 'coupon.create', code, { discountType, amount, effectiveOn });
  return NextResponse.json({ result });
});

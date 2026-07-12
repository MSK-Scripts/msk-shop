import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin, unwrapList, type TebexCoupon } from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

export const GET = adminRoute('coupons.manage', async () => {
  const coupons = unwrapList<TebexCoupon>(await tebexPlugin.coupons.list());
  return NextResponse.json({ coupons });
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

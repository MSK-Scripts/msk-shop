import { NextResponse }   from 'next/server';
import { adminRoute }     from '@/lib/adminApi';
import { writeAudit }     from '@/lib/adminAudit';
import { tebexPlugin, unwrapList, type TebexPayment } from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// List the most recent payments.
export const GET = adminRoute('payments.view', async () => {
  const payments = unwrapList<TebexPayment>(await tebexPlugin.payments.list(100));
  return NextResponse.json({ payments });
});

// Create a manual payment. `price: 0` grants the package(s) to a player for free.
export const POST = adminRoute('payments.create', async ({ req, member }) => {
  const body = await req.json().catch(() => null);

  const ign   = typeof body?.ign === 'string' ? body.ign.trim() : '';
  const price = typeof body?.price === 'number' ? body.price : NaN;
  const note  = typeof body?.note === 'string' ? body.note : undefined;
  const ids = (Array.isArray(body?.packages) ? body.packages : [])
    .map((p: unknown) => Number((p as { id?: unknown })?.id))
    .filter((id: number) => Number.isInteger(id) && id > 0);
  const packages = [...new Set<number>(ids)].map(id => ({ id }));

  if (!ign)                                return NextResponse.json({ error: 'Recipient (ign) is required.' }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Price must be 0 or greater.' }, { status: 400 });
  if (packages.length === 0)               return NextResponse.json({ error: 'At least one valid package id is required.' }, { status: 400 });

  const result = await tebexPlugin.payments.createManual({ ign, packages, price, note });
  await writeAudit(
    member.discordUserId,
    price === 0 ? 'payment.create_free' : 'payment.create',
    ign,
    { packages, price },
  );
  return NextResponse.json({ result });
});

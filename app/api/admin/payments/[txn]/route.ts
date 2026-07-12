import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { tebexPlugin }  from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

const VALID_STATUS = ['complete', 'refund', 'chargeback'] as const;
type PaymentStatus = (typeof VALID_STATUS)[number];

// Change a payment's status (refund / chargeback / complete).
export const PATCH = adminRoute<{ txn: string }>('payments.refund', async ({ req, member, params }) => {
  const body   = await req.json().catch(() => null);
  const status = body?.status;

  if (!VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  await tebexPlugin.payments.setStatus(params.txn, status as PaymentStatus);
  await writeAudit(member.discordUserId, 'payment.status', params.txn, { status });
  return NextResponse.json({ success: true });
});

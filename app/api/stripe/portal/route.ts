import { NextResponse }   from 'next/server';
import { authorizeGuild } from '@/lib/dashboardAuth';
import { getStripe }      from '@/lib/stripe';

// ── Stripe Customer Portal ───────────────────────────────────────────────────
//
// Opens the Stripe-hosted customer portal for the guild's customer. The portal
// lists ALL subscriptions under that customer (the person), so a customer manages
// every server's subscription, payment method and invoices in one place — and can
// cancel at any time (German §312k cancellation requirement).

export async function POST(req: Request): Promise<NextResponse> {
  // Parse body
  let guildId: string;
  try {
    const body = await req.json();
    guildId    = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Auth — the session's Discord user must own this guild
  const auth = await authorizeGuild(guildId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const customerId = auth.guild.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: 'No active subscription for this account.' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';

  try {
    const stripe  = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${baseUrl}/ticketbot/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/portal] Failed to create portal session:', err);
    return NextResponse.json({ error: 'Could not open the customer portal.' }, { status: 500 });
  }
}

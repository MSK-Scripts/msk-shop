import { NextResponse }  from 'next/server';
import { createHmac }    from 'crypto';
import { query }         from '@/lib/db';
import type { Tier }     from '@/lib/tiers';

// ── GitHub Sponsors Webhook ────────────────────────────────────────────────────
//
// Configure in GitHub → Settings → Sponsors → Webhooks
// Events: sponsorship (created, cancelled, tier_changed, pending_cancellation)
//
// Set the secret in your .env.local as GITHUB_SPONSORS_WEBHOOK_SECRET

// ── Types ──────────────────────────────────────────────────────────────────────

interface SponsorshipPayload {
  action: 'created' | 'cancelled' | 'tier_changed' | 'pending_cancellation' | 'edited';
  sponsorship: {
    sponsor: {
      login: string;
    };
    tier: {
      monthly_price_in_dollars: number;
    };
  };
}

// ── Tier Mapping ───────────────────────────────────────────────────────────────

/** Map GitHub Sponsors monthly amount → internal tier. */
function resolveGitHubTier(monthlyUsd: number): Tier {
  if (monthlyUsd >= 10) return 'premium_plus';
  if (monthlyUsd >= 5)  return 'premium';
  return 'basic';
}

// ── Signature Verification ─────────────────────────────────────────────────────

/** Verify the GitHub webhook signature (HMAC-SHA256). */
async function verifyGitHubSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = process.env.GITHUB_SPONSORS_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[github-sponsors] GITHUB_SPONSORS_WEBHOOK_SECRET is not set.');
    return false;
  }

  const signature = req.headers.get('x-hub-signature-256') ?? '';
  if (!signature.startsWith('sha256=')) return false;

  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // 1. Read raw body for signature verification (must be done before .json())
  const rawBody = await req.text();

  // 2. Verify GitHub signature
  const valid = await verifyGitHubSignature(req, rawBody);
  if (!valid) {
    console.warn('[github-sponsors] Invalid webhook signature.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // 3. Parse payload
  let payload: SponsorshipPayload;
  try {
    payload = JSON.parse(rawBody) as SponsorshipPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { action, sponsorship } = payload;
  const githubUsername = sponsorship?.sponsor?.login;

  if (!githubUsername) {
    return NextResponse.json({ error: 'Missing sponsor login.' }, { status: 400 });
  }

  // Map action to a string literal so CodeQL's taint tracker sees a clean value.
  // .replace()-based sanitizers are not recognised by CodeQL; a switch with
  // literal returns fully breaks the taint chain.
  const logAction: string = (() => {
    switch (action) {
      case 'created':              return 'created';
      case 'cancelled':            return 'cancelled';
      case 'tier_changed':         return 'tier_changed';
      case 'pending_cancellation': return 'pending_cancellation';
      case 'edited':               return 'edited';
      default:                     return 'unknown';
    }
  })();

  // GitHub usernames are alphanumeric + hyphens (1–39 chars). Anything that
  // does not match is replaced with a safe placeholder before logging.
  const logUsername: string = /^[a-zA-Z0-9-]{1,39}$/.test(githubUsername)
    ? githubUsername
    : '[invalid-username]';

  console.info(`[github-sponsors] Action: ${logAction} | Sponsor: ${logUsername}`);

  // 4. Handle each action
  switch (action) {
    case 'created':
    case 'tier_changed': {
      const tier   = resolveGitHubTier(sponsorship.tier.monthly_price_in_dollars);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 32); // ~1 month buffer

      // Update sponsors lookup table
      await query(
        `INSERT INTO ticketbot_sponsors (github_username, tier, active)
         VALUES (?, ?, TRUE)
         ON DUPLICATE KEY UPDATE tier = ?, active = TRUE`,
        [githubUsername, tier, tier],
      );

      // Update guild record if already linked
      await query(
        `UPDATE ticketbot_guilds
         SET tier = ?, active = TRUE, expires_at = ?
         WHERE github_username = ?`,
        [tier, expiry, githubUsername],
      );
      console.info(`[github-sponsors] Upgraded ${logUsername} → ${tier}`);
      break;
    }

    case 'cancelled':
    case 'pending_cancellation': {
      // Update sponsors lookup table
      await query(
        `INSERT INTO ticketbot_sponsors (github_username, tier, active)
         VALUES (?, 'basic', FALSE)
         ON DUPLICATE KEY UPDATE tier = 'basic', active = FALSE`,
        [githubUsername],
      );

      // Downgrade guild record if already linked
      await query(
        `UPDATE ticketbot_guilds
         SET tier = 'basic', expires_at = NULL
         WHERE github_username = ?`,
        [githubUsername],
      );
      console.info(`[github-sponsors] Downgraded ${logUsername} → basic`);
      break;
    }

    default:
      // Ignore unknown actions (e.g. 'edited')
      break;
  }

  return NextResponse.json({ ok: true });
}

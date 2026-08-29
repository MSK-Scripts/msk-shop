import { NextResponse }  from 'next/server';
import { queryOne }       from '@/lib/db';
import { TIER_CONFIG, type Tier } from '@/lib/tiers';

interface GuildRow { tier: Tier; active: number; }

export async function GET(req: Request): Promise<NextResponse> {
  const auth   = req.headers.get('authorization') ?? '';
  const match  = auth.match(/^Bearer\s+([A-Za-z0-9_\-]{32,128})$/);
  const apiKey = match?.[1];

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header.' }, { status: 401 });
  }

  const guild = await queryOne<GuildRow>(
    `SELECT tier, active FROM ticketbot_guilds WHERE api_key = ?`,
    [apiKey],
  );

  if (!guild || guild.active === 0) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
  }

  // The bot gets the limits of its tier along with the tier itself. Without
  // them it would have to keep its own copy of the numbers, which is exactly
  // how a bot ends up uploading 100 MB of attachments for a tier that allows
  // 500, or uploading any at all for a tier that allows none. The limits live
  // in lib/tiers.ts and nowhere else.
  const cfg = TIER_CONFIG[guild.tier];

  return NextResponse.json({
    valid: true,
    tier:  guild.tier,
    limits: {
      transcriptMaxBytes: cfg.transcriptMaxBytes,
      attachmentMaxBytes: cfg.attachmentMaxBytes,
      storageDays:        cfg.storageDays,
      uploadsPerHour:     cfg.uploadsPerHour,
      attachments:        cfg.attachments,
      customDomain:       cfg.customDomain,
      removeBranding:     cfg.removeBranding,
    },
  });
}

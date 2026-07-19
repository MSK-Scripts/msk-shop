import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { query }        from '@/lib/db';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

interface GuildRow {
  guild_id:      string;
  guild_name:    string | null;
  api_key:       string;
  tier:          'basic' | 'premium' | 'premium_plus';
  custom_domain: string | null;
  domain_status: 'none' | 'pending_dns' | 'active';
  is_hosted:     number;
  active:        number;
  created_at:    string;
  expires_at:    string | null;
}

// List every ticket bot API key with its guild, tier and custom domain. Visible
// to anyone who can view OR change API keys (adminRoute array = "any of these").
export const GET = adminRoute(['api_key.view', 'api_key.change'], async () => {
  const rows = await query<GuildRow>(
    `SELECT guild_id, guild_name, api_key, tier, custom_domain, domain_status,
            is_hosted, active, created_at, expires_at
       FROM ticketbot_guilds
      ORDER BY created_at DESC`,
  );

  const keys = rows.map(r => ({
    guildId:      r.guild_id,
    guildName:    r.guild_name,
    apiKey:       r.api_key,
    tier:         r.tier,
    customDomain: r.domain_status === 'active' ? r.custom_domain : null,
    domainStatus: r.domain_status,
    isHosted:     r.is_hosted === 1,
    active:       r.active === 1,
    createdAt:    r.created_at,
    expiresAt:    r.expires_at,
  }));

  return NextResponse.json({ keys });
});

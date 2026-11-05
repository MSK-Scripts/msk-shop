import { query, withTransaction } from '@/lib/db'

// =============================================================================
// msk_sponsor_links: which GitHub account belongs to which Discord user
// =============================================================================
// One row per Discord user, and one GitHub account maps to at most one Discord
// user (UNIQUE github_user_id). Linking a GitHub account that already belongs
// to someone else moves it: the old row goes in the same transaction, so a
// sponsorship can never carry the role for two Discord accounts at once.
// =============================================================================

export interface SponsorLink {
  discordUserId: string
  githubUserId:  number
  githubLogin:   string | null
}

export async function upsertSponsorLink(discordUserId: string, githubUserId: number, githubLogin: string): Promise<void> {
  await withTransaction(async conn => {
    await conn.execute(
      'DELETE FROM msk_sponsor_links WHERE github_user_id = ? AND discord_user_id <> ?',
      [githubUserId, discordUserId],
    )
    await conn.execute(
      `INSERT INTO msk_sponsor_links (discord_user_id, github_user_id, github_login)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE github_user_id = VALUES(github_user_id), github_login = VALUES(github_login)`,
      [discordUserId, githubUserId, githubLogin],
    )
  })
}

interface LinkRow {
  discord_user_id: string
  github_user_id:  number | string
  github_login:    string | null
}

export async function listSponsorLinks(): Promise<SponsorLink[]> {
  const rows = await query<LinkRow>('SELECT discord_user_id, github_user_id, github_login FROM msk_sponsor_links')
  return rows.map(r => ({
    discordUserId: String(r.discord_user_id),
    githubUserId:  Number(r.github_user_id),
    githubLogin:   r.github_login,
  }))
}

/**
 * Gives the Discord user the sponsor role right away. True on success; false
 * when Discord refuses (most often: the user is not on the server) or is
 * unreachable. Idempotent on Discord's side, a second PUT is a no-op.
 */
export async function grantSponsorRole(
  opts: { botToken: string; guildId: string; roleId: string; discordUserId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(
      `https://discord.com/api/v10/guilds/${opts.guildId}/members/${opts.discordUserId}/roles/${opts.roleId}`,
      {
        method:  'PUT',
        headers: {
          Authorization:        `Bot ${opts.botToken}`,
          'X-Audit-Log-Reason': encodeURIComponent('GitHub Sponsor verified on msk-scripts.de'),
        },
        signal: AbortSignal.timeout(10_000),
      },
    )
    return res.status === 204 || res.ok
  } catch {
    return false
  }
}

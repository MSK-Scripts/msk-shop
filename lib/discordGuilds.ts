/**
 * Reading a user's Discord guilds: the only place that talks to
 * `GET /users/@me/guilds` and `GET /users/@me/guilds/{id}/member`.
 *
 * Both verify callbacks carried their own copy of the plain fetch until
 * 2026-09-12. That is the same shape of duplication that let the
 * ADMINISTRATOR-only bug live in two places until 2026-09-03, and it matters
 * more now: `reconcileGuildAccess()` takes away access based on a guild being
 * ABSENT from this list, so "did we really see the whole list" became a
 * correctness question rather than a detail.
 */

const API = 'https://discord.com/api/v10';

/** A guild exactly as `GET /users/@me/guilds` returns it (fields we use). */
export interface RawGuild {
  id:          string;
  name:        string;
  icon:        string | null;
  owner:       boolean;
  permissions: string;
}

export interface UserGuilds {
  guilds: RawGuild[];
  /**
   * True only when Discord's answer is provably the user's COMPLETE guild
   * list. Any error, any unparsable body and any page we could not follow
   * leaves this false, and callers that remove access must then do nothing.
   * An empty list with `complete: false` means "we do not know", never
   * "this user manages nothing".
   */
  complete: boolean;
}

/** Discord's maximum page size for this endpoint. */
const PAGE_SIZE = 200;

/**
 * Hard stop for the pagination loop, so a misbehaving upstream cannot keep us
 * fetching. Six pages is far past anything reachable today (Discord caps
 * membership at 100 guilds, 200 with Nitro).
 */
const MAX_PAGES = 6;

/**
 * Fetch every guild the user is a member of.
 *
 * Pagination is a boundary guard, not a common path: a user sitting at exactly
 * 200 guilds returns a full page, and a full page is indistinguishable from a
 * truncated one. One extra request settles it. Without that, a Nitro user at
 * the cap could have guilds silently missing from the list, and absence is
 * what `reconcileGuildAccess()` reads as "lost access".
 */
export async function fetchUserGuilds(accessToken: string): Promise<UserGuilds> {
  const guilds: RawGuild[] = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (after) params.set('after', after);

    let batch: unknown;
    try {
      const res = await fetch(`${API}/users/@me/guilds?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Covers 401 (revoked), 403 (missing scope) and 429 (rate limited)
      // alike: none of them tell us what the user manages.
      if (!res.ok) return { guilds, complete: false };
      batch = await res.json();
    } catch {
      return { guilds, complete: false };
    }

    // Discord answers errors with an object, not an array.
    if (!Array.isArray(batch)) return { guilds, complete: false };

    guilds.push(...(batch as RawGuild[]));

    // A short page is the end of the list, and the only proof we get of it.
    if (batch.length < PAGE_SIZE) return { guilds, complete: true };

    const last = (batch[batch.length - 1] as RawGuild | undefined)?.id;
    if (!last) return { guilds, complete: false };
    after = last;
  }

  // Ran out of pages before seeing a short one, treat as unknown.
  return { guilds, complete: false };
}

/**
 * The authenticated user's role ids in one guild.
 *
 * Needs the `guilds.members.read` scope, which the giveaway flow requests and
 * the ticketbot flow does not. Returns null on any failure, including "the
 * token was never granted that scope", a caller must read null as "cannot
 * say", never as "holds no roles".
 */
export async function fetchGuildMemberRoles(
  accessToken: string,
  guildId: string,
): Promise<string[] | null> {
  try {
    const res = await fetch(`${API}/users/@me/guilds/${encodeURIComponent(guildId)}/member`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const member = await res.json();
    if (!Array.isArray(member?.roles)) return null;
    return member.roles.map(String);
  } catch {
    return null;
  }
}

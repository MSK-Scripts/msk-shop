#!/usr/bin/env node
/**
 * sponsors-reconcile.js — keeps ticketbot_sponsors / ticketbot_guilds in sync
 * with the *current* list of active GitHub Sponsors.
 *
 * WHY THIS EXISTS
 * ---------------
 * GitHub Sponsors fires webhooks only on `created`, `tier_changed`, `cancelled`
 * and `pending_cancellation` — there is NO webhook for the monthly recurring
 * renewal. So a sponsor who keeps paying month after month never produces a new
 * event, and any time-based `expires_at` we set from a webhook drifts into the
 * past even though the sponsor is still actively paying. Likewise, a single
 * dropped `cancelled` webhook would leave someone premium forever.
 *
 * This script reconciles against the GitHub GraphQL API (the source of truth):
 *   • Active GitHub sponsor  → sponsors row active=TRUE + correct tier,
 *                              guild tier bumped, expires_at rolled forward.
 *   • DB-active but no longer
 *     sponsoring on GitHub    → sponsors row active=FALSE + tier basic,
 *                              guild downgraded to basic.
 *
 * Hosted bots are NOT auto-archived here (that destructive PM2/FS work stays in
 * the cancel webhook) — instead a downgrade of an is_hosted guild is logged
 * loudly so it can be handled manually.
 *
 * DEPLOYMENT (same pattern as cleanup.js)
 * ---------------------------------------
 * Deployed with the repo at /opt/msk-shop/scripts/sponsors-reconcile.js. It
 * reads its config from the environment but does NOT load dotenv itself, and it
 * requires mysql2 — so the cron must source .env.local and point NODE_PATH at
 * the app's node_modules. Needs Node >= 18 (global fetch).
 *
 *   0 4 * * * set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node \
 *     /opt/msk-shop/scripts/sponsors-reconcile.js \
 *     >> /var/log/msk-sponsors-reconcile.log 2>&1
 *
 * Required env: GITHUB_SPONSORS_TOKEN (a PAT owned by / with access to the
 *   sponsored account). Classic PAT scopes: `read:user` (+ `read:org` if the
 *   Sponsors profile belongs to an organization). Without it the script exits
 *   without touching the database.
 * Optional env: GITHUB_SPONSORS_LOGIN — the sponsorable login when the Sponsors
 *   profile is owned by an organization (e.g. MSK-Scripts) or a user other than
 *   the token owner. If unset, the token owner (viewer) is used.
 *
 * Flags: --dry-run   log intended changes without writing to the DB.
 */

const mysql = require('mysql2/promise');

const DRY_RUN  = process.argv.includes('--dry-run');
const GH_TOKEN = process.env.GITHUB_SPONSORS_TOKEN;
const GH_API   = 'https://api.github.com/graphql';

/** Map GitHub Sponsors monthly amount → internal tier. Mirrors the webhook. */
function resolveGitHubTier(monthlyUsd) {
  if (monthlyUsd >= 10) return 'premium_plus';
  if (monthlyUsd >= 5)  return 'premium';
  return 'basic';
}

// The sponsorable can be an organization, a user, or — if no login is given —
// the token owner (viewer). GitHub Sponsors profiles are often owned by an org
// (e.g. MSK-Scripts) rather than the personal account, so the login is
// configurable via GITHUB_SPONSORS_LOGIN.
const SPONSORABLE_LOGIN = (process.env.GITHUB_SPONSORS_LOGIN ?? '').trim();

const SPONSORSHIPS_FIELD = `
  sponsorshipsAsMaintainer(first: 100, after: $cursor, activeOnly: true, includePrivate: true) {
    pageInfo { hasNextPage endCursor }
    nodes {
      isOneTimePayment
      tier { monthlyPriceInDollars }
      sponsorEntity {
        __typename
        ... on User { login }
        ... on Organization { login }
      }
    }
  }
`;

/** Build the GraphQL query for a given root field ('viewer' | 'organization' | 'user'). */
function buildQuery(rootField) {
  return rootField === 'viewer'
    ? `query($cursor: String) { viewer { ${SPONSORSHIPS_FIELD} } }`
    : `query($login: String!, $cursor: String) { ${rootField}(login: $login) { ${SPONSORSHIPS_FIELD} } }`;
}

/**
 * Run one sponsorshipsAsMaintainer page for a given root field.
 * Returns the connection object, or null if the account of that type does not
 * exist (NOT_FOUND) — so the caller can fall back to another root. Throws on
 * any other API/HTTP/GraphQL error so the caller can abort WITHOUT touching the
 * DB (we must never treat a failed fetch as "zero sponsors").
 */
async function fetchPage(rootField, cursor) {
  const variables = rootField === 'viewer' ? { cursor } : { login: SPONSORABLE_LOGIN, cursor };

  const res = await fetch(GH_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Content-Type':  'application/json',
      'User-Agent':    'msk-shop-sponsors-reconcile',
    },
    body: JSON.stringify({ query: buildQuery(rootField), variables }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors) {
    // Tolerate "not found" — it just means the login isn't this account type.
    if (json.errors.every(e => e.type === 'NOT_FOUND')) return null;
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  const root = json?.data?.[rootField];
  return root ? (root.sponsorshipsAsMaintainer ?? null) : null;
}

/**
 * Fetch ALL active (recurring) sponsors from GitHub. Picks the right root:
 * with GITHUB_SPONSORS_LOGIN set it tries `organization` then `user`; without
 * it, the token owner (`viewer`).
 *
 * @returns {Promise<Array<{ login: string, tier: string }>>}
 */
async function fetchActiveSponsors() {
  const candidates = SPONSORABLE_LOGIN ? ['organization', 'user'] : ['viewer'];

  for (const rootField of candidates) {
    let conn = await fetchPage(rootField, null);
    if (conn === null) continue; // wrong account type — try the next candidate

    const sponsors = [];
    for (;;) {
      for (const node of conn.nodes ?? []) {
        // Skip one-time payments — they are not an ongoing tier grant.
        if (node.isOneTimePayment) continue;
        const login = node.sponsorEntity?.login;
        if (!login) continue;
        const monthly = Number(node.tier?.monthlyPriceInDollars ?? 0);
        sponsors.push({ login, tier: resolveGitHubTier(monthly) });
      }
      if (!conn.pageInfo?.hasNextPage) break;
      conn = await fetchPage(rootField, conn.pageInfo.endCursor);
      if (conn === null) break; // should not happen mid-pagination
    }

    console.log(`[reconcile] Source: ${rootField}${SPONSORABLE_LOGIN ? ` (${SPONSORABLE_LOGIN})` : ''}`);
    return sponsors;
  }

  if (SPONSORABLE_LOGIN) {
    throw new Error(`Could not resolve sponsorable '${SPONSORABLE_LOGIN}' as an organization or user.`);
  }
  return [];
}

async function main() {
  console.log(`[reconcile] Starting at ${new Date().toISOString()}${DRY_RUN ? ' (DRY RUN)' : ''}`);

  if (!GH_TOKEN) {
    console.error('[reconcile] GITHUB_SPONSORS_TOKEN is not set — aborting without DB changes.');
    process.exit(1);
  }

  // 1. Source of truth — fetch BEFORE opening the DB so a failure means no writes.
  const active = await fetchActiveSponsors();
  console.log(`[reconcile] GitHub reports ${active.length} active recurring sponsor(s).`);

  // Case-insensitive lookup set of currently-sponsoring logins.
  const activeSet = new Set(active.map(s => s.login.toLowerCase()));

  const pool = mysql.createPool({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME     ?? '',
  });

  let upserted = 0;
  let downgraded = 0;

  try {
    // 2. Upsert every active sponsor + roll their guild's validity forward.
    for (const { login, tier } of active) {
      if (DRY_RUN) {
        console.log(`[reconcile] would upsert sponsor ${login} → ${tier} (active)`);
      } else {
        await pool.execute(
          `INSERT INTO ticketbot_sponsors (github_username, tier, active)
           VALUES (?, ?, TRUE)
           ON DUPLICATE KEY UPDATE tier = VALUES(tier), active = TRUE`,
          [login, tier],
        );
        await pool.execute(
          `UPDATE ticketbot_guilds
           SET tier = ?, active = TRUE, expires_at = NOW() + INTERVAL 35 DAY
           WHERE github_username = ?`,
          [tier, login],
        );
      }
      upserted++;
    }

    // 3. Downgrade DB-active sponsors that GitHub no longer lists.
    //    SAFETY: if GitHub returned zero sponsors, skip this phase entirely —
    //    that is far more likely a token/scope problem than everyone cancelling
    //    at once, and we refuse to mass-downgrade on a probable misconfig.
    if (active.length === 0) {
      console.warn('[reconcile] 0 active sponsors from GitHub — skipping downgrade phase (likely a token/scope issue, not a real mass-cancel).');
    } else {
      const [dbActive] = await pool.execute(
        `SELECT github_username FROM ticketbot_sponsors WHERE active = TRUE`,
      );

      for (const row of dbActive) {
        const username = row.github_username;
        if (!username || activeSet.has(username.toLowerCase())) continue;

        // This sponsor is active in our DB but not on GitHub → ended.
        const [hostedRows] = await pool.execute(
          `SELECT guild_id FROM ticketbot_guilds WHERE github_username = ? AND is_hosted = 1`,
          [username],
        );

        if (DRY_RUN) {
          console.log(`[reconcile] would downgrade ${username} → basic (no longer sponsoring)`);
        } else {
          await pool.execute(
            `INSERT INTO ticketbot_sponsors (github_username, tier, active)
             VALUES (?, 'basic', FALSE)
             ON DUPLICATE KEY UPDATE tier = 'basic', active = FALSE`,
            [username],
          );
          await pool.execute(
            `UPDATE ticketbot_guilds
             SET tier = 'basic', expires_at = NULL
             WHERE github_username = ?`,
            [username],
          );
        }
        downgraded++;
        console.log(`[reconcile] Downgraded ${username} → basic (ended on GitHub).`);

        // Hosted bots are NOT auto-archived here — flag for manual handling.
        for (const h of hostedRows) {
          console.warn(`[reconcile] ⚠ ${username} still has a HOSTED bot (guild ${h.guild_id}) — archive it manually or via the cancel webhook.`);
        }
      }
    }
  } finally {
    await pool.end();
  }

  console.log(`[reconcile] Done. Active upserted: ${upserted}, Downgraded: ${downgraded}${DRY_RUN ? ' (DRY RUN — no writes)' : ''}`);
}

main().catch(err => {
  console.error('[reconcile] Fatal error:', err.message ?? err);
  process.exit(1);
});

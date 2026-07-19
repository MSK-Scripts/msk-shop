/**
 * Admin dashboard permission model. Pure types + logic, NO database access
 * (so it can be imported anywhere, including the client for label rendering).
 *
 * The set of permissions mirrors what the Tebex Plugin API can actually do —
 * see docs/TEBEX_API_REFERENCE.md. Anything not listed here is not exposed by
 * any Tebex API and stays in the Creator Panel.
 */

export const ADMIN_PERMISSIONS = [
  'payments.view',
  'payments.create',
  'payments.refund',
  'coupons.manage',
  'giftcards.manage',
  'bans.manage',
  'packages.edit',
  'api_key.view',
  'api_key.change',
  'team.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/** Human-readable labels for the team-management UI. */
export const PERMISSION_LABELS: Record<AdminPermission, { label: string; description: string }> = {
  'payments.view':    { label: 'View payments',   description: 'See payments and player/purchase lookups' },
  'payments.create':  { label: 'Give packages',   description: 'Create a manual payment, incl. free (price 0)' },
  'payments.refund':  { label: 'Refund payments', description: 'Set a payment to refund / chargeback' },
  'coupons.manage':   { label: 'Manage coupons',  description: 'Create and delete coupons' },
  'giftcards.manage': { label: 'Manage gift cards', description: 'Create, top up and void gift cards' },
  'bans.manage':      { label: 'Manage bans',     description: 'Create and list bans' },
  'packages.edit':    { label: 'Edit packages',   description: 'Change package name, price and visibility' },
  'api_key.view':     { label: 'View API keys',   description: 'See ticket bot API keys, guilds, tiers and custom domains' },
  'api_key.change':   { label: 'Change API key tier', description: 'Change the tier of a ticket bot API key' },
  'team.manage':      { label: 'Manage team',     description: 'Add/remove team members and set permissions' },
};

/** Narrow an arbitrary string to a known AdminPermission. */
export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === 'string' && (ADMIN_PERMISSIONS as readonly string[]).includes(value);
}

export interface AdminTeamMember {
  discordUserId: string;
  displayName:   string | null;
  isOwner:       boolean;
  permissions:   AdminPermission[];
  active:        boolean;
}

/** Owner implies every permission; otherwise the permission must be granted. */
export function memberHasPermission(member: AdminTeamMember, perm: AdminPermission): boolean {
  return member.isOwner || member.permissions.includes(perm);
}

/**
 * Parse a stored `permissions` value into a validated AdminPermission[].
 * Handles both a JSON string (MariaDB) and an already-parsed array (MySQL),
 * and drops any unknown/removed permission strings.
 */
export function parseAdminPermissions(raw: unknown): AdminPermission[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) arr = p; } catch { /* ignore */ }
  }
  return arr.filter(isAdminPermission);
}

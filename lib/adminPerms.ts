/**
 * Admin dashboard permission model. Pure types + logic, NO database access
 * (so it can be imported anywhere, the client included). The labels people
 * read live in `adminTranslations.permissions` (lib/i18n.ts) since Phase 10.
 *
 * The permissions cover three separate systems, not one:
 *
 *   payments.* / coupons.* / giftcards.* / bans.* / packages.edit
 *       mirror what the Tebex Plugin API can actually do, see
 *       docs/TEBEX_API_REFERENCE.md. Anything not listed there is not exposed
 *       by any Tebex API and stays in the Creator Panel.
 *   api_key.*
 *       the ticket bot guild registry in our own database.
 *   images.*
 *       the image CDN inventory (msk_images), also our own database.
 *   news_popup.manage
 *       the site-wide announcement popup, stored in msk_site_settings. It has
 *       a permission of its own rather than riding along on an existing one
 *       because it is the only thing in this dashboard that writes text onto
 *       every public page of the shop.
 *
 * Until the image tab existed this header claimed the whole list mirrored
 * Tebex. It no longer does, and a comment that describes a smaller world than
 * the code is worse than no comment.
 *
 * `images.delete` is separate from `images.manage` for the same reason
 * `images.moderate` is: hiding an image is reversible in one click, deleting it
 * removes three files from the CDN and the row that knows their address. Anyone
 * who may fix a typo should not also be able to erase the inventory one row at
 * a time.
 *
 * `images.moderate` gates the one decision that is not ours to make casually:
 * resolving a `pending` row, i.e. what a community upload arrives as. The
 * queue is empty until the upload module lands (phase 4, point 20 of
 * docs/IMAGE_CDN_PLAN.md), but the state exists in the schema today and the
 * dashboard resolves it today, so the permission is wired, not reserved.
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
  'images.view',
  'images.manage',
  'images.moderate',
  'images.delete',
  'news_popup.manage',
  'team.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

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

/**
 * Starting points for the team editor (plan 6.6, Stripe: roles with access
 * levels). A template only sets the boxes in the form; the member gets
 * exactly the permissions that are saved, as before. The labels are in
 * `adminTranslations.team.templates`.
 */
export const ROLE_TEMPLATES = {
  support:    ['payments.view', 'giftcards.manage', 'bans.manage'],
  moderation: ['images.view', 'images.manage', 'images.moderate'],
  shop: [
    'payments.view', 'payments.create', 'payments.refund', 'coupons.manage', 'giftcards.manage',
    'bans.manage', 'packages.edit', 'news_popup.manage',
  ],
  full: [...ADMIN_PERMISSIONS],
} as const satisfies Record<string, readonly AdminPermission[]>

export type RoleTemplate = keyof typeof ROLE_TEMPLATES

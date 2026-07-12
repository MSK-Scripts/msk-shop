/**
 * Server-only client for the Tebex **Plugin API** (https://plugin.tebex.io).
 *
 * This is the backend for the admin dashboard. It holds the game-server secret
 * key (TEBEX_PLUGIN_SECRET) and must NEVER be imported into client code — the
 * key grants full, unscoped access to the store's operational endpoints.
 *
 * Endpoint/field details: docs/TEBEX_API_REFERENCE.md.
 * Auth: X-Tebex-Secret header. Rate limit: 500 requests / 5 min per key.
 *
 * SERVER-ONLY by convention: TEBEX_PLUGIN_SECRET has no NEXT_PUBLIC_ prefix, so it
 * is never bundled into client code. Only import this module from route handlers
 * / server components — never from a "use client" file.
 */

const BASE_URL = 'https://plugin.tebex.io';

function getSecret(): string {
  const secret = process.env.TEBEX_PLUGIN_SECRET;
  if (!secret) throw new Error('TEBEX_PLUGIN_SECRET is not set');
  return secret;
}

export class TebexPluginError extends Error {
  constructor(
    public status: number,
    /** User-facing message from Tebex (`error_message`), safe to surface. */
    public tebexMessage: string,
  ) {
    super(`Tebex Plugin API ${status}: ${tebexMessage}`);
    this.name = 'TebexPluginError';
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function pluginFetch<T = unknown>(
  path: string,
  opts: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const { method = 'GET', body } = opts;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'X-Tebex-Secret': getSecret(),
      Accept:           'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Operational data must never be cached.
    cache: 'no-store',
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      if (data && typeof data.error_message === 'string') msg = data.error_message;
    } catch {
      /* non-JSON error body */
    }
    throw new TebexPluginError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── Types (subset of documented fields) ──────────────────────────────────────

export interface TebexPayment {
  id:        string;
  amount:    number;
  date:      string;
  currency:  { iso_4217: string; symbol: string };
  gateway:   { id: string; name: string } | null;
  status:    string;
  email:     string;
  player:    { id: string; name: string; uuid: string };
  packages:  { id: number; name: string }[];
  notes?:    unknown[];
  creator_code?: string | null;
}

export interface TebexCoupon {
  id:       number;
  code:     string;
  effective:{ type: string; packages: number[]; categories: number[] };
  discount: { type: string; percentage: number; value: number };
}

export interface TebexGiftCard {
  id:      number;
  code:    string;
  balance: { starting: string; remaining: string; currency: string };
  note:    string | null;
  void:    boolean;
}

export interface CreateManualPaymentInput {
  /** In-game name / username of the recipient. */
  ign:      string;
  /** Packages to grant. `price: 0` gives them for free. */
  packages: { id: number; options?: Record<string, unknown> }[];
  price:    number;
  note?:    string;
}

/**
 * Normalize a Plugin API list response to a plain array. Different list
 * endpoints return either a bare array or a `{ data: [...] }` wrapper.
 */
export function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

// ── Public API surface ───────────────────────────────────────────────────────

export const tebexPlugin = {
  information: () => pluginFetch('/information'),

  payments: {
    list:   (limit = 100) => pluginFetch<{ data?: TebexPayment[] } | TebexPayment[]>(`/payments?limit=${encodeURIComponent(limit)}`),
    paged:  (page = 1)    => pluginFetch(`/payments?paged=1&page=${encodeURIComponent(page)}`),
    get:    (txn: string) => pluginFetch<TebexPayment>(`/payments/${encodeURIComponent(txn)}`),
    fields: (packageId: number) => pluginFetch(`/payments/fields/${encodeURIComponent(packageId)}`),
    /** Create a manual payment. `price: 0` grants the package(s) for free. */
    createManual: (input: CreateManualPaymentInput) =>
      pluginFetch<TebexPayment>('/payments', { method: 'POST', body: input }),
    /** status ∈ 'complete' | 'chargeback' | 'refund'. */
    setStatus: (txn: string, status: 'complete' | 'chargeback' | 'refund', username?: string) =>
      pluginFetch(`/payments/${encodeURIComponent(txn)}`, {
        method: 'PUT',
        body:   { status, ...(username ? { username } : {}) },
      }),
    addNote: (txn: string, note: string) =>
      pluginFetch(`/payments/${encodeURIComponent(txn)}/note`, { method: 'POST', body: { note } }),
  },

  coupons: {
    list:   () => pluginFetch('/coupons'),
    get:    (id: number) => pluginFetch<TebexCoupon>(`/coupons/${encodeURIComponent(id)}`),
    create: (body: Record<string, unknown>) => pluginFetch<TebexCoupon>('/coupons', { method: 'POST', body }),
    remove: (id: number) => pluginFetch(`/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  giftCards: {
    list:   () => pluginFetch<{ data?: TebexGiftCard[] }>('/gift-cards'),
    get:    (id: number)   => pluginFetch<TebexGiftCard>(`/gift-cards/${encodeURIComponent(id)}`),
    lookup: (code: string) => pluginFetch<TebexGiftCard>(`/gift-cards/lookup/${encodeURIComponent(code)}`),
    create: (amount: number, note?: string, expiresAt?: string) =>
      pluginFetch<TebexGiftCard>('/gift-cards', {
        method: 'POST',
        body:   { amount, ...(note ? { note } : {}), ...(expiresAt ? { expires_at: expiresAt } : {}) },
      }),
    topUp:  (id: number, amount: string) =>
      pluginFetch<TebexGiftCard>(`/gift-cards/${encodeURIComponent(id)}`, { method: 'PUT', body: { amount } }),
    void:   (id: number) => pluginFetch(`/gift-cards/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  bans: {
    list:   () => pluginFetch('/bans'),
    /** `user` is a username or UUID. */
    create: (reason: string, user: string, ip?: string) =>
      pluginFetch('/bans', { method: 'POST', body: { reason, user, ...(ip ? { ip } : {}) } }),
  },

  packages: {
    /** Only name / price / disabled are editable via the Plugin API. */
    update: (packageId: number, fields: { name?: string; price?: number; disabled?: boolean }) =>
      pluginFetch(`/package/${encodeURIComponent(packageId)}`, { method: 'PUT', body: fields }),
  },

  lookup: {
    /** `user` is a username or UUID. */
    user:      (user: string) => pluginFetch(`/user/${encodeURIComponent(user)}`),
    purchases: (playerId: string, packageId?: number) =>
      pluginFetch(`/player/${encodeURIComponent(playerId)}/packages${packageId ? `?package=${encodeURIComponent(packageId)}` : ''}`),
  },
};

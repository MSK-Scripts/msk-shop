// Server-side client for the giveaway bot's localhost control endpoint.
// Called ONLY from API routes that take the guildId from the signed
// session (never from the client body), which prevents IDOR.
const CONTROL_URL = process.env.GIVEAWAY_CONTROL_URL ?? 'http://127.0.0.1:8787';
const CONTROL_SECRET = process.env.GIVEAWAY_CONTROL_SECRET ?? '';

export interface ControlResult {
  status: number;
  data: unknown;
}

async function call(method: 'GET' | 'POST', path: string, init: { search?: Record<string, string>; body?: unknown }): Promise<ControlResult> {
  if (!CONTROL_SECRET) return { status: 503, data: { error: 'control_disabled' } };

  const url = new URL(path, CONTROL_URL);
  if (init.search) for (const [k, v] of Object.entries(init.search)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        'X-Control-Secret': CONTROL_SECRET,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method === 'POST' ? JSON.stringify(init.body ?? {}) : undefined,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch {
    return { status: 502, data: { error: 'control_unreachable' } };
  }
}

export function controlGet(guildId: string, path: string, search: Record<string, string> = {}): Promise<ControlResult> {
  return call('GET', path, { search: { ...search, guildId } });
}

export function controlPost(guildId: string, path: string, body: Record<string, unknown> = {}): Promise<ControlResult> {
  return call('POST', path, { body: { ...body, guildId } });
}

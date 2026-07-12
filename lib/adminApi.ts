import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin }            from './adminAuth';
import { ADMIN_SESSION_COOKIE }      from './adminSession';
import type { AdminPermission, AdminTeamMember } from './adminPerms';
import { TebexPluginError }          from './tebexPlugin';
import { rateLimit, getClientIp }    from './rateLimit';

interface AdminCtx<P> {
  req:    NextRequest;
  member: AdminTeamMember;
  params: P;
}

/**
 * Wraps an admin API handler with the shared security pipeline, so the auth path
 * is defined exactly once for every /api/admin route:
 *   1. session + permission check (401 / 403)
 *   2. per-IP rate limit (429)
 *   3. Tebex/error normalization (Tebex `error_message` passthrough, else 500)
 *
 * All mutations must use POST/PATCH/PUT/DELETE (never GET) — with SameSite=Lax
 * cookies that is what provides the CSRF protection.
 */
export function adminRoute<P = Record<string, string>>(
  perm: AdminPermission | AdminPermission[],
  handler: (ctx: AdminCtx<P>) => Promise<NextResponse>,
) {
  // `context` is typed required (Next's route validator rejects `| undefined`),
  // but at runtime it is absent for non-dynamic routes — hence the defensive
  // read below. P defaults to Record<string,string> so a static route's
  // `Promise<P>` stays assignable to Next's expected RouteContext.
  return async (req: NextRequest, context: { params: Promise<P> }): Promise<NextResponse> => {
    const auth = await authorizeAdmin(req.cookies.get(ADMIN_SESSION_COOKIE)?.value, perm);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.status === 403 ? 'Forbidden' : 'Unauthorized' }, { status: auth.status });
    }

    // CSRF defense-in-depth on mutations: browsers always send Origin on
    // POST/PATCH/PUT/DELETE and a cross-site attacker cannot forge it. Reject a
    // present-but-foreign Origin (a missing Origin, e.g. a same-origin server
    // call, is allowed — SameSite=Lax + the JSON body already guard those).
    if (req.method !== 'GET') {
      const origin  = req.headers.get('origin');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
      if (origin && origin !== baseUrl) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (!rateLimit(`admin:${getClientIp(req)}`, { limit: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
    }

    try {
      // Non-dynamic routes are called without a context arg at runtime.
      const ctx = context as { params?: Promise<P> } | undefined;
      const params = (ctx?.params ? await ctx.params : {}) as P;
      return await handler({ req, member: auth.member, params });
    } catch (err) {
      if (err instanceof TebexPluginError) {
        return NextResponse.json({ error: err.tebexMessage }, { status: err.status });
      }
      console.error('[admin] route error:', err);
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  };
}

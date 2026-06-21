// Simple in-memory rate limiter (resets on server restart)
// For production with multiple instances, use Redis/Upstash instead.

const requests = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  limit: number      // max requests
  windowMs: number   // time window in ms
}

/**
 * Extract the client IP for rate-limit keying from a Request.
 *
 * `X-Forwarded-For` is a comma-separated chain where each proxy APPENDS the
 * address it received the request from. Behind our single trusted reverse proxy
 * (Apache) the RIGHTMOST entry is the address Apache saw — i.e. the real client.
 * The leftmost entries are client-supplied and trivially spoofable, so keying on
 * them would let an attacker reset their bucket at will. We therefore take the
 * rightmost token. (Assumes exactly one trusted proxy; revisit if a CDN is added.)
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1].replace(/^::ffff:/, '');
  }
  return (req.headers.get('x-real-ip') ?? '127.0.0.1').replace(/^::ffff:/, '');
}

export function rateLimit(ip: string, opts: RateLimitOptions): boolean {
  const now = Date.now()
  const entry = requests.get(ip)

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + opts.windowMs })
    return true // allowed
  }

  if (entry.count >= opts.limit) {
    return false // blocked
  }

  entry.count++
  return true // allowed
}

// Clean up stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of requests.entries()) {
      if (now > val.resetAt) requests.delete(key)
    }
  }, 5 * 60 * 1000)
}

// Simple in-memory rate limiter (resets on server restart)
// For production with multiple instances, use Redis/Upstash instead.

const requests = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  limit: number      // max requests
  windowMs: number   // time window in ms
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

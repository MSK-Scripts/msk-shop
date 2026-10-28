import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

/**
 * Masking of personal data in the admin dashboard (plan 7, "Datenschutz im
 * Admin"; data minimisation and data protection by design, Art. 5 (1) c and
 * Art. 25 GDPR).
 *
 * Email and IP addresses leave the server masked. The full value of one
 * field is only sent by `POST /api/admin/reveal`, which checks the
 * permission of the area and writes an audit entry first. Masking in the
 * browser would not be masking: the full address would still sit in the
 * JSON, in the network panel and in every cache in between.
 *
 * The format keeps entries apart without giving them away:
 *
 *   email  `m***@g***.com #3f9a`   first letter of the name and of the
 *                                  domain, the top-level domain
 *   IPv4   `192.168.x.x #3f9a`     the first two octets
 *   IPv6   `2001:db8:x:x #3f9a`    the first two groups
 *
 * `#3f9a` is the first four hex digits of an HMAC of the whole value, keyed
 * from SESSION_SECRET. The same address always gets the same tag, so an
 * admin sees that two payments came from one buyer; a different address
 * almost always gets a different one. Keyed, because a plain hash of an
 * email can be confirmed against a list of known addresses offline.
 *
 * Server only: it needs the secret and `node:net`.
 */

/** Keys whose value is an email address, whatever its shape. */
const EMAIL_KEYS = new Set(['email', 'payment_email', 'paymentEmail', 'email_address', 'emailAddress'])
/** Keys whose value is an IP address, whatever its shape. */
const IP_KEYS = new Set(['ip', 'ip_address', 'ipAddress', 'last_ip', 'lastIp'])

const EMAIL_IN_TEXT = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g
const IPV4_IN_TEXT = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
// Candidates only: `isIP` decides. A time such as 12:30:45 matches the shape
// and is not an address.
const IPV6_IN_TEXT = /(?<![\w:])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?![\w:])/g

let cachedKey: { secret: string; key: Buffer } | null = null

/** A key of its own for the tags, derived from SESSION_SECRET (throws without it). */
function tagKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  if (cachedKey?.secret !== secret) {
    cachedKey = { secret, key: createHmac('sha256', secret).update('msk-admin-mask-tag-v1').digest() }
  }
  return cachedKey.key
}

/** Four hex digits that stand for the whole value. */
export function maskTag(kind: 'email' | 'ip', value: string): string {
  return createHmac('sha256', tagKey()).update(`${kind}:${value.trim().toLowerCase()}`).digest('hex').slice(0, 4)
}

/** `m***@g***.com #3f9a`. Anything without an @ is masked whole. */
export function maskEmail(email: string): string {
  // Lower case, as addresses are compared: MAX@GMAIL.COM is the same buyer.
  const value = email.trim().toLowerCase()
  if (!value) return value
  const tag = maskTag('email', value)
  const at = value.lastIndexOf('@')
  if (at <= 0 || at === value.length - 1) return `*** #${tag}`
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  const tld = dot > 0 ? domain.slice(dot + 1) : ''
  return `${local[0]}***@${domain[0]}***${tld ? `.${tld}` : ''} #${tag}`
}

/** `192.168.x.x #3f9a` or `2001:db8:x:x #3f9a`. Anything that is no address is masked whole. */
export function maskIp(ip: string): string {
  const value = ip.trim()
  if (!value) return value
  const tag = maskTag('ip', value)
  const version = isIP(value)
  if (version === 4) {
    const [a, b] = value.split('.')
    return `${a}.${b}.x.x #${tag}`
  }
  if (version === 6) {
    return `${value.split(':').slice(0, 2).join(':')}:x:x #${tag}`
  }
  return `x.x.x.x #${tag}`
}

/**
 * Free text with every email and IP address in it masked: a ban reason, a
 * note on a gift card, the detail of an audit entry. There is no reveal for
 * these; the record the address belongs to has its own field for that.
 */
export function maskPersonalText(text: string): string {
  if (!text) return text
  return text
    .replace(EMAIL_IN_TEXT, match => maskEmail(match))
    .replace(IPV6_IN_TEXT, match => (isIP(match) === 6 ? maskIp(match) : match))
    .replace(IPV4_IN_TEXT, match => (isIP(match) === 4 ? maskIp(match) : match))
}

function maskValue(value: unknown, key: string | null): unknown {
  if (typeof value === 'string') {
    if (key && EMAIL_KEYS.has(key)) return maskEmail(value)
    if (key && IP_KEYS.has(key)) return maskIp(value)
    return maskPersonalText(value)
  }
  if (Array.isArray(value)) return value.map(item => maskValue(item, key))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskValue(v, k)]))
  }
  return value
}

/**
 * A response body with every email and IP address in it masked: the fields
 * named like one (`email`, `payment_email`, `ip`, …) whatever they hold,
 * and any address inside other text. For the payloads Tebex hands over,
 * which may carry more fields than the ones this shop reads.
 */
export function maskPersonalData<T>(value: T): T {
  return maskValue(value, null) as T
}

/** A ticket bot API key with its middle cut out, as the admin always showed it. */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '••••'
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

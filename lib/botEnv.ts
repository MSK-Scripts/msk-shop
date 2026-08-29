import { readFile, writeFile, chmod } from 'fs/promises'
import { join, resolve }             from 'path'

// =============================================================================
// The .env of a hosted bot
// =============================================================================
// This is the OUT-OF-BAND layer, and that framing is what justifies it existing
// here at all: the bot's own dashboard can edit its .env, but a bot with a bad
// token never starts, so its dashboard is exactly what you cannot reach. The
// config editor was removed from msk-shop in July 2026 for the opposite reason —
// config.jsonc is only ever edited while the bot is up, so two editors just
// drifted apart. The .env is the file you need precisely when nothing runs.
//
// Patching is line based, not "parse and re-serialise": the file ships with a
// long explanatory comment block above almost every key, and a round trip
// through an object would throw all of it away. Only the KEY=… line being
// changed is touched; comments, blank lines, ordering and unknown keys survive
// byte for byte.
// =============================================================================

const GUILD_ID_RE = /^\d{17,20}$/
/** Same shape the bot's dotenv accepts: letters, digits, underscore. */
const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Absolute, validated directory of a hosted bot. Throws rather than returning a
 *  fallback — every caller here writes files, and a wrong path is not a case to
 *  paper over. */
export function botDir(guildId: string): string {
  if (!GUILD_ID_RE.test(guildId)) throw new Error(`Invalid guild id: ${guildId}`)

  const base = process.env.BOT_CONFIG_BASE_PATH
  if (!base) throw new Error('BOT_CONFIG_BASE_PATH is not configured')

  const resolvedBase = resolve(base)
  const dir          = resolve(join(base, guildId))

  if (!dir.startsWith(resolvedBase + '/') && !dir.startsWith(resolvedBase + '\\')) {
    throw new Error('Path traversal detected')
  }
  return dir
}

export const botEnvPath = (guildId: string) => join(botDir(guildId), '.env')

/**
 * Strip one layer of surrounding quotes and undo the escaping dotenv applies
 * inside double quotes. Mirrors what the bot's own `dotenv` does when it reads
 * the file back, so a value shown in the dashboard is the value the bot sees.
 */
export function unquote(raw: string): string {
  const v = raw.trim()
  if (v.length >= 2 && v[0] === '"' && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\(["\\n])/g, (_, c) => (c === 'n' ? '\n' : c))
  }
  if (v.length >= 2 && v[0] === "'" && v.endsWith("'")) {
    return v.slice(1, -1)
  }
  return v
}

/** Always double-quote on write. An unquoted value breaks on the first space,
 *  and a Discord client secret may legitimately contain characters dotenv would
 *  otherwise treat as syntax. */
export function quote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

/** Every KEY=VALUE the file defines, commented-out lines excluded. */
export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line)
    if (!m) continue
    out[m[1]] = unquote(m[2])
  }
  return out
}

/**
 * Set each key in `updates`, returning the new file text.
 *
 * A key that already has a line is rewritten in place. A key that appears only
 * as a commented-out example (`# DATABASE_URL=""`) is deliberately NOT revived —
 * the comment is documentation, and un-commenting it would change what the
 * surrounding text means. Such a key is appended at the end instead.
 *
 * `undefined` means "leave alone" so a caller can pass a whole form object with
 * untouched secret fields still in it.
 */
export function setEnvValues(text: string, updates: Record<string, string | undefined>): string {
  const pending = new Map<string, string>()
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue
    if (!KEY_RE.test(k)) throw new Error(`Invalid env key: ${k}`)
    pending.set(k, v)
  }
  if (pending.size === 0) return text

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)(\s*=)(.*)$/.exec(lines[i])
    if (!m) continue
    const key = m[2]
    if (!pending.has(key)) continue
    lines[i] = `${m[1]}${key}${m[3]}${quote(pending.get(key)!)}`
    pending.delete(key)
  }

  if (pending.size > 0) {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('')
    lines.push('# ── Added by the MSK hosting dashboard ───────────────────────────────────────')
    for (const [k, v] of pending) lines.push(`${k}=${quote(v)}`)
    lines.push('')
  }

  return lines.join('\n')
}

export async function readBotEnv(guildId: string): Promise<string> {
  return readFile(botEnvPath(guildId), 'utf8')
}

/** Write the .env back and re-assert 0600. The file holds the bot token and the
 *  Discord client secret; the mode is re-applied on every write so a restore
 *  from a backup or a stray `cp` cannot silently leave it world-readable. */
export async function writeBotEnv(guildId: string, text: string): Promise<void> {
  const path = botEnvPath(guildId)
  await writeFile(path, text.endsWith('\n') ? text : `${text}\n`, { mode: 0o600 })
  await chmod(path, 0o600)
}

/** Read, patch, write. Returns the keys that actually changed value. */
export async function patchBotEnv(
  guildId: string,
  updates: Record<string, string | undefined>,
): Promise<string[]> {
  const before  = await readBotEnv(guildId)
  const parsed  = parseEnv(before)
  const changed = Object.entries(updates)
    .filter(([k, v]) => v !== undefined && parsed[k] !== v)
    .map(([k]) => k)

  if (changed.length === 0) return []

  await writeBotEnv(guildId, setEnvValues(before, updates))
  return changed
}

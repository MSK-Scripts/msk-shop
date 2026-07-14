// ─────────────────────────────────────────────────────────────────────────────
// envEdit — line-based read/patch of a .env file
// ─────────────────────────────────────────────────────────────────────────────
// Like jsoncEdit, this never regenerates the file. Reading gives the current
// values; setEnvValue() patches only the single KEY=… line (or appends it if
// missing). Comments, blank lines and any unknown keys are preserved 1:1.

export interface EnvEntry {
  value: string;
  /** 0-based index into the file's line array. */
  line: number;
}

const KEY_LINE_RE = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;

/** Strip a single layer of matching surrounding quotes from a raw .env value. */
function unquote(raw: string): string {
  const t = raw.trim();
  // Double-quoted values are escaped on write (see setEnvValue) — reverse both
  // the backslash and quote escaping so the value round-trips exactly.
  if (t.length >= 2 && t[0] === '"' && t.at(-1) === '"') {
    return t.slice(1, -1).replace(/\\(["\\])/g, '$1');
  }
  // Single-quoted .env values are literal (no escaping).
  if (t.length >= 2 && t[0] === "'" && t.at(-1) === "'") {
    return t.slice(1, -1);
  }
  return t;
}

/** Parse a .env document into a map of KEY → { value, line }. Comments/blanks ignored. */
export function parseEnv(content: string): Map<string, EnvEntry> {
  const map = new Map<string, EnvEntry>();
  content.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const m = KEY_LINE_RE.exec(line);
    if (!m) return;
    map.set(m[2], { value: unquote(m[3]), line: i });
  });
  return map;
}

/**
 * Set `key` to `value`, patching only the matching line. If the key does not
 * exist yet it is appended. All other lines (comments, blanks, unknown keys)
 * are kept verbatim. Values are always written double-quoted.
 */
export function setEnvValue(content: string, key: string, value: string): string {
  const lines = content.split('\n');
  // Escape backslashes FIRST, then double-quotes, so a value can never break out
  // of the surrounding quotes (e.g. a trailing "\" would otherwise escape the
  // closing quote). Reversed on read in unquote().
  const quoted = `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

  for (let i = 0; i < lines.length; i++) {
    const m = KEY_LINE_RE.exec(lines[i]);
    if (m && m[2] === key) {
      lines[i] = `${m[1]}${quoted}`;
      return lines.join('\n');
    }
  }

  // Key not present — append it, keeping a trailing newline tidy.
  if (lines.length > 0 && lines.at(-1) === '') {
    lines[lines.length - 1] = quoted;
    lines.push('');
  } else {
    lines.push(quoted);
  }
  return lines.join('\n');
}

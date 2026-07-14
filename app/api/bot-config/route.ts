import { NextRequest, NextResponse } from 'next/server';
import { authorizeGuild }         from '@/lib/dashboardAuth';
import { readFile, writeFile, copyFile, access } from 'fs/promises';
import { join, resolve }          from 'path';
import { parse as parseJsonc, type ParseError } from 'jsonc-parser';
import { validateBotConfig } from '@/lib/botconfig/validateConfig';

// Explicit mapping: URL parameter → actual filename on disk.
// The filename NEVER comes from user input — only the key is user-supplied,
// and it is validated against this fixed map before any filesystem access.
// 'locale' is handled separately because the filename is resolved at runtime
// from the bot's config.jsonc (with fallback to en.json).
const STATIC_FILE_MAP: Record<string, string> = {
  config:  'config/config.jsonc',
  snippet: 'config/snippets.jsonc',
  env:     '.env',
};

const VALID_KEYS = new Set([...Object.keys(STATIC_FILE_MAP), 'locale']);

// Whitelist for the "lang" value extracted from config.jsonc.
// Accepts ISO-639-1 codes (en, de) and optional ISO-3166 region suffix (pt-br).
const LANG_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

// Whitelist for resolved locale filenames before any filesystem access.
const LOCALE_FILENAME_RE = /^[a-z]{2}(-[a-z]{2})?\.json$/i;

// ── Path builders ──────────────────────────────────────────────────────────────

function getBase(): string {
  const base = process.env.BOT_CONFIG_BASE_PATH;
  if (!base) throw new Error('BOT_CONFIG_BASE_PATH not configured');
  return base;
}

function assertWithinBase(resolved: string, base: string): void {
  const resolvedBase = resolve(base);
  if (!resolved.startsWith(resolvedBase + '/') && !resolved.startsWith(resolvedBase + '\\')) {
    throw new Error('Path traversal detected');
  }
}

function buildStaticFilePath(guildId: string, fileKey: keyof typeof STATIC_FILE_MAP | string): string {
  const base = getBase();
  const filename = STATIC_FILE_MAP[fileKey]; // already validated — cannot be undefined here
  const resolved = resolve(join(base, guildId, filename));
  assertWithinBase(resolved, base);
  return resolved;
}

function buildLocalePath(guildId: string, filename: string): string {
  if (!LOCALE_FILENAME_RE.test(filename)) {
    throw new Error('Invalid locale filename');
  }
  const base = getBase();
  const resolved = resolve(join(base, guildId, 'locales', filename));
  assertWithinBase(resolved, base);
  return resolved;
}

// ── Locale resolution ──────────────────────────────────────────────────────────

type LocaleReason = 'missing' | 'no_lang' | 'invalid_lang' | 'config_parse_error' | 'config_missing';

interface LocaleResolution {
  /** Filename to display in the tab and to write to on save (e.g. 'de.json'). */
  filename:       string;
  /** Filename to read content from for the editor (e.g. 'en.json' on fallback). */
  sourceFilename: string;
  /** True when the source differs from the target (= template-based editing). */
  fallback:       boolean;
  /** Reason for the fallback (undefined when fallback is false). */
  reason?:        LocaleReason;
  /** What the user originally requested via "lang" (only set for reason='missing'). */
  requested?:     string;
}

/**
 * Resolves which locale file to edit, based on the bot's config.jsonc.
 * Falls back to en.json on any error (missing config, bad syntax, missing lang).
 */
async function resolveLocaleFile(guildId: string): Promise<LocaleResolution> {
  const base       = getBase();
  const configPath = resolve(join(base, guildId, 'config/config.jsonc'));
  const localesDir = resolve(join(base, guildId, 'locales'));
  assertWithinBase(configPath, base);
  assertWithinBase(localesDir, base);

  const fallback = (reason: LocaleReason): LocaleResolution => ({
    filename:       'en.json',
    sourceFilename: 'en.json',
    fallback:       true,
    reason,
  });

  // 1. Read config.jsonc
  let configContent: string;
  try {
    configContent = await readFile(configPath, 'utf-8');
  } catch {
    return fallback('config_missing');
  }

  // 2. Parse + validate "lang"
  const errors: ParseError[] = [];
  const parsed = parseJsonc(configContent, errors, { allowTrailingComma: true });
  if (errors.length > 0 || typeof parsed !== 'object' || parsed === null) {
    return fallback('config_parse_error');
  }
  const langValue = (parsed as Record<string, unknown>).lang;
  if (typeof langValue !== 'string' || langValue.length === 0) {
    return fallback('no_lang');
  }
  if (!LANG_RE.test(langValue)) {
    return fallback('invalid_lang');
  }

  // 3. Normalize and check existence
  const lang          = langValue.toLowerCase();
  const requestedFile = `${lang}.json`;

  if (!LOCALE_FILENAME_RE.test(requestedFile)) {
    // Defense in depth — should never happen after LANG_RE passes
    return fallback('invalid_lang');
  }

  const requestedPath = join(localesDir, requestedFile);
  try {
    await access(requestedPath);
    return { filename: requestedFile, sourceFilename: requestedFile, fallback: false };
  } catch {
    // Target file doesn't exist — edit en.json as template, save target stays requested file.
    return {
      filename:       requestedFile,
      sourceFilename: 'en.json',
      fallback:       true,
      reason:         'missing',
      requested:      requestedFile,
    };
  }
}

// ── Auth helper ────────────────────────────────────────────────────────────────

/**
 * Authorize a hosted-bot request: the session's Discord user must own the guild
 * (from ?guildId=) AND the guild must be an active hosted bot. Returns the guild
 * id on success or a ready-made error response.
 */
async function authHosted(req: NextRequest): Promise<{ guildId: string } | { error: NextResponse }> {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'));
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  if (!auth.guild.is_hosted || !auth.guild.active) {
    return { error: NextResponse.json({ error: 'Not available for this account' }, { status: 403 }) };
  }
  return { guildId: auth.guild.guild_id };
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // Authorize first — never branch on user-controlled input before the security check.
    const a = await authHosted(req);
    if ('error' in a) return a.error;
    const guildId = a.guildId;

    const fileKey = req.nextUrl.searchParams.get('file');
    if (!fileKey || !VALID_KEYS.has(fileKey)) {
      return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
    }

    if (fileKey === 'locale') {
      const resolution = await resolveLocaleFile(guildId);
      const sourcePath = buildLocalePath(guildId, resolution.sourceFilename);
      let content: string;
      try {
        content = await readFile(sourcePath, 'utf-8');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('ENOENT')) {
          return NextResponse.json(
            { error: 'Keine Locale-Datei gefunden (auch kein en.json-Fallback vorhanden).' },
            { status: 404 },
          );
        }
        throw err;
      }
      return NextResponse.json({
        content,
        filename: resolution.filename,
        fallback: resolution.fallback,
        ...(resolution.reason    ? { reason:    resolution.reason    } : {}),
        ...(resolution.requested ? { requested: resolution.requested } : {}),
      });
    }

    const filePath = buildStaticFilePath(guildId, fileKey);
    const content  = await readFile(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ENOENT')) {
      return NextResponse.json({ error: 'Datei nicht auf dem Server gefunden' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT ────────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    // Authorize first — never branch on user-controlled input before the security check.
    const a = await authHosted(req);
    if ('error' in a) return a.error;
    const guildId = a.guildId;

    const fileKey = req.nextUrl.searchParams.get('file');
    if (!fileKey || !VALID_KEYS.has(fileKey)) {
      return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
    }

    const body = await req.json() as unknown;
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).content !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const content = (body as { content: string }).content;
    if (content.length > 1_000_000) {
      return NextResponse.json({ error: 'Datei überschreitet 1 MB Limit' }, { status: 413 });
    }

    // ── Content validation per file type ─────────────────────────────────────
    if (fileKey === 'config' || fileKey === 'snippet') {
      const errors: ParseError[] = [];
      const parsed = parseJsonc(content, errors, { allowTrailingComma: true });
      if (errors.length > 0) {
        return NextResponse.json({ error: 'Syntaxfehler in der JSONC-Datei' }, { status: 400 });
      }
      // Semantic backstop (mirrors the bot's validateConfig): even a raw
      // file-mode save must never ship a config that crashes the bot on restart.
      if (fileKey === 'config') {
        const blocking = validateBotConfig(parsed).filter(i => i.severity === 'error');
        if (blocking.length > 0) {
          return NextResponse.json(
            { error: 'Invalid configuration', detail: blocking.map(i => i.message.en).join('\n') },
            { status: 400 },
          );
        }
      }
    } else if (fileKey === 'env') {
      const invalid = content.split('\n').some(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return false;
        return !/^[A-Za-z_][A-Za-z0-9_]*=/.test(trimmed);
      });
      if (invalid) {
        return NextResponse.json({ error: 'Ungültiges .env Format (erwartet KEY=VALUE)' }, { status: 400 });
      }
    } else if (fileKey === 'locale') {
      // Strict JSON — no comments, no trailing commas
      try {
        JSON.parse(content);
      } catch {
        return NextResponse.json(
          { error: 'Ungültige JSON-Syntax (Locale-Dateien erlauben keine Kommentare)' },
          { status: 400 },
        );
      }
    }

    // ── Resolve target path ──────────────────────────────────────────────────
    let filePath: string;
    if (fileKey === 'locale') {
      const resolution = await resolveLocaleFile(guildId);
      filePath         = buildLocalePath(guildId, resolution.filename);
    } else {
      filePath = buildStaticFilePath(guildId, fileKey);
    }

    // Backup before overwriting (silent if the file does not exist yet)
    try { await copyFile(filePath, `${filePath}.bak`); } catch { /* intentionally empty */ }

    await writeFile(filePath, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

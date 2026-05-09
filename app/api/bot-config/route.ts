import { cookies }                from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { parseDashboardSession }  from '@/lib/dashboardSession';
import { queryOne }               from '@/lib/db';
import { readFile, writeFile, copyFile } from 'fs/promises';
import { join, resolve }          from 'path';

// Explicit mapping: URL parameter → actual filename on disk.
// The filename NEVER comes from user input — only the key is user-supplied,
// and it is validated against this fixed map before any filesystem access.
const FILE_MAP: Record<string, string> = {
  config:  'config.jsonc',
  snippet: 'snippet.jsonc',
  env:     '.env',
};

// Discord snowflakes are 17–20 digit numbers.
// Consistent with bot-control and bot-logs routes — defense in depth.
const GUILD_ID_RE = /^\d{17,20}$/;

interface GuildRow { is_hosted: number }

function buildFilePath(guildId: string, fileKey: string): string {
  const base = process.env.BOT_CONFIG_BASE_PATH;
  if (!base) throw new Error('BOT_CONFIG_BASE_PATH not configured');

  const filename = FILE_MAP[fileKey]; // already validated — cannot be undefined here
  const fullPath    = join(base, guildId, filename);
  const resolved    = resolve(fullPath);
  const resolvedBase = resolve(base);

  // Belt-and-suspenders: ensure the resolved path stays inside the base dir
  if (!resolved.startsWith(resolvedBase + '/') && !resolved.startsWith(resolvedBase + '\\')) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;
  return session?.guildId ?? null;
}

async function assertHosted(guildId: string): Promise<boolean> {
  const guild = await queryOne<GuildRow>(
    'SELECT is_hosted FROM ticketbot_guilds WHERE guild_id = ? AND active = 1',
    [guildId],
  );
  return !!guild?.is_hosted;
}

export async function GET(req: NextRequest) {
  try {
    const guildId = await getSession();
    if (!guildId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!GUILD_ID_RE.test(guildId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

    const fileKey = req.nextUrl.searchParams.get('file');
    if (!fileKey || !(fileKey in FILE_MAP)) {
      return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
    }

    if (!await assertHosted(guildId)) {
      return NextResponse.json({ error: 'Not available for this account' }, { status: 403 });
    }

    const filePath = buildFilePath(guildId, fileKey);
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

export async function PUT(req: NextRequest) {
  try {
    const guildId = await getSession();
    if (!guildId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!GUILD_ID_RE.test(guildId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

    const fileKey = req.nextUrl.searchParams.get('file');
    if (!fileKey || !(fileKey in FILE_MAP)) {
      return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
    }

    if (!await assertHosted(guildId)) {
      return NextResponse.json({ error: 'Not available for this account' }, { status: 403 });
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

    const filePath = buildFilePath(guildId, fileKey);

    // Backup before overwriting (silent if the file does not exist yet)
    try { await copyFile(filePath, `${filePath}.bak`); } catch { /* intentionally empty */ }

    await writeFile(filePath, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

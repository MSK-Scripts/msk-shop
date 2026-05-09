import { cookies }                from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { exec }                   from 'child_process';
import { promisify }              from 'util';
import { join, resolve }          from 'path';
import { parseDashboardSession }  from '@/lib/dashboardSession';
import { queryOne }               from '@/lib/db';

const execAsync = promisify(exec);

const ALLOWED_ACTIONS = new Set(['start', 'stop', 'restart', 'update']);

// Discord snowflakes are 17–20 digit numbers — validate strictly to prevent any
// shell injection even though guildId comes from an HMAC-signed session cookie.
const GUILD_ID_RE = /^\d{17,20}$/;

interface GuildRow { is_hosted: number }

interface Pm2Process {
  name:    string;
  pm2_env: { status: string };
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

// Resolves and validates the bot directory path — same logic as bot-config route.
function botDir(guildId: string): string {
  const base = process.env.BOT_CONFIG_BASE_PATH;
  if (!base) throw new Error('BOT_CONFIG_BASE_PATH not configured');

  const full         = join(base, guildId);
  const resolved     = resolve(full);
  const resolvedBase = resolve(base);

  if (!resolved.startsWith(resolvedBase + '/') && !resolved.startsWith(resolvedBase + '\\')) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

// GET /api/bot-control — current PM2 status for the guild's bot
export async function GET() {
  try {
    const guildId = await getSession();
    if (!guildId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!GUILD_ID_RE.test(guildId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

    if (!await assertHosted(guildId)) {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }

    const appName    = `ticketbot-${guildId}`;
    const { stdout } = await execAsync('pm2 jlist');
    const list       = JSON.parse(stdout) as Pm2Process[];
    const bot        = list.find(p => p.name === appName);

    if (!bot) return NextResponse.json({ status: 'not_found' });
    return NextResponse.json({ status: bot.pm2_env.status });
  } catch {
    return NextResponse.json({ error: 'PM2 nicht erreichbar' }, { status: 500 });
  }
}

// POST /api/bot-control — { action: 'start' | 'stop' | 'restart' | 'update' }
export async function POST(req: NextRequest) {
  try {
    const guildId = await getSession();
    if (!guildId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!GUILD_ID_RE.test(guildId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

    if (!await assertHosted(guildId)) {
      return NextResponse.json({ error: 'Not available' }, { status: 403 });
    }

    const body   = await req.json() as unknown;
    const action = typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).action
      : undefined;

    if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }

    const appName = `ticketbot-${guildId}`;

    if (action === 'update') {
      const dir = botDir(guildId);

      // Both commands are fully static — cwd is the only variable and is validated above.
      const { stdout: pullOut, stderr: pullErr } =
        await execAsync('git pull', { cwd: dir, timeout: 30_000 });

      const { stdout: npmOut, stderr: npmErr } =
        await execAsync('npm install --omit=dev', { cwd: dir, timeout: 120_000 });

      const output = [pullOut, pullErr, npmOut, npmErr]
        .map(s => s.trim())
        .filter(Boolean)
        .join('\n');

      return NextResponse.json({ ok: true, output });
    }

    // start | stop | restart — appName and action are both fully validated
    await execAsync(`pm2 ${action} ${appName}`, { timeout: 10_000 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not found') || msg.includes('not exist')) {
      return NextResponse.json({ error: 'Bot-Prozess nicht in PM2 registriert' }, { status: 404 });
    }
    // Surface the actual PM2 / git / npm error message to the dashboard
    const detail = msg.split('\n').slice(0, 5).join('\n').trim();
    return NextResponse.json({ error: 'Aktion fehlgeschlagen', detail }, { status: 500 });
  }
}

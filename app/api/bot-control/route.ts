import { NextRequest, NextResponse } from 'next/server';
import { exec }                   from 'child_process';
import { promisify }              from 'util';
import { join, resolve }          from 'path';
import { authorizeGuild }         from '@/lib/dashboardAuth';

const execAsync = promisify(exec);

const ALLOWED_ACTIONS = new Set(['start', 'stop', 'restart', 'update']);

interface Pm2Process {
  name:    string;
  pm2_env: { status: string };
}

/**
 * Authorize a hosted-bot request: the session's Discord user must own the guild
 * (from ?guildId=) AND the guild must be an active hosted bot.
 */
async function authHosted(req: NextRequest): Promise<{ guildId: string } | { error: NextResponse }> {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'));
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  if (!auth.guild.is_hosted || !auth.guild.active) {
    return { error: NextResponse.json({ error: 'Not available' }, { status: 403 }) };
  }
  return { guildId: auth.guild.guild_id };
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
export async function GET(req: NextRequest) {
  try {
    const a = await authHosted(req);
    if ('error' in a) return a.error;
    const guildId = a.guildId;

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
    const a = await authHosted(req);
    if ('error' in a) return a.error;
    const guildId = a.guildId;

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

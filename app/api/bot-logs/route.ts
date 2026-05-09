import { cookies }               from 'next/headers';
import { NextResponse }          from 'next/server';
import { exec }                  from 'child_process';
import { promisify }             from 'util';
import { stat, open }            from 'fs/promises';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { queryOne }              from '@/lib/db';

const execAsync = promisify(exec);

const GUILD_ID_RE = /^\d{17,20}$/;

// Read at most 50 KB from the end of the log file.
// Prevents loading a potentially multi-GB log file into memory.
const MAX_READ_BYTES = 50_000;

interface GuildRow { is_hosted: number }

interface Pm2Process {
  name:    string;
  pm2_env: {
    status:           string;
    pm_err_log_path?: string;
  };
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

// Reads the last MAX_READ_BYTES of a file without loading the whole file.
// Uses fs.open + handle.read so no shell command is involved.
async function readTail(filePath: string): Promise<string[]> {
  const { size } = await stat(filePath);
  if (size === 0) return [];

  const readLen   = Math.min(size, MAX_READ_BYTES);
  const readStart = size - readLen;

  const fh = await open(filePath, 'r');
  try {
    const buf = Buffer.alloc(readLen);
    await fh.read(buf, 0, readLen, readStart);
    const raw = buf.toString('utf-8');

    // If we started mid-file, drop the first (likely partial) line
    const trimmed = readStart > 0 ? raw.slice(raw.indexOf('\n') + 1) : raw;
    return trimmed.split('\n').filter(l => l.trim() !== '').slice(-100);
  } finally {
    await fh.close();
  }
}

// GET /api/bot-logs — returns last 100 lines of the PM2 error log for the guild's bot.
// The log file path is sourced from PM2's own process list (not from user input).
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

    if (!bot) return NextResponse.json({ lines: [] });

    const errorLogPath = bot.pm2_env.pm_err_log_path;
    if (!errorLogPath) return NextResponse.json({ lines: [] });

    const lines = await readTail(errorLogPath);
    return NextResponse.json({ lines });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ENOENT')) return NextResponse.json({ lines: [] });
    return NextResponse.json({ error: 'Fehler beim Lesen der Logs' }, { status: 500 });
  }
}

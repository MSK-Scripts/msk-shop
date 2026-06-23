import { NextRequest, NextResponse } from 'next/server';
import { exec }                  from 'child_process';
import { promisify }             from 'util';
import { open }                   from 'fs/promises';
import { authorizeGuild }        from '@/lib/dashboardAuth';

const execAsync = promisify(exec);

// Read at most 50 KB from the end of the log file.
// Prevents loading a potentially multi-GB log file into memory.
const MAX_READ_BYTES = 50_000;

interface Pm2Process {
  name:    string;
  pm2_env: {
    status:           string;
    pm_err_log_path?: string;
  };
}

/** Authorize a hosted-bot request (owner + active hosted bot). */
async function authHosted(req: NextRequest): Promise<{ guildId: string } | { error: NextResponse }> {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'));
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  if (!auth.guild.is_hosted || !auth.guild.active) {
    return { error: NextResponse.json({ error: 'Not available' }, { status: 403 }) };
  }
  return { guildId: auth.guild.guild_id };
}

// Reads the last MAX_READ_BYTES of a file without loading the whole file.
// Uses fs.open + handle.stat + handle.read on the same file descriptor to
// eliminate the TOCTOU race condition (CWE-367) between stat() and open().
async function readTail(filePath: string): Promise<string[]> {
  const fh = await open(filePath, 'r');
  try {
    const { size } = await fh.stat();
    if (size === 0) return [];

    const readLen   = Math.min(size, MAX_READ_BYTES);
    const readStart = size - readLen;

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
export async function GET(req: NextRequest) {
  try {
    const a = await authHosted(req);
    if ('error' in a) return a.error;
    const guildId = a.guildId;

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

import { cookies }               from 'next/headers';
import { NextResponse }          from 'next/server';
import { exec }                  from 'child_process';
import { promisify }             from 'util';
import { spawn, type ChildProcess } from 'child_process';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { queryOne }              from '@/lib/db';

const execAsync   = promisify(exec);
const GUILD_ID_RE = /^\d{17,20}$/;

interface GuildRow { is_hosted: number }

interface Pm2Process {
  name:    string;
  pm2_env: {
    pm_out_log_path?: string;
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

// GET /api/bot-logs-stream
// Server-Sent Events endpoint — streams the bot's PM2 log files in real time.
// Log file paths come exclusively from PM2's own process list, never from user input.
export async function GET() {
  // All auth + data fetching must happen before the ReadableStream is created.
  const guildId = await getSession();
  if (!guildId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!GUILD_ID_RE.test(guildId)) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  if (!await assertHosted(guildId)) return NextResponse.json({ error: 'Not available' }, { status: 403 });

  const appName = `ticketbot-${guildId}`;

  let stdout: string;
  try {
    ({ stdout } = await execAsync('pm2 jlist'));
  } catch {
    return NextResponse.json({ error: 'PM2 not available' }, { status: 503 });
  }

  const list = JSON.parse(stdout) as Pm2Process[];
  const bot  = list.find(p => p.name === appName);
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

  // Collect only existing, non-empty log file paths from PM2's own metadata.
  const logFiles = [
    bot.pm2_env.pm_out_log_path,
    bot.pm2_env.pm_err_log_path,
  ].filter((p): p is string => typeof p === 'string' && p.length > 0);

  if (logFiles.length === 0) {
    return NextResponse.json({ error: 'No log files found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let tail: ChildProcess | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // -n 50: show last 50 lines on connect; -F: follow and retry on rotation.
      tail = spawn('tail', ['-n', '50', '-F', ...logFiles]);

      tail.stdout?.on('data', (chunk: Buffer) => {
        const lines = chunk.toString('utf-8').split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(line)}\n\n`));
            } catch { /* stream already closed by client disconnect */ }
          }
        }
      });

      // Ignore tail's own stderr (e.g. "file truncated" messages on log rotation).
      tail.stderr?.on('data', () => { /* intentionally empty */ });

      tail.on('close', () => {
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      // Called when the client disconnects — kill the tail process immediately.
      tail?.kill('SIGTERM');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no', // disables proxy buffering (Apache mod_proxy / nginx)
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { exec }                  from 'child_process';
import { promisify }             from 'util';
import { spawn, type ChildProcess } from 'child_process';
import { authorizeGuild }        from '@/lib/dashboardAuth';

const execAsync   = promisify(exec);

// Strips all ANSI escape sequences (colors, cursor movement, etc.) from a string.
const ANSI_RE = /\x1b\[[0-9;]*[mGKHFJA-Za-z]/g;
function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}

interface Pm2Process {
  name:    string;
  pm2_env: {
    pm_out_log_path?: string;
    pm_err_log_path?: string;
  };
}

// GET /api/bot-logs-stream
// Server-Sent Events endpoint — streams the bot's PM2 log files in real time.
// Log file paths come exclusively from PM2's own process list, never from user input.
export async function GET(req: NextRequest) {
  // All auth + data fetching must happen before the ReadableStream is created.
  // The session's Discord user must own the guild (?guildId=) and it must be an
  // active hosted bot.
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.guild.is_hosted || !auth.guild.active) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }
  const guildId = auth.guild.guild_id;

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
  let tail:      ChildProcess | null = null;
  let keepalive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try { controller.enqueue(encoder.encode(data)); }
        catch { /* stream already closed by client disconnect */ }
      };

      // -n 50: show last 50 lines on connect; -F: follow and retry on rotation.
      tail = spawn('tail', ['-n', '50', '-F', ...logFiles]);

      tail.stdout?.on('data', (chunk: Buffer) => {
        const lines = chunk.toString('utf-8').split('\n');
        for (const line of lines) {
          const clean = stripAnsi(line);
          if (clean.trim()) send(`data: ${JSON.stringify(clean)}\n\n`);
        }
      });

      // Ignore tail's own stderr (e.g. "file truncated" messages on log rotation).
      tail.stderr?.on('data', () => { /* intentionally empty */ });

      // Handle spawn failures (e.g. tail not on PATH) — an unhandled 'error'
      // event on a ChildProcess would otherwise crash the Node process.
      tail.on('error', () => {
        clearInterval(keepalive ?? undefined);
        try { controller.close(); } catch { /* already closed */ }
      });

      tail.on('close', () => {
        clearInterval(keepalive ?? undefined);
        try { controller.close(); } catch { /* already closed */ }
      });

      // Send an SSE comment every 20 s to prevent Apache/proxy from closing
      // an idle connection due to its keep-alive or proxy timeout settings.
      keepalive = setInterval(() => send(': ping\n\n'), 20_000);
    },
    cancel() {
      // Called when the client disconnects — clean up immediately.
      clearInterval(keepalive ?? undefined);
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

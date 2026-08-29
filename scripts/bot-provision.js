#!/usr/bin/env node
/**
 * bot-provision.js — install and start one customer's hosted ticket bot.
 *
 *   node scripts/bot-provision.js <guild_id> [--restart-only]
 *
 * `--restart-only` skips cloning and installing and just restarts an existing
 * installation, then re-runs the health check. That is the retry path after the
 * customer corrects a value in the .env form: the code is already on disk, only
 * the configuration was wrong, and re-running npm install would turn a 5-second
 * correction into a 3-minute one.
 *
 * Spawned DETACHED by POST /api/bot-hosting/provision, and that is the point:
 * `git clone` plus `npm install` take minutes, so doing it inside the HTTP
 * request would mean a deploy (`systemctl restart msk-shop`) silently aborting a
 * half-finished installation with nothing written down. Here the process
 * outlives its parent and records every step in ticketbot_hosting_jobs, which
 * the dashboard polls.
 *
 * The fast, reversible half — validating the form, allocating the port, creating
 * DNS + vhost, composing the .env — already happened in the request. By the time
 * this runs, the guild row carries bot_port and dashboard_host, and the .env is
 * staged at <base>/.staging/<guild_id>.env with mode 0600.
 *
 * Inherits its environment from the app process, so DB_*, BOT_CONFIG_BASE_PATH
 * and BOT_DASHBOARD_PROXY_SECRET are already set. To run it BY HAND, source the
 * env and point NODE_PATH at the app's modules, same as the crons:
 *
 *   set -a; . /opt/msk-shop/.env.local; set +a; \
 *     NODE_PATH=/opt/msk-shop/node_modules node scripts/bot-provision.js <id>
 *
 * Must run as the app user (musiker15): it owns the bot directories and the PM2
 * daemon the bot is registered with.
 */

const { execFile }   = require('child_process');
const { promisify }  = require('util');
const { rename, chmod, access, mkdir, readFile } = require('fs/promises');
const path           = require('path');
const mysql          = require('mysql2/promise');

const execFileAsync = promisify(execFile);

const BOT_REPO = 'https://github.com/MSK-Scripts/discord_ticketbot.git';
const PM2      = '/usr/bin/pm2';

// How long to wait for the bot to report itself running before calling it a
// failure. A first start pays for the Discord gateway handshake and, with an
// external database, its migrations; 90 s is comfortably above what that takes
// and still short enough that a customer with a bad token is not left staring at
// a spinner.
const HEALTH_TIMEOUT_MS  = 90_000;
const HEALTH_INTERVAL_MS = 3_000;

const GUILD_ID_RE = /^\d{17,20}$/;

// ── Small helpers ────────────────────────────────────────────────────────────

const guildId     = process.argv[2];
const restartOnly = process.argv.includes('--restart-only');

function fail(msg) {
  console.error(`[bot-provision] ${msg}`);
  process.exit(1);
}

if (!GUILD_ID_RE.test(String(guildId || ''))) fail(`invalid guild id: ${guildId}`);

const BASE = process.env.BOT_CONFIG_BASE_PATH;
if (!BASE) fail('BOT_CONFIG_BASE_PATH is not set');

const botDir     = path.join(BASE, guildId);
const stagedEnv  = path.join(BASE, '.staging', `${guildId}.env`);
const appName    = `ticketbot-${guildId}`;

const exists = p => access(p).then(() => true, () => false);
const sleep  = ms => new Promise(r => setTimeout(r, ms));

/** Strip ANSI colour codes and keep the last n non-empty lines. Mirrors
 *  tailLines() in lib/botProvision.ts — this script is plain JS run outside
 *  Next and cannot import the TS module. */
function tailLines(text, n) {
  const plain = String(text || '').replace(/\x1b\[[0-9;]*m/g, '');
  const lines = plain.split(/\r?\n/).filter(l => l.trim() !== '');
  return lines.slice(-n).join('\n').slice(-8000);
}

// ── Database ─────────────────────────────────────────────────────────────────

let db;

async function connect() {
  db = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+00:00',
  });
}

const setStep = step => db.execute(
  'UPDATE ticketbot_hosting_jobs SET step = ? WHERE guild_id = ?', [step, guildId]);

const markFailed = (error, log) => db.execute(
  `UPDATE ticketbot_hosting_jobs SET status = 'failed', error = ?, log = ? WHERE guild_id = ?`,
  [String(error).slice(0, 500), log ? tailLines(log, 40) : null, guildId]);

// ── Health check ─────────────────────────────────────────────────────────────

/**
 * Ask the bot's own supervisor whether the BOT is running — not merely whether
 * something is listening.
 *
 * This distinction is the whole reason the check exists. dashboard.js is a
 * supervisor that runs the bot as a child and deliberately survives its crash,
 * so PM2 happily reports `online` for an installation whose token Discord
 * rejected. /api/bot/status reports the child's real state, and the
 * trusted-proxy headers get us past its permission check.
 */
async function botReportsRunning(port, discordUserId) {
  const secret = process.env.BOT_DASHBOARD_PROXY_SECRET;
  if (!secret || !discordUserId) return null;   // cannot tell — caller falls back

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/bot/status`, {
      headers: {
        'x-dashboard-proxy-secret': secret,
        'x-dashboard-user':         String(discordUserId),
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body && body.status === 'running';
  } catch {
    return false;   // nothing listening yet
  }
}

/** The PM2 error/output log of this bot, for showing the customer what broke. */
async function readBotLog() {
  const home = process.env.HOME || '/home/musiker15';
  const parts = [];
  for (const which of ['error', 'out']) {
    const file = path.join(home, '.pm2', 'logs', `${appName}-${which}.log`);
    try {
      const text = await readFile(file, 'utf8');
      const tail = tailLines(text, 25);
      if (tail) parts.push(`==> ${which} <==\n${tail}`);
    } catch { /* no log yet */ }
  }
  return parts.join('\n\n');
}

// ── Steps ────────────────────────────────────────────────────────────────────

async function clone() {
  if (await exists(path.join(botDir, 'package.json'))) return;   // retry of a partial run

  await mkdir(BASE, { recursive: true });
  // A FULL clone, deliberately. A shallow one would save a few megabytes and
  // then make the dashboard's own "update" button (git pull, and the bulk
  // `git pull --ff-only` in the runbook) behave differently here than on every
  // hand-installed bot. Not worth the divergence.
  await execFileAsync('git', ['clone', BOT_REPO, botDir], { timeout: 300_000 });
  // Without this every later `git pull` from the dashboard warns about the
  // divergent-branch policy and, on newer git, refuses outright.
  await execFileAsync('git', ['-C', botDir, 'config', 'pull.rebase', 'false']);
}

async function configure() {
  if (!(await exists(stagedEnv))) throw new Error('The prepared configuration is missing.');
  const target = path.join(botDir, '.env');
  await rename(stagedEnv, target);
  await chmod(target, 0o600);
}

async function install() {
  await execFileAsync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'],
                      { cwd: botDir, timeout: 600_000, maxBuffer: 10 * 1024 * 1024 });
}

async function start() {
  // A previous failed attempt may have left a registration behind; a second
  // `pm2 start` under the same name would then error instead of replacing it.
  await execFileAsync(PM2, ['delete', appName], { timeout: 20_000 }).catch(() => {});

  // dashboard.js, NOT index.js. index.js is the plain bot with no web server —
  // it starts fine, PM2 reports online, and the customer's dashboard host then
  // answers 503 forever with nothing in any log to explain it.
  await execFileAsync(PM2, ['start', 'dashboard.js', '--name', appName],
                      { cwd: botDir, timeout: 60_000 });
  await execFileAsync(PM2, ['save'], { timeout: 20_000 }).catch(() => {});
}

async function health(port, discordUserId) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let lastAnswer = null;

  while (Date.now() < deadline) {
    await sleep(HEALTH_INTERVAL_MS);
    lastAnswer = await botReportsRunning(port, discordUserId);
    if (lastAnswer === true) return;
  }

  const log = await readBotLog();
  // `null` means the status endpoint could not be reached or refused us, which
  // is a different failure from "the bot says it is not running" — saying so
  // stops the customer from hunting for a token problem that is not there.
  throw Object.assign(
    new Error(lastAnswer === null ? 'health_unreachable' : 'health_not_running'),
    { log },
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await connect();

  const [rows] = await db.execute(
    'SELECT bot_port, discord_user_id FROM ticketbot_guilds WHERE guild_id = ?', [guildId]);
  const guild = rows[0];
  if (!guild)          throw new Error('Guild not found.');
  if (!guild.bot_port) throw new Error('No dashboard port was allocated.');

  if (!restartOnly) {
    await setStep('clone');     await clone();
    await setStep('configure'); await configure();
    await setStep('install');   await install();
  }
  await setStep('start');     await start();
  await setStep('health');    await health(Number(guild.bot_port), guild.discord_user_id);

  // Only now is the guild really hosted. Setting the flag any earlier would show
  // the customer a management panel for a bot that never came up.
  await db.execute('UPDATE ticketbot_guilds SET is_hosted = 1 WHERE guild_id = ?', [guildId]);
  await db.execute(
    `UPDATE ticketbot_hosting_jobs SET status = 'done', step = 'done', error = NULL, log = NULL
      WHERE guild_id = ?`, [guildId]);

  console.info(`[bot-provision] ${guildId}: ready`);
}

main()
  .then(async () => { await db?.end(); process.exit(0); })
  .catch(async err => {
    console.error('[bot-provision] failed:', err);
    try {
      // Prefer the bot's own output over the exception: "npm exited 1" helps
      // nobody, the line where Discord rejected the token does.
      const log = err.log || err.stderr || err.stdout || (await readBotLog());
      await markFailed(err.message || 'unknown error', log);
    } catch (e) {
      console.error('[bot-provision] could not record the failure:', e);
    }
    await db?.end().catch(() => {});
    process.exit(1);
  });

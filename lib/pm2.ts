import { exec }       from 'child_process';
import { promisify }  from 'util';

const execAsync = promisify(exec);

// Short-lived cache for `pm2 jlist`. Every bot-status / bot-logs poll and every
// SSE connect used to fork a full `pm2 jlist` (shell + a complete pm2 node
// instance). A hosted tenant hammering those endpoints could pin CPU and flood
// the process table of the shared host. Caching the parsed list for a couple of
// seconds collapses a burst of polls into a single fork.
export interface Pm2Process {
  name:    string;
  pm2_env: {
    status?:            string;
    pm_out_log_path?:   string;
    pm_err_log_path?:   string;
  };
}

const CACHE_TTL_MS = 3_000;
let cache: { at: number; data: Pm2Process[] } | null = null;

/** Return the parsed `pm2 jlist`, served from a short in-process cache. */
export async function getPm2List(): Promise<Pm2Process[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.data;

  const { stdout } = await execAsync('pm2 jlist', { timeout: 10_000 });
  const data = JSON.parse(stdout) as Pm2Process[];
  cache = { at: now, data };
  return data;
}

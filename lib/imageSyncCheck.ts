import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { query } from '@/lib/db'

/**
 * Find dead entries in the image CDN: rows without a file, files without a
 * row, missing derivatives.
 *
 * This is the web version of `scripts/image-sync-check.js`, and it is
 * deliberately the smaller one: the script additionally checks whether the
 * file size on disk matches the `bytes` column, and for that needs an `fs.stat`
 * **per row**, currently around 2100 system calls. That is fine for a cron and
 * not for a click in the dashboard.
 *
 * Here one `readdir` per category is enough, i.e. six calls for the whole
 * collection. That surfaces the three states a visitor actually runs into: a
 * tile whose image returns 404; a file that is served and appears nowhere; a
 * missing derivative. The size comparison stays the script's job, and the UI
 * says so too.
 *
 * Read-only. This file changes nothing, neither in the database nor on disk.
 * Cleaning up remains `image-ingest.js --force` or manual work.
 */

const DERIVATIVES = [
  { suffix: '.webp',       label: 'card'  },
  { suffix: '_thumb.webp', label: 'thumb' },
]

/** How many examples per finding are returned. The rest is only given as a number. */
const SAMPLE_SIZE = 10

export interface SyncCheckCategory {
  category:      string
  rows:          number
  files:         number
  /** Directory is missing entirely. Only a problem if there are rows for it. */
  directoryGone: boolean
  missingFile:   string[]
  orphanFile:    string[]
  missingDeriv:  string[]
  missingFileTotal:  number
  orphanFileTotal:   number
  missingDerivTotal: number
}

export interface SyncCheckResult {
  /**
   * Root that was checked against. Included in the report so that a wrong
   * path is recognisable as such and is not read as an empty CDN.
   */
  root:       string
  problems:   number
  categories: SyncCheckCategory[]
  /** Set when the root is not readable at all (local development). */
  unavailable?: string
}

function cdnRoot(): string {
  return process.env.CDN_ROOT_PATH || '/var/www/cdn.msk-scripts.de'
}

/**
 * turbopackIgnore: the path is dynamic on purpose. The root comes from
 * CDN_ROOT_PATH and points out of the repo (/var/www/cdn.msk-scripts.de),
 * followed by a category slug from the database. Without the hint Turbopack
 * pulls the whole project into build tracing, as already with the transcript
 * upload. Tracing is unused here (no `output: 'standalone'`, the server starts
 * from the full checkout), so the hint only suppresses noise that would drown
 * out real findings.
 */
async function listFiles(dir: string): Promise<string[] | null> {
  try {
    return await readdir(/*turbopackIgnore: true*/ dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

export async function runSyncCheck(): Promise<SyncCheckResult> {
  const root = cdnRoot()

  const categories = await query<{ slug: string }>(
    'SELECT slug FROM msk_image_categories ORDER BY sort_order',
  )

  // If the root itself is missing, this is running on a machine without a CDN
  // directory. Reporting six categories as "directory missing" would then be
  // formally correct and practically a false alarm.
  if ((await listFiles(root)) === null) {
    return {
      root,
      problems: 0,
      categories: [],
      unavailable: `Directory ${root} does not exist on this host. Set CDN_ROOT_PATH or run the check on the server.`,
    }
  }

  const result: SyncCheckCategory[] = []
  let problems = 0

  for (const { slug } of categories) {
    const files = await listFiles(join(/*turbopackIgnore: true*/ root, slug))
    const rows  = await query<{ name: string; ext: string }>(
      'SELECT name, ext FROM msk_images WHERE category = ?', [slug],
    )

    if (files === null) {
      if (rows.length) problems += rows.length
      result.push({
        category: slug, rows: rows.length, files: 0, directoryGone: true,
        missingFile: [], orphanFile: [], missingDeriv: [],
        missingFileTotal: 0, orphanFileTotal: 0, missingDerivTotal: 0,
      })
      continue
    }

    const present = new Set(files)
    const known   = new Set<string>()
    const missingFile:  string[] = []
    const missingDeriv: string[] = []

    for (const row of rows) {
      const original = `${row.name}.${row.ext}`
      known.add(original)
      if (!present.has(original)) missingFile.push(row.name)

      for (const d of DERIVATIVES) {
        const file = `${row.name}${d.suffix}`
        known.add(file)
        if (!present.has(file)) missingDeriv.push(`${row.name} (${d.label})`)
      }
    }

    const orphanFile = files.filter(f => !known.has(f))

    problems += missingFile.length + orphanFile.length + missingDeriv.length

    result.push({
      category:          slug,
      rows:              rows.length,
      files:             files.length,
      directoryGone:     false,
      missingFile:       missingFile.slice(0, SAMPLE_SIZE),
      orphanFile:        orphanFile.slice(0, SAMPLE_SIZE),
      missingDeriv:      missingDeriv.slice(0, SAMPLE_SIZE),
      missingFileTotal:  missingFile.length,
      orphanFileTotal:   orphanFile.length,
      missingDerivTotal: missingDeriv.length,
    })
  }

  return { root, problems, categories: result }
}

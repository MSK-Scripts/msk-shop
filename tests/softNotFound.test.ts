import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * No `loading.tsx` above a route that calls `notFound()`.
 *
 * Until 01.10.2026 `/packages/<unknown id>` and `/categories/<unknown id>`
 * answered with **HTTP 200**. The page rendered `notFound()`, but a
 * `loading.tsx` in the same segment had opened a Suspense boundary: Next sends
 * the shell with the skeleton first, and by then the status is spent. The
 * not-found content only arrives in the stream, under a 200. A soft 404, which
 * a search engine indexes like any other page.
 *
 * Nothing in a type check or a build shows this, and the page looks right in a
 * browser. So the rule is checked on the file tree: a loading file is only
 * harmless where no page at or below it can end in `notFound()`.
 */

const APP = join(process.cwd(), 'app')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const full = join(dir, item.name)
    return item.isDirectory() ? walk(full) : [full]
  })
}

const files = walk(APP)
const isPage = (file: string) => /[\\/]page\.tsx$/.test(file)
const isLoading = (file: string) => /[\\/]loading\.tsx$/.test(file)
const callsNotFound = (file: string) => /\bnotFound\(\)/.test(readFileSync(file, 'utf8'))

describe('loading.tsx and notFound()', () => {
  it('finds the pages that call notFound(), so the check below cannot pass on an empty list', () => {
    const pages = files.filter(isPage).filter(callsNotFound).map(file => relative(APP, file))

    expect(pages.some(page => page.startsWith('packages'))).toBe(true)
    expect(pages.some(page => page.startsWith('categories'))).toBe(true)
  })

  it('has no loading.tsx at or above a page that calls notFound()', () => {
    const offenders: string[] = []

    for (const loading of files.filter(isLoading)) {
      const segment = dirname(loading)
      const below = files.filter(file => isPage(file) && file.startsWith(segment + sep))

      for (const page of below.filter(callsNotFound)) {
        offenders.push(`${relative(APP, loading)} covers ${relative(APP, page)}`)
      }
    }

    expect(offenders).toEqual([])
  })
})

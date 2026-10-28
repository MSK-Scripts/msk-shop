import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'

/**
 * The 404 page of an unknown address is rendered on the server, in the shop
 * layout and with `lang` on `<html>` (WCAG 3.1.1).
 *
 * Until 28.10.2026 the catch-all threw `notFound()`. Next answers that with an
 * empty error shell, `<html id="__next_error__">` without `lang` and without
 * a line of content, and only the browser rendered the page afterwards. Now
 * the proxy marks the address and sets the status 404 itself, and the
 * catch-all renders the page directly. Both halves are checked here: the
 * status must stay 404 (a 404 page with a 200 is a soft 404 a search engine
 * indexes), and the mark must only ever come from the proxy.
 */

const state = vi.hoisted(() => ({ headers: new Headers() }))

vi.mock('next/headers', () => ({
  headers: async () => state.headers,
  cookies: async () => ({ get: () => undefined }),
}))
vi.mock('next/navigation', async importOriginal => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))

import { LANG_HEADER, NOT_FOUND_HEADER } from '@/lib/lang'
import { resolveRequest } from '@/lib/routes'
import { proxy } from '@/proxy'
import UnknownPage from '@/app/[lang]/[...rest]/page'
import { generateMetadata as layoutMetadata } from '@/app/[lang]/layout'

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`https://www.msk-scripts.de${path}`, { headers })

/** A request header as the proxy hands it on to Next. */
const forwarded = (res: Response, name: string) => res.headers.get(`x-middleware-request-${name}`)

describe('unknown addresses in the route table', () => {
  it.each(['/does-not-exist', '/en/does-not-exist', '/de/gibt-es-nicht', '/de/api/health', '/en/sitemap.xml'])(
    '%s is marked unknown',
    path => {
      expect(resolveRequest(path)).toMatchObject({ kind: 'page', unknown: true })
    },
  )

  it.each(['/en', '/de', '/en/fivem', '/en/fivem/123', '/de/rechtliches/agb', '/de/web-tools/bilder/weapons'])(
    '%s is a known page',
    path => {
      const res = resolveRequest(path)
      expect(res.kind).toBe('page')
      expect(res).not.toHaveProperty('unknown')
    },
  )
})

describe('proxy', () => {
  it.each([
    ['/en/does-not-exist', 'en'],
    ['/de/gibt-es-nicht', 'de'],
    ['/does-not-exist', 'en'],
  ])('answers %s with 404 and marks it for the catch-all', (path, lang) => {
    const res = proxy(request(path))
    expect(res.status).toBe(404)
    expect(res.headers.get('x-middleware-rewrite')).toContain(`/${lang}/`)
    expect(forwarded(res, NOT_FOUND_HEADER)).toBe('1')
    expect(forwarded(res, LANG_HEADER)).toBe(lang)
  })

  it('serves a known page with 200 and drops a mark the client sent itself', () => {
    const res = proxy(request('/en/fivem', { [NOT_FOUND_HEADER]: '1' }))
    expect(res.status).toBe(200)
    expect(forwarded(res, NOT_FOUND_HEADER)).toBeNull()
    expect(res.headers.get('x-middleware-override-headers') ?? '').not.toContain(NOT_FOUND_HEADER)
  })
})

describe('catch-all page', () => {
  it('renders the 404 page in the language of the address when the proxy marked it', async () => {
    state.headers = new Headers({ [NOT_FOUND_HEADER]: '1', [LANG_HEADER]: 'de' })
    const html = renderToStaticMarkup(await UnknownPage())
    expect(html).toContain('<h1')
    expect(html).toContain('Seite nicht gefunden')
  })

  it('falls back to notFound() without the mark, so the status is 404 anyway', async () => {
    state.headers = new Headers({ [LANG_HEADER]: 'en' })
    await expect(UnknownPage()).rejects.toThrow('NEXT_NOT_FOUND')
  })
})

describe('404 metadata', () => {
  // For a response that already has the status 404, Next takes the metadata
  // from the layouts only. Without the branch in the layout the 404 page was
  // titled like the home page and said `index, follow`.
  it('keeps the 404 page out of the index and names it', async () => {
    state.headers = new Headers({ [NOT_FOUND_HEADER]: '1', [LANG_HEADER]: 'de' })
    const meta = await layoutMetadata()
    expect(meta.robots).toMatchObject({ index: false })
    expect(meta.title).toEqual({ absolute: 'Seite nicht gefunden | MSK Scripts' })
  })

  it('leaves every other page indexable', async () => {
    state.headers = new Headers({ [LANG_HEADER]: 'de' })
    const meta = await layoutMetadata()
    expect(meta.robots).toMatchObject({ index: true })
  })
})

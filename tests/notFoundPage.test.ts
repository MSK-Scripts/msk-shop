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

const state = vi.hoisted(() => ({
  headers: new Headers(),
  // What Tebex answers the proxy for an address the configured products do not know.
  packages: [
    { id: 12345, name: 'MSK Newscript | Encrypted', slug: 'newscript-e', type: 'single', media: [], category: { id: 2105296, name: 'Encrypted Version' } },
  ] as unknown[],
}))

vi.mock('@/lib/tebex', () => ({
  getPackages: async () => state.packages,
}))

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
import UnknownPage from '@/app/[lang]/(site)/[...rest]/page'
import ProductRoute from '@/app/[lang]/(site)/fivem/[slug]/page'
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

  it.each(['/en', '/de', '/en/fivem', '/en/fivem/garage', '/de/fivem/alle-scripts', '/de/rechtliches/agb', '/de/web-tools/bilder/weapons'])(
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
  ])('answers %s with 404 and marks it for the catch-all', async (path, lang) => {
    const res = await proxy(request(path))
    expect(res.status).toBe(404)
    expect(res.headers.get('x-middleware-rewrite')).toContain(`/${lang}/`)
    expect(forwarded(res, NOT_FOUND_HEADER)).toBe('1')
    expect(forwarded(res, LANG_HEADER)).toBe(lang)
  })

  it('serves a known page with 200 and drops a mark the client sent itself', async () => {
    const res = await proxy(request('/en/fivem', { [NOT_FOUND_HEADER]: '1' }))
    expect(res.status).toBe(200)
    expect(forwarded(res, NOT_FOUND_HEADER)).toBeNull()
    expect(res.headers.get('x-middleware-override-headers') ?? '').not.toContain(NOT_FOUND_HEADER)
  })
})

/**
 * Product addresses. Before Phase 4 an unknown package id reached the page,
 * which threw `notFound()`, and Next answered with its empty error shell
 * without `lang`. Now the proxy decides before anything renders: a slug is a
 * page, an old id redirects, anything else gets the 404 page of its language.
 */
describe('product addresses', () => {
  it.each([
    ['/en/fivem/does-not-exist', 'en'],
    ['/de/fivem/gibt-es-nicht', 'de'],
    ['/en/fivem/999999', 'en'],
    ['/de/fivem/999999', 'de'],
    ['/packages/999999', 'en'],
  ])('answers the unknown product %s with 404 in %s', async (path, lang) => {
    const res = await proxy(request(path))
    expect(res.status).toBe(404)
    expect(forwarded(res, NOT_FOUND_HEADER)).toBe('1')
    expect(forwarded(res, LANG_HEADER)).toBe(lang)
  })

  it('serves a product slug with 200 in both languages', async () => {
    for (const path of ['/en/fivem/garage', '/de/fivem/garage', '/en/fivem/all-access', '/de/fivem/alle-scripts']) {
      const res = await proxy(request(path))
      expect(res.status, path).toBe(200)
      expect(forwarded(res, NOT_FOUND_HEADER), path).toBeNull()
    }
  })

  it('sends an old package id to its product in one hop, with the variant and the query', async () => {
    const res = await proxy(request('/packages/5732588?ref=forum'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://www.msk-scripts.de/en/fivem/garage?variant=source&ref=forum')
  })

  it('asks Tebex about a slug the configured products do not know', async () => {
    // A script added in Tebex without a deploy still has its page and its id address.
    const page = await proxy(request('/de/fivem/newscript'))
    expect(page.status).toBe(200)
    expect(forwarded(page, NOT_FOUND_HEADER)).toBeNull()

    const old = await proxy(request('/en/fivem/12345'))
    expect(old.status).toBe(308)
    expect(old.headers.get('location')).toBe('https://www.msk-scripts.de/en/fivem/newscript')
  })

  it('renders the 404 page of its language on the product route when the proxy marked it', async () => {
    state.headers = new Headers({ [NOT_FOUND_HEADER]: '1', [LANG_HEADER]: 'de' })
    const html = renderToStaticMarkup(await ProductRoute({
      params: Promise.resolve({ slug: 'gibt-es-nicht' }),
      searchParams: Promise.resolve({}),
    }))
    expect(html).toContain('Seite nicht gefunden')
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

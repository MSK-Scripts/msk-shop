import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CartSummary } from '@/components/cart/CartSummary'
import { LangProvider } from '@/components/i18n/LangProvider'
import { canAddToBasket } from '@/lib/basketFlow'
import { cartLines, cartTotals } from '@/lib/cartLines'
import { legalCopy, type Lang } from '@/lib/i18n'
import { formatEuro } from '@/lib/price'
import {
  addGiftToBasket, addToBasket, applyCoupon, createBasket, getAllAuthUrls, getBasket,
  removeCoupon, removeFromBasket,
} from '@/lib/tebex'
import type { TebexBasket } from '@/types/tebex'

/**
 * Phase 6, the cart and the handover to Tebex (plan 5.8, draft legal copy
 * 2.2, decision E9). What is held here is a rule or a data path each: the
 * button says it leads to Tebex and leads nowhere else, the notice names the
 * seller, the total includes VAT, a basket is only filled after the CFX.re
 * sign-in, and every basket call still goes the way it went before.
 */

const CHECKOUT = 'https://checkout.tebex.io/checkout/abc123'

const summary = (lang: Lang, checkoutUrl: string | null, total = 24.99) =>
  renderToStaticMarkup(
    createElement(
      LangProvider,
      { lang, path: '/cart' } as ComponentProps<typeof LangProvider>,
      createElement(CartSummary, {
        lang,
        totals: { total, subtotal: total, discount: 0 },
        coupons: [],
        checkoutUrl,
        headingId: 'summary',
      }),
    ),
  )

/** Text of the first `<a>` whose href is `href`, tags stripped; null if there is none. */
function linkText(markup: string, href: string): string | null {
  for (const m of markup.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g)) {
    if (m[1].replace(/&amp;/g, '&') === href) return m[2].split(/<[^>]*>/).join('').trim()
  }
  return null
}

const text = (markup: string) => markup.split(/<[^>]*>/).join('').replace(/&nbsp;| /g, ' ')

describe('handover to Tebex', () => {
  it.each(['en', 'de'] as const)('the main button names Tebex and links the checkout of the basket (%s)', lang => {
    const label = linkText(summary(lang, CHECKOUT), CHECKOUT)
    expect(label).toBe(legalCopy[lang].cart_button)
    expect(label).toContain('Tebex')
  })

  it.each(['en', 'de'] as const)('the notice above it names Tebex Limited as seller (%s)', lang => {
    expect(text(summary(lang, CHECKOUT))).toContain('Tebex Limited (London, UK)')
  })

  it.each(['en', 'de'] as const)('the total is shown including VAT (%s)', lang => {
    const shown = text(summary(lang, CHECKOUT, 24.99))
    const [label] = legalCopy[lang].cart_total.split('{total}')
    expect(shown).toContain(label.trim())
    expect(label).toMatch(lang === 'de' ? /inkl\. MwSt\./ : /including VAT/)
    expect(shown).toContain(formatEuro(24.99, lang).replace(/ /g, ' '))
  })

  it('links nowhere until Tebex has returned a checkout address', () => {
    const markup = summary('en', null)
    expect(markup).not.toContain('checkout.tebex.io/checkout')
    expect(markup).toMatch(/<button[^>]*disabled/)
  })
})

describe('cart totals', () => {
  const basket = (total: number, coupons: string[] = []) =>
    ({ total_price: total, coupons: coupons.map(code => ({ code })) }) as Pick<TebexBasket, 'total_price' | 'coupons'>

  it('takes the total Tebex charges, and a discount only with a coupon', () => {
    expect(cartTotals(basket(19.99), 24.99)).toEqual({ total: 19.99, subtotal: 24.99, discount: 0 })
    const withCoupon = cartTotals(basket(19.99, ['SAVE']), 24.99)
    expect(withCoupon.total).toBe(19.99)
    expect(withCoupon.discount).toBeCloseTo(5)
  })
})

describe('cart lines', () => {
  it('names the variant chosen on the product page and keeps the gift details', () => {
    const lines = cartLines(
      {
        packages: [
          { id: 5732588, name: 'MSK Garage | Source', quantity: 1, base_price: 39.99, discount: 0, paid_price: 39.99 },
          { id: 5732587, name: 'MSK Garage | Encrypted', quantity: 1, base_price: 19.99, discount: 0, paid_price: 19.99 },
        ],
      },
      { 5732587: { username: 'friend', discordId: '821125865101328384' } },
    )
    expect(lines.map(l => [l.name, l.variant])).toEqual([['MSK Garage', 'source'], ['MSK Garage', 'encrypted']])
    expect(lines[0].href).toBe('/fivem/garage?variant=source')
    expect(lines[1].gift).toEqual({ username: 'friend', discordId: '821125865101328384' })
  })
})

describe('decision E9: sign in with CFX.re before the first add', () => {
  // Tebex answers an add to a basket nobody signed in to with 422
  // "User must login before adding packages to basket".
  it('only adds to a basket Tebex knows a signed-in user for', () => {
    expect(canAddToBasket({ username: 'musiker15', complete: false })).toBe(true)
  })

  it('sends a visitor without sign-in to the CFX.re sign-in instead', () => {
    expect(canAddToBasket({ username: null, complete: false })).toBe(false)
    expect(canAddToBasket({ username: '', complete: false })).toBe(false)
    expect(canAddToBasket(null)).toBe(false)
  })

  it('does not trust a stored login on a completed basket', () => {
    expect(canAddToBasket({ username: 'musiker15', complete: true })).toBe(false)
  })
})

describe('basket calls', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  function stubFetch() {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { ident: 'b1' } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    return () => fetchMock.mock.calls.map(c => {
      const [url, init] = c as unknown as [string, RequestInit | undefined]
      const headers = new Headers(init?.headers)
      return { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined, auth: headers.get('authorization') }
    })
  }

  it('mutates the basket only through our own API routes, never with a key from the browser', async () => {
    const calls = stubFetch()
    await createBasket()
    await addToBasket('b1', 5732587, 'single', 1, '42', { discord_id: '1' })
    await addGiftToBasket('b1', 5732587, 'single', 'friend', '42', '1', '2')
    await removeFromBasket('b1', 5732587)
    await applyCoupon('b1', 'SAVE')
    await removeCoupon('b1', 'SAVE')
    await getAllAuthUrls('b1', 'https://www.msk-scripts.de/en/cart')

    expect(calls().map(c => [c.method, c.url])).toEqual([
      ['POST',   '/api/basket'],
      ['POST',   '/api/basket/b1/packages'],
      ['POST',   '/api/basket/b1/packages'],
      ['POST',   '/api/basket/b1/packages/remove'],
      ['POST',   '/api/basket/b1/coupons'],
      ['DELETE', '/api/basket/b1/coupons/SAVE'],
      ['GET',    '/api/basket/b1/auth?returnUrl=https%3A%2F%2Fwww.msk-scripts.de%2Fen%2Fcart'],
    ])
    expect(calls().every(c => c.auth === null)).toBe(true)
    // The basket route sets the return addresses itself; the browser sends none.
    expect(calls()[0].body).toEqual({})
  })

  it('reads the basket from the public Headless endpoint without credentials', async () => {
    const calls = stubFetch()
    await getBasket('b1')
    const [call] = calls()
    expect(call.method).toBe('GET')
    expect(call.url).toMatch(/^https:\/\/headless\.tebex\.io\/api\/accounts\/[^/]*\/baskets\/b1$/)
    expect(call.auth).toBeNull()
  })

  it('keeps the private Tebex key out of every module the browser loads', () => {
    const root = process.cwd()
    const files = [
      'lib/tebex.ts', 'lib/useCart.ts', 'lib/cartLines.ts', 'lib/basketFlow.ts', 'store/cart.ts',
      ...readdirSync(join(root, 'components/cart')).map(f => `components/cart/${f}`),
      ...readdirSync(join(root, 'app/[lang]/cart')).map(f => `app/[lang]/cart/${f}`),
      ...readdirSync(join(root, 'app/[lang]/checkout')).map(f => `app/[lang]/checkout/${f}`),
    ]
    for (const file of files) {
      const source = readFileSync(join(root, file), 'utf8')
      expect(source, file).not.toMatch(/TEBEX_PRIVATE_KEY|api\/basket\/auth/)
    }
  })
})

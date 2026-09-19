import { describe, it, expect } from 'vitest'
import {
  isAllowedHref, parseNewsPopup, NEWS_POPUP_DEFAULT, NEWS_POPUP_LIMITS,
} from '@/lib/newsPopup'

// No database mock needed: lib/newsPopup.ts is deliberately free of it, which
// is what lets the admin form import the same validation in the browser.

describe('isAllowedHref', () => {
  it('accepts internal paths and https URLs', () => {
    expect(isAllowedHref('/ticketbot/verify')).toBe(true)
    expect(isAllowedHref('/')).toBe(true)
    expect(isAllowedHref('https://docu.msk-scripts.de')).toBe(true)
  })

  it('rejects the schemes that would be stored XSS', () => {
    // Only admins can write here, so this is defence in depth. It is also the
    // one field in this form whose value ends up in an href attribute.
    expect(isAllowedHref('javascript:alert(1)')).toBe(false)
    expect(isAllowedHref('JavaScript:alert(1)')).toBe(false)
    expect(isAllowedHref('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isAllowedHref('vbscript:msgbox(1)')).toBe(false)
  })

  it('rejects protocol-relative URLs', () => {
    // `//evil.example` starts with a slash and would otherwise pass as
    // "internal", while the browser reads it as another origin.
    expect(isAllowedHref('//evil.example')).toBe(false)
    expect(isAllowedHref('//evil.example/path')).toBe(false)
  })

  it('rejects plain http, the empty string and non-strings', () => {
    expect(isAllowedHref('http://example.com')).toBe(false)
    expect(isAllowedHref('')).toBe(false)
    expect(isAllowedHref(null)).toBe(false)
    expect(isAllowedHref(42)).toBe(false)
  })

  it('rejects an href past the length cap', () => {
    expect(isAllowedHref('/' + 'a'.repeat(NEWS_POPUP_LIMITS.href))).toBe(false)
  })
})

describe('parseNewsPopup', () => {
  it('returns the disabled default for anything unusable', () => {
    // Never throws: this runs on read as well, so a row somebody edited by
    // hand must degrade to "off" rather than take the layout down.
    for (const input of [null, undefined, 42, 'not json', '{"broken":', [], {}]) {
      expect(parseNewsPopup(input).enabled).toBe(false)
    }
    expect(parseNewsPopup(null)).toEqual(NEWS_POPUP_DEFAULT)
  })

  it('parses a JSON string as well as an object', () => {
    const value = { enabled: true, title: 'Hi', text: 'There' }
    expect(parseNewsPopup(JSON.stringify(value)).title).toBe('Hi')
    expect(parseNewsPopup(value).title).toBe('Hi')
  })

  it('only treats a real boolean true as enabled', () => {
    // A truthy string from a hand-edited row must not switch the popup on for
    // every visitor.
    expect(parseNewsPopup({ enabled: true }).enabled).toBe(true)
    expect(parseNewsPopup({ enabled: 'true' }).enabled).toBe(false)
    expect(parseNewsPopup({ enabled: 1 }).enabled).toBe(false)
  })

  it('truncates overlong text instead of rejecting it', () => {
    const long = 'x'.repeat(NEWS_POPUP_LIMITS.text + 500)
    expect(parseNewsPopup({ text: long }).text.length).toBe(NEWS_POPUP_LIMITS.text)
  })

  it('drops a button whose href is not allowed', () => {
    expect(parseNewsPopup({ button: { label: 'Go', href: 'javascript:alert(1)' } }).button).toBeNull()
    expect(parseNewsPopup({ button: { label: 'Go', href: '/verify' } }))
      .toMatchObject({ button: { label: 'Go', href: '/verify' } })
  })

  it('drops a button without a label, and trims the one it keeps', () => {
    expect(parseNewsPopup({ button: { label: '   ', href: '/verify' } }).button).toBeNull()
    expect(parseNewsPopup({ button: { label: ' Go ', href: '/verify' } })?.button?.label).toBe('Go')
  })

  it('normalises a blank coupon to null', () => {
    expect(parseNewsPopup({ coupon: '   ' }).coupon).toBeNull()
    expect(parseNewsPopup({ coupon: ' SALE20 ' }).coupon).toBe('SALE20')
  })

  it('never returns a key the component does not know', () => {
    // The row is JSON, so an old or hand-written document can carry anything.
    const parsed = parseNewsPopup({ enabled: true, evil: '<script>', title: 'T' })
    expect(Object.keys(parsed).sort()).toEqual(Object.keys(NEWS_POPUP_DEFAULT).sort())
  })
})

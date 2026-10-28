import { describe, it, expect } from 'vitest'

import { hasClosingBand } from '@/lib/routes'

// The green band asks for questions before a purchase. It belongs on public
// sales pages, not next to the withdrawal or cancellation function, not on the
// legal texts and not inside logged-in areas or the purchase itself.
describe('closing band', () => {
  it.each(['/', '/fivem', '/fivem/garage', '/discord/ticket-bot', '/tools', '/about', '/cart'])(
    'shows on the public page %s', path => {
      expect(hasClosingBand(path)).toBe(true)
    },
  )

  it.each([
    '/withdraw-contract', '/cancel-contract', '/report', '/legal/terms', '/legal/withdrawal',
    '/admin', '/dashboard/ticket-bot', '/account', '/checkout', '/login',
  ])('stays away from %s', path => {
    expect(hasClosingBand(path)).toBe(false)
  })
})

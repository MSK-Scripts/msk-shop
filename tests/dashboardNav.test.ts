import { describe, expect, it } from 'vitest'

import {
  giveawayHref, giveawaySections, ticketBotHref, ticketBotSectionOf, ticketBotSections,
} from '@/lib/dashboardNav'

/**
 * Which navigation entries each dashboard offers, and to whom (Phase 7).
 *
 * The entries replace the tabs of the three dashboards and carry the same
 * rules the tabs had: hosting only in a plan with hosting, the Tebex store
 * only for the owner of the server.
 * The pages and API routes behind each entry check again; these rules decide
 * what is offered, and an entry offered by mistake would at best show a wall
 * of refusals and at worst lead someone into an area that is not theirs.
 */

describe('ticket bot entries', () => {
  it('offers hosting only in the plans that include it', () => {
    expect(ticketBotSections('basic')).toEqual(['overview', 'domains', 'transcripts'])
    expect(ticketBotSections('premium')).toEqual(['overview', 'domains', 'transcripts'])
    expect(ticketBotSections('premium_plus')).toContain('hosting')
    expect(ticketBotSections('business')).toContain('hosting')
  })

  it('gives every area of a server an address of its own', () => {
    expect(ticketBotHref('123456789012345678', 'overview')).toBe('/dashboard/ticket-bot/123456789012345678')
    expect(ticketBotHref('123456789012345678', 'transcripts')).toBe('/dashboard/ticket-bot/123456789012345678/transcripts')
  })

  it('reads the area back from an address, and never takes the sign-in page for a server', () => {
    expect(ticketBotSectionOf('/dashboard/ticket-bot/123456789012345678/hosting')).toBe('hosting')
    expect(ticketBotSectionOf('/dashboard/ticket-bot/123456789012345678')).toBe('overview')
    expect(ticketBotSectionOf('/dashboard/ticket-bot/verify')).toBeNull()
    expect(ticketBotSectionOf('/dashboard/ticket-bot/123456789012345678/nonsense')).toBeNull()
  })
})

describe('giveaway bot entries', () => {
  it('offers the Tebex store to the server owner only', () => {
    expect(giveawaySections(false)).not.toContain('store')
    expect(giveawaySections(true)).toContain('store')
    expect(giveawaySections(false)).toEqual(['overview', 'giveaways', 'templates', 'settings'])
  })

  it('keeps the overview at the old dashboard address', () => {
    expect(giveawayHref('overview')).toBe('/dashboard/giveaway-bot')
  })
})

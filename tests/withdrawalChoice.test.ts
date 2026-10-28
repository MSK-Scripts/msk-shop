import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WithdrawalClient } from '@/app/[lang]/withdraw-contract/WithdrawalClient'
import { LangProvider } from '@/components/i18n/LangProvider'
import { LEGAL_LINKS, legalFormTranslations, type Lang } from '@/lib/i18n'
import { parseContractChoice, withdrawalTarget, type ContractChoice } from '@/lib/withdrawalChoice'

/**
 * "Withdraw from contract" first asks which contract (draft legal copy 2.5).
 * A subscription with MSK Scripts goes to our own withdrawal function
 * (§ 356a BGB); a purchase in the shop is a contract with Tebex, so it gets
 * the way to Tebex and no form of ours: MSK must not accept withdrawals on
 * Tebex' behalf (answer F4).
 */

const page = (lang: Lang, initialChoice: ContractChoice | null) =>
  renderToStaticMarkup(
    createElement(
      LangProvider,
      { lang, path: '/withdraw-contract' } as ComponentProps<typeof LangProvider>,
      createElement(WithdrawalClient, { initialChoice }),
    ),
  )

const text = (markup: string) => markup.split(/<[^>]*>/).join('')

describe('withdrawal target', () => {
  it('sends a subscription to our withdrawal route', () => {
    expect(withdrawalTarget('subscription')).toEqual({ kind: 'form', endpoint: '/api/legal/withdrawal' })
  })

  it('sends a shop purchase to Tebex', () => {
    expect(withdrawalTarget('shop')).toEqual({ kind: 'tebex', href: LEGAL_LINKS.tebexSupport })
  })
})

describe.each(['en', 'de'] as const)('withdrawal page (%s)', lang => {
  const t = legalFormTranslations[lang]

  it('keeps the prescribed label and asks first, with neither form nor pointer', () => {
    const markup = page(lang, null)
    expect(text(markup)).toContain(t.revoke_title)
    expect(markup.match(/type="radio"[^>]*name="contract"/g)).toHaveLength(2)
    expect(markup).not.toContain('<form')
    expect(markup).not.toContain(LEGAL_LINKS.tebexSupport)
  })

  it('shows our form with its confirmation button for a subscription', () => {
    const markup = page(lang, 'subscription')
    expect(markup).toContain('<form')
    for (const field of ['name', 'contractRef', 'email']) expect(markup).toContain(`id="${field}"`)
    expect(text(markup)).toContain(t.revoke_submit)
    expect(markup).not.toContain(LEGAL_LINKS.tebexSupport)
  })

  it('shows the way to Tebex and no form of ours for a shop purchase', () => {
    const markup = page(lang, 'shop')
    expect(markup).toContain(`href="${LEGAL_LINKS.tebexSupport}"`)
    expect(markup).not.toContain('<form')
    expect(text(markup)).not.toContain(t.revoke_submit)
  })
})

describe('preselected contract', () => {
  it('takes only the two known choices from the address', () => {
    expect(parseContractChoice('subscription')).toBe('subscription')
    expect(parseContractChoice('shop')).toBe('shop')
    expect(parseContractChoice(['subscription', 'shop'])).toBe('subscription')
    expect(parseContractChoice('anything')).toBeNull()
    expect(parseContractChoice(undefined)).toBeNull()
  })
})

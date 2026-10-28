import { LEGAL_LINKS } from '@/lib/i18n'

/**
 * The first step of "Withdraw from contract" (draft legal copy 2.5): which
 * contract is it about?
 *
 * - A subscription with MSK Scripts (Ticket Bot, MSK Forms): MSK Scripts is
 *   the contract partner, so the withdrawal function of § 356a BGB is ours
 *   and the declaration goes to our own route, as before.
 * - A purchase in the shop: Tebex Limited is the seller (merchant of record).
 *   The function is Tebex' duty (answer F3), MSK has no own one (answer F4),
 *   and MSK must not accept withdrawals on Tebex' behalf. So there is no form
 *   of ours, only the way to Tebex.
 */
export type ContractChoice = 'subscription' | 'shop'

export type WithdrawalTarget =
  | { kind: 'form'; endpoint: '/api/legal/withdrawal' }
  | { kind: 'tebex'; href: string }

export function withdrawalTarget(choice: ContractChoice): WithdrawalTarget {
  return choice === 'subscription'
    ? { kind: 'form', endpoint: '/api/legal/withdrawal' }
    : { kind: 'tebex', href: LEGAL_LINKS.tebexSupport }
}

/**
 * `?contract=subscription` preselects the choice, e.g. from the order
 * confirmation of a subscription, so a subscriber never has an extra step.
 * Anything else asks first.
 */
export function parseContractChoice(value: unknown): ContractChoice | null {
  const v = Array.isArray(value) ? value[0] : value
  return v === 'subscription' || v === 'shop' ? v : null
}

import type { TebexBasket } from '@/types/tebex'

/**
 * Decision E9 (plan section 10): may a package go into a basket before the
 * CFX.re sign-in, with the sign-in only at the checkout?
 *
 * No. The Tebex documentation only says that "authorization may be required
 * at checkout" depending on the store type and that "the user must be logged
 * in before the quantity can be changed" (Headless API, "Authorize a Basket"
 * and the OpenAPI schema of PUT /baskets/{ident}/packages/{id}). For this
 * store, a FiveM store whose scripts Tebex grants to a CFX.re account, the
 * live API answers an add to a basket nobody signed in to with
 * `422 "User must login before adding packages to basket"` (reproduced on
 * 18.08.2026, session log "warenkorb-stale-login-fix").
 *
 * So the order stays: create the basket, sign in with CFX.re, then add. A
 * basket can be created without the sign-in, it just cannot be filled.
 *
 * This is the one check that decides it. A stored user name alone is not
 * enough: the stored login outlives an expired or completed basket, and an
 * add on top of it ran silently into the 422 until 18.08.2026.
 */
export function canAddToBasket(basket: Pick<TebexBasket, 'username' | 'complete'> | null | undefined): boolean {
  return Boolean(basket && !basket.complete && basket.username)
}

// Zentrale Preis-/Sale-Auflösung für die Anzeige.
//
// Tebex meldet einen aktiven (ggf. user-spezifischen) Sale über die Headless-API
// NUR mit authentifiziertem Basket-Ident – und in einer unintuitiven Form:
//   base_price  = Preis NACH Rabatt (z. B. 17.994)
//   discount    = Rabattbetrag in der Währung (z. B. 11.996)
//   total_price = zahlbarer Preis (z. B. 17.99)
// Der ursprüngliche (Vor-Sale-)Preis ist also `base_price + discount`.
//
// Ohne Sale (bzw. ohne Basket-Kontext) gilt base_price == total_price und discount == 0.

export interface SaleData {
  base_price: number
  total_price: number
  discount: number
}

export interface DisplayPrice {
  /** Ursprünglicher Katalogpreis (durchgestrichen, wenn rabattiert). */
  original: number
  /** Tatsächlich zu zahlender Preis. */
  price: number
  isFree: boolean
  hasDiscount: boolean
  /** Gerundeter Rabatt in Prozent. */
  discountPct: number
}

export function resolveDisplayPrice(
  pkgBasePrice: number,
  pkgTotalPrice: number,
  sale?: SaleData,
): DisplayPrice {
  // Mit aktivem Sale ist base_price bereits rabattiert → Original = base_price + discount.
  // Ohne Sale-Daten der Katalogpreis aus den Server-Props.
  const original = sale ? sale.base_price + sale.discount : pkgBasePrice
  const price = sale?.total_price ?? pkgTotalPrice
  const isFree = original === 0
  // Float-Guard: 17.994 vs. 17.99 darf NICHT als „Sale −0%" durchrutschen.
  const hasDiscount = !isFree && original > 0 && original - price > 0.005
  const discountPct = hasDiscount
    ? Math.round(((original - price) / original) * 100)
    : 0

  return { original, price, isFree, hasDiscount, discountPct }
}

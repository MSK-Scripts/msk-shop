/**
 * Zahlungsarten-Marken für den Footer.
 *
 * Bewusst inline als SVG und ohne externe Datei: die Nonce-CSP erlaubt keine
 * fremden Hosts, und drei kleine Marken sind billiger als drei Requests.
 *
 * Welche Methoden hier stehen, ist NICHT aus einer API ableitbar. Die Tebex
 * Plugin API kennt pro Zahlung nur das Gateway ("Tebex Checkout" bzw. "Manual"),
 * Store-Settings und Gateways sind gar nicht API-exponiert. Die Liste stammt
 * deshalb aus dem Tebex-Creator-Panel (Stand 02.08.2026: PayPal, Visa,
 * Mastercard). Ändert Moritz die aktiven Methoden dort, muss das hier von Hand
 * nachgezogen werden.
 */

const CARD_CLASS = 'h-5 w-8 shrink-0 rounded-[3px] ring-1 ring-black/10'

// Wordmark-Schrift der Karten. Bewusst die Systemschrift und nicht
// `var(--font-sans)`, damit die Marke unabhängig vom Theme-Font gleich aussieht.
const WORDMARK_FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

function Visa() {
  return (
    <svg viewBox="0 0 32 20" role="img" aria-label="Visa" className={CARD_CLASS}>
      <rect width="32" height="20" rx="3" fill="#ffffff" />
      <text
        x="16"
        y="14"
        textAnchor="middle"
        fontFamily={WORDMARK_FONT}
        fontSize="9"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="0.3"
        fill="#1434CB"
      >
        VISA
      </text>
    </svg>
  )
}

function Mastercard() {
  return (
    <svg viewBox="0 0 32 20" role="img" aria-label="Mastercard" className={CARD_CLASS}>
      <rect width="32" height="20" rx="3" fill="#ffffff" />
      <circle cx="13" cy="10" r="6" fill="#EB001B" />
      <circle cx="19" cy="10" r="6" fill="#F79E1B" />
      {/* Schnittfläche der beiden Kreise: Schnittpunkte liegen bei x = 16,
          y = 10 ± sqrt(6² − 3²) = 10 ± 5.196. */}
      <path d="M16 4.804a6 6 0 0 1 0 10.392 6 6 0 0 1 0-10.392Z" fill="#FF5F00" />
    </svg>
  )
}

function PayPal() {
  return (
    <svg viewBox="0 0 32 20" role="img" aria-label="PayPal" className={CARD_CLASS}>
      <rect width="32" height="20" rx="3" fill="#ffffff" />
      <text
        x="16"
        y="13.5"
        textAnchor="middle"
        fontFamily={WORDMARK_FONT}
        fontSize="7.5"
        fontWeight="700"
        fontStyle="italic"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009CDE">Pal</tspan>
      </text>
    </svg>
  )
}

export function PaymentMarks({ label }: { label: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-xs text-[var(--color-muted-foreground)]">{label}</span>
      <div className="flex items-center gap-2">
        <PayPal />
        <Visa />
        <Mastercard />
      </div>
    </div>
  )
}

// ── Order confirmation under § 312f BGB ─────────────────────────────────────
//
// For a distance contract for a service, the trader must confirm the contract
// content "innerhalb einer angemessenen Frist nach Vertragsschluss, auf
// einem dauerhaften Datenträger" (within a reasonable time after conclusion of
// the contract, on a durable medium), together with the information under
// Art. 246a EGBGB. Stripe sends a payment receipt, not a contract
// confirmation: the receipt names neither the term nor cancellation nor the
// terms and conditions, and it says nothing at all about withdrawal.
//
// Hence this mail. Pure and testable without SMTP, like `trialEnding.ts`.

import type { MailLang } from './trialEnding';
import { publicPath } from '@/lib/routes';
import type { BillingInterval } from '@/lib/tiers';

const BASE_URL = 'https://www.msk-scripts.de';

/** Escape the few characters that could break out of the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface OrderConfirmationInput {
  lang:       MailLang;
  /** Display name of the tier, e.g. "Hosted". */
  tierLabel:  string;
  /** Server name, or the id if the name is unknown. External input. */
  guildLabel: string;
  /** Price per billing period, already formatted ("4,99 €" or "€49.00"). */
  price:      string;
  /**
   * How often the price is charged, from the Stripe price
   * (`price.recurring.interval`). Required, so no caller can fall back to
   * "per month" for a yearly plan, which is what this mail did until
   * 28.10.2026.
   */
  interval:   BillingInterval;
  /** True while the free trial is running. */
  inTrial:    boolean;
  /** End of the trial, if one is running. */
  trialEndsAt?: Date | null;
}

export interface BuiltEmail {
  subject: string;
  text:    string;
  html:    string;
}

function formatDate(date: Date, lang: MailLang): string {
  return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function buildOrderConfirmation(input: OrderConfirmationInput): BuiltEmail {
  const { lang, tierLabel, guildLabel, price, interval, inTrial, trialEndsAt } = input;
  const de = lang === 'de';
  const yearly = interval === 'yearly';

  // The route table writes the address in the mail's language, so a German
  // customer lands on /de/rechtliches/agb and not on the English text.
  const url = (path: string) => `${BASE_URL}${publicPath(lang, path)}`;
  const links = {
    terms:      url('/legal/terms'),
    withdrawal: url('/legal/withdrawal'),
    // A subscriber lands on the form right away, without the question
    // which contract it is (lib/withdrawalChoice.ts).
    revoke:     url('/withdraw-contract?contract=subscription'),
    cancel:     url('/cancel-contract'),
    dashboard:  url('/dashboard/ticket-bot'),
  };

  const subject = de
    ? `Bestellbestätigung: ${tierLabel} für ${guildLabel}`
    : `Order confirmation: ${tierLabel} for ${guildLabel}`;

  const trialLine = inTrial && trialEndsAt
    ? (de
        ? `Kostenlose Testphase bis ${formatDate(trialEndsAt, 'de')}. Bis dahin fällt kein Entgelt an.`
        : `Free trial until ${formatDate(trialEndsAt, 'en')}. No charge is incurred until then.`)
    : null;

  const rows = [
    de ? `Leistung: Ticket-Bot-Transcript-Service ${tierLabel}` : `Service: Ticket Bot transcript service ${tierLabel}`,
    de ? `Discord-Server: ${guildLabel}`                        : `Discord server: ${guildLabel}`,
    de ? `Preis: ${price} ${yearly ? 'pro Jahr' : 'pro Monat'}`
       : `Price: ${price} ${yearly ? 'per year' : 'per month'}`,
    de ? 'Steuerfreie Leistung, Kleinunternehmer nach § 19 UStG'
       : 'VAT-exempt supply, small business under § 19 UStG',
    // Term as in § 6 (1) of the terms: one month or twelve months, renewing
    // by the same period. Same wording as the order summary in the dashboard.
    de ? `Laufzeit: ${yearly ? 'zwölf Monate, verlängert sich jährlich' : 'ein Monat, verlängert sich monatlich'}`
       : `Term: ${yearly ? 'twelve months, renews yearly' : 'one month, renews monthly'}`,
    ...(trialLine ? [trialLine] : []),
  ];

  const body = de
    ? [
        'vielen Dank für deine Bestellung. Hiermit bestätigen wir den Vertrag auf einem dauerhaften Datenträger.',
        '',
        ...rows,
        '',
        `Kündigung jederzeit zum Ende des Abrechnungszeitraums: ${links.cancel}`,
        `Widerruf innerhalb von 14 Tagen: ${links.revoke}`,
        `Widerrufsbelehrung mit Muster-Formular: ${links.withdrawal}`,
        `Unsere AGB: ${links.terms}`,
        `Dein Dashboard: ${links.dashboard}`,
        '',
        'Bei Fragen antworte einfach auf diese E-Mail.',
      ]
    : [
        'thank you for your order. We hereby confirm the contract on a durable medium.',
        '',
        ...rows,
        '',
        `Cancel at any time to the end of the billing period: ${links.cancel}`,
        `Withdraw within 14 days: ${links.revoke}`,
        `Withdrawal instructions with model form: ${links.withdrawal}`,
        `Our Terms and Conditions: ${links.terms}`,
        `Your dashboard: ${links.dashboard}`,
        '',
        'If you have any questions, simply reply to this email.',
      ];

  const text = [subject, '', ...body].join('\n');

  const html = [
    `<p><strong>${escapeHtml(subject)}</strong></p>`,
    `<p>${escapeHtml(body[0])}</p>`,
    `<ul>${rows.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`,
    '<ul>',
    `<li><a href="${links.cancel}">${de ? 'Verträge hier kündigen' : 'Cancel contracts here'}</a></li>`,
    `<li><a href="${links.revoke}">${de ? 'Vertrag widerrufen' : 'Withdraw from contract'}</a></li>`,
    `<li><a href="${links.withdrawal}">${de ? 'Widerrufsbelehrung' : 'Withdrawal instructions'}</a></li>`,
    `<li><a href="${links.terms}">${de ? 'AGB' : 'Terms and Conditions'}</a></li>`,
    `<li><a href="${links.dashboard}">Dashboard</a></li>`,
    '</ul>',
    `<p>${escapeHtml(body[body.length - 1])}</p>`,
  ].join('\n');

  return { subject, text, html };
}

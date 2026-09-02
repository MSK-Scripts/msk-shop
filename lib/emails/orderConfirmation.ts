// ── Bestellbestätigung nach § 312f BGB ──────────────────────────────────────
//
// Bei einem Fernabsatzvertrag über eine Dienstleistung muss der Unternehmer den
// Vertragsinhalt "innerhalb einer angemessenen Frist nach Vertragsschluss, auf
// einem dauerhaften Datenträger" bestätigen, samt der Informationen nach
// Art. 246a EGBGB. Stripe schickt eine Zahlungsquittung, keine
// Vertragsbestätigung — die Quittung nennt weder Laufzeit noch Kündigung noch
// die AGB, und über den Widerruf sagt sie gar nichts.
//
// Deshalb diese Mail. Rein und ohne SMTP testbar, wie `trialEnding.ts`.

import type { MailLang } from './trialEnding';

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
  /** Anzeigename der Stufe, z. B. "Premium+". */
  tierLabel:  string;
  /** Servername, oder die Id wenn der Name unbekannt ist. Fremde Eingabe. */
  guildLabel: string;
  /** Monatspreis, bereits formatiert ("3,99 €" bzw. "€3.99"). */
  price:      string;
  /** True, solange die kostenlose Testphase läuft. */
  inTrial:    boolean;
  /** Ende der Testphase, wenn eine läuft. */
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
  const { lang, tierLabel, guildLabel, price, inTrial, trialEndsAt } = input;
  const de = lang === 'de';

  const links = {
    terms:      `${BASE_URL}${de ? '/de' : ''}/terms`,
    withdrawal: `${BASE_URL}${de ? '/de' : ''}/terms/widerruf`,
    revoke:     `${BASE_URL}${de ? '/de' : ''}/vertrag-widerrufen`,
    cancel:     `${BASE_URL}${de ? '/de' : ''}/vertrag-kuendigen`,
    dashboard:  `${BASE_URL}${de ? '/de' : ''}/ticketbot/dashboard`,
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
    de ? `Preis: ${price} pro Monat, keine Umsatzsteuer ausgewiesen (§ 19 UStG)`
       : `Price: ${price} per month, no VAT shown (§ 19 UStG)`,
    de ? 'Laufzeit: ein Monat, verlängert sich monatlich'
       : 'Term: one month, renews monthly',
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

// ── Acknowledgements of receipt for the three mandatory forms ───────────────
//
// Withdrawal (§ 356a BGB), cancellation (§ 312k BGB) and DSA report (Art. 16).
//
// The first two are not a courtesy but a statutory requirement: the
// acknowledgement must reach the declaring party "auf einem dauerhaften
// Datenträger" (on a durable medium) and contain **the content of the
// declaration, date and time of receipt**. That is exactly why the full
// declaration text is in the mail and not just a "we have received your request".
//
// Everything here is pure: no database, no SMTP, no `new Date()` without it
// being passed in. That way the wording is testable without sending a mail.

import type { MailLang } from './trialEnding';

export type { MailLang };

const OWNER_LINE = 'Moritz Kohm, MSK Scripts, c/o Impressumservice Dein-Impressum, Stettiner Str. 41, 35410 Hungen';
const CONTACT_MAIL = 'info@msk-scripts.de';

/** Escape the few characters that could break out of the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Human-readable point in time, with time zone.
 *
 * The zone belongs to it and is not a detail: the acknowledgement is the proof
 * that a deadline was met, and "14:03 Uhr" without a zone does not answer the
 * question of whether the last day was still running.
 */
export function formatReceiptTime(at: Date, lang: MailLang): string {
  const formatted = at.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Berlin',
  });
  return lang === 'de'
    ? `${formatted} Uhr (Zeitzone Europe/Berlin)`
    : `${formatted} (time zone Europe/Berlin)`;
}

export interface BuiltEmail {
  subject: string;
  text:    string;
  html:    string;
}

/** One "Label: value" line for the text part, empty values are dropped. */
function line(label: string, value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return v ? `${label}: ${v}` : null;
}

function buildBody(lang: MailLang, heading: string, intro: string, rows: (string | null)[], outro: string): BuiltEmail {
  const kept = rows.filter((r): r is string => r !== null);
  const text = [
    heading,
    '',
    intro,
    '',
    ...kept,
    '',
    outro,
    '',
    '--',
    OWNER_LINE,
    CONTACT_MAIL,
  ].join('\n');

  const html = [
    `<p><strong>${escapeHtml(heading)}</strong></p>`,
    `<p>${escapeHtml(intro)}</p>`,
    `<ul>${kept.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`,
    `<p>${escapeHtml(outro)}</p>`,
    `<hr /><p style="font-size:12px;color:#666">${escapeHtml(OWNER_LINE)}<br />`
      + `<a href="mailto:${CONTACT_MAIL}">${CONTACT_MAIL}</a></p>`,
  ].join('\n');

  return { subject: heading, text, html };
}

// ── Withdrawal ──────────────────────────────────────────────────────────────

export interface WithdrawalInput {
  lang:        MailLang;
  name:        string;
  contractRef: string;
  email:       string;
  receivedAt:  Date;
}

export function buildWithdrawalReceipt(input: WithdrawalInput): BuiltEmail {
  const { lang, name, contractRef, email, receivedAt } = input;
  const when = formatReceiptTime(receivedAt, lang);

  if (lang === 'de') {
    return buildBody(
      'de',
      'Eingangsbestätigung: Widerruf',
      'wir bestätigen den Eingang deiner Widerrufserklärung. Diese E-Mail ist deine Bestätigung auf einem '
        + 'dauerhaften Datenträger. Sie enthält den Inhalt deiner Erklärung sowie Datum und Uhrzeit des Eingangs.',
      [
        line('Eingegangen am', when),
        line('Name', name),
        line('Angaben zum Vertrag', contractRef),
        line('E-Mail-Adresse', email),
        line('Erklärung', 'Hiermit widerrufe ich den mit MSK Scripts geschlossenen Vertrag über die '
          + 'oben bezeichnete Leistung.'),
      ],
      'Wir bearbeiten den Widerruf und erstatten bereits gezahlte Entgelte innerhalb von 14 Tagen ab Eingang. '
        + 'Fällt der Widerruf in eine kostenlose Testphase, ist nichts zu erstatten. Bei Rückfragen antworte '
        + 'einfach auf diese E-Mail.',
    );
  }

  return buildBody(
    'en',
    'Acknowledgement of receipt: withdrawal',
    'we confirm receipt of your withdrawal declaration. This email is your acknowledgement on a durable medium. '
      + 'It contains the content of your declaration as well as the date and time it was received.',
    [
      line('Received on', when),
      line('Name', name),
      line('Contract details', contractRef),
      line('Email address', email),
      line('Declaration', 'I hereby withdraw from the contract concluded with MSK Scripts for the service '
        + 'identified above.'),
    ],
    'We will process the withdrawal and refund any payments already made within 14 days of receipt. '
      + 'If the withdrawal falls within a free trial period, there is nothing to refund. '
      + 'If you have any questions, simply reply to this email.',
  );
}

// ── Cancellation ────────────────────────────────────────────────────────────

export type CancellationKind = 'ordinary' | 'extraordinary';

export interface CancellationInput {
  lang:        MailLang;
  kind:        CancellationKind;
  name:        string;
  contractRef: string;
  email:       string;
  effectiveAt: string;
  reason?:     string | null;
  receivedAt:  Date;
}

export function buildCancellationReceipt(input: CancellationInput): BuiltEmail {
  const { lang, kind, name, contractRef, email, effectiveAt, reason, receivedAt } = input;
  const when = formatReceiptTime(receivedAt, lang);

  if (lang === 'de') {
    return buildBody(
      'de',
      'Eingangsbestätigung: Kündigung',
      'wir bestätigen den Eingang deiner Kündigung. Diese E-Mail ist deine Bestätigung auf einem dauerhaften '
        + 'Datenträger und enthält Inhalt, Datum und Uhrzeit des Eingangs.',
      [
        line('Eingegangen am', when),
        line('Art der Kündigung', kind === 'extraordinary'
          ? 'Außerordentliche Kündigung aus wichtigem Grund'
          : 'Ordentliche Kündigung zum Ende des Abrechnungszeitraums'),
        line('Name', name),
        line('Angaben zum Vertrag', contractRef),
        line('E-Mail-Adresse', email),
        line('Kündigungszeitpunkt', effectiveAt),
        line('Grund', reason),
      ],
      'Die Stufe fällt zum Vertragsende auf Basic zurück. Vorhandene Transkripte bleiben bis zu ihrem '
        + 'individuellen Ablauf abrufbar, eine eigene Domain und das Bot-Hosting werden deaktiviert. '
        + 'Wir melden uns, sobald die Kündigung umgesetzt ist.',
    );
  }

  return buildBody(
    'en',
    'Acknowledgement of receipt: cancellation',
    'we confirm receipt of your cancellation. This email is your acknowledgement on a durable medium and '
      + 'contains its content as well as the date and time of receipt.',
    [
      line('Received on', when),
      line('Type of cancellation', kind === 'extraordinary'
        ? 'Immediate cancellation for cause'
        : 'Ordinary cancellation at the end of the billing period'),
      line('Name', name),
      line('Contract details', contractRef),
      line('Email address', email),
      line('Date of cancellation', effectiveAt),
      line('Reason', reason),
    ],
    'The tier falls back to Basic when the contract ends. Existing transcripts remain available until their '
      + 'individual expiry; a custom domain and bot hosting are deactivated. '
      + 'We will get in touch once the cancellation has been carried out.',
  );
}

// ── DSA report ──────────────────────────────────────────────────────────────

export interface ReportInput {
  lang:       MailLang;
  name:       string;
  email:      string;
  contentUrl: string;
  reason:     string;
  receivedAt: Date;
}

export function buildReportReceipt(input: ReportInput): BuiltEmail {
  const { lang, name, email, contentUrl, reason, receivedAt } = input;
  const when = formatReceiptTime(receivedAt, lang);

  if (lang === 'de') {
    return buildBody(
      'de',
      'Eingangsbestätigung: Meldung eines Inhalts',
      'wir bestätigen den Eingang deiner Meldung nach Art. 16 der Verordnung (EU) 2022/2065.',
      [
        line('Eingegangen am', when),
        line('Gemeldete Adresse', contentUrl),
        line('Begründung', reason),
        line('Name', name),
        line('E-Mail-Adresse', email),
      ],
      'Wir prüfen die Meldung zeitnah, sorgfältig und ohne Willkür und informieren dich über unsere '
        + 'Entscheidung, einschließlich der Gründe und der Möglichkeiten, dagegen vorzugehen.',
    );
  }

  return buildBody(
    'en',
    'Acknowledgement of receipt: content report',
    'we confirm receipt of your report under Art. 16 of Regulation (EU) 2022/2065.',
    [
      line('Received on', when),
      line('Reported address', contentUrl),
      line('Reasons', reason),
      line('Name', name),
      line('Email address', email),
    ],
    'We will review the report promptly, diligently and in a non-arbitrary manner and inform you of our '
      + 'decision, including the reasons for it and the means of redress available to you.',
  );
}

// ── Internal notification ───────────────────────────────────────────────────

/**
 * Notice to info@msk-scripts.de. Deliberately always in German and always with
 * all fields: nobody reads this as a customer, but someone who has to act
 * right away.
 */
export function buildInternalNotice(
  kind: 'withdrawal' | 'cancellation' | 'report',
  fields: Record<string, string | null | undefined>,
  receivedAt: Date,
): BuiltEmail {
  const titles = {
    withdrawal:   'Neuer Widerruf',
    cancellation: 'Neue Kündigung',
    report:       'Neue Inhaltsmeldung (DSA)',
  } as const;

  const rows = Object.entries(fields).map(([k, v]) => line(k, v));
  return buildBody(
    'de',
    titles[kind],
    `Eingegangen am ${formatReceiptTime(receivedAt, 'de')}.`,
    rows,
    kind === 'report'
      ? 'Bitte zeitnah entscheiden und den Meldenden über das Ergebnis informieren (Art. 16 Abs. 5 DSA).'
      : 'Bitte im Stripe-Dashboard umsetzen und die Guild-Stufe prüfen.',
  );
}

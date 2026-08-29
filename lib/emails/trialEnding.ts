// ── "Your trial ends soon" mail ──────────────────────────────────────────────
//
// Since the checkout stopped asking for a card, a trial cannot convert on its
// own: without a payment method Stripe cancels it at the end. The dashboard says
// so, but nobody is required to open the dashboard during those 14 days, so this
// mail is the only notice a customer reliably gets.
//
// Everything here is pure so it can be tested without SMTP or Stripe.

export type MailLang = 'en' | 'de';

const BASE_URL = 'https://www.msk-scripts.de';
const DASHBOARD_URL = `${BASE_URL}/ticketbot/dashboard`;

/**
 * Pick the mail language from the customer's Stripe locales. German only for an
 * explicit German locale; everything else, including an empty list, gets English
 * because that is the language the whole product defaults to.
 */
export function pickMailLang(preferredLocales: string[] | null | undefined): MailLang {
  const first = preferredLocales?.[0]?.toLowerCase() ?? '';
  return first.startsWith('de') ? 'de' : 'en';
}

/** Escape the few characters that could break out of the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format the trial end for humans, in the language of the mail. */
export function formatTrialEnd(date: Date, lang: MailLang): string {
  return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export interface TrialEndingInput {
  lang:       MailLang;
  /** Discord server name, or its id when the name is unknown. Untrusted input. */
  guildLabel: string;
  /** When the trial expires. */
  trialEndsAt: Date;
  /** Monthly price after the trial, already formatted (e.g. "3,99 €"). */
  price:      string;
}

export interface BuiltEmail {
  subject: string;
  text:    string;
  html:    string;
}

/**
 * Build the reminder. Deliberately short and free of marketing: it states what
 * happens, when, and what to do about it. The one thing it must never do is
 * imply that money will be taken automatically, because it will not.
 */
export function buildTrialEndingEmail(input: TrialEndingInput): BuiltEmail {
  const { lang, guildLabel, trialEndsAt, price } = input;
  const date = formatTrialEnd(trialEndsAt, lang);

  const copy = lang === 'de'
    ? {
        subject: `Deine Testphase endet am ${date}`,
        greeting: 'Hallo,',
        lead:
          `deine kostenlose Testphase für den Ticket Bot auf "${guildLabel}" läuft noch bis zum ${date}.`,
        action:
          'Es ist kein Zahlungsmittel hinterlegt, deshalb endet das Abo an diesem Tag automatisch '
          + 'und der Server fällt auf Basic zurück. Es wird nichts abgebucht.',
        keep:
          `Wenn du Premium behalten willst, hinterlege im Dashboard ein Zahlungsmittel. `
          + `Danach läuft das Abo für ${price} pro Monat weiter, jederzeit kündbar.`,
        cta: 'Zum Dashboard',
        signoff: 'Viele Grüße\nMSK Scripts',
      }
    : {
        subject: `Your trial ends on ${date}`,
        greeting: 'Hi,',
        lead:
          `your free trial of the Ticket Bot on "${guildLabel}" runs until ${date}.`,
        action:
          'There is no payment method on file, so the subscription ends automatically on that day '
          + 'and the server falls back to Basic. Nothing will be charged.',
        keep:
          `If you want to keep Premium, add a payment method in your dashboard. `
          + `The subscription then continues at ${price} per month, cancel anytime.`,
        cta: 'Open dashboard',
        signoff: 'Best regards\nMSK Scripts',
      };

  const text = [
    copy.greeting,
    '',
    copy.lead,
    '',
    copy.action,
    '',
    copy.keep,
    '',
    `${copy.cta}: ${DASHBOARD_URL}`,
    '',
    copy.signoff,
  ].join('\n');

  const html = `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:24px;background:#0a0b0d;color:#f0ede8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#131317;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px;">
    <p style="margin:0 0 16px;">${escapeHtml(copy.greeting)}</p>
    <p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(copy.lead)}</p>
    <p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(copy.action)}</p>
    <p style="margin:0 0 24px;line-height:1.6;">${escapeHtml(copy.keep)}</p>
    <p style="margin:0 0 24px;">
      <a href="${DASHBOARD_URL}" style="display:inline-block;background:#00E676;color:#0a0b0d;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(copy.cta)}</a>
    </p>
    <p style="margin:0;color:#b0adb8;font-size:13px;white-space:pre-line;">${escapeHtml(copy.signoff)}</p>
  </div>
</body>
</html>`;

  return { subject: copy.subject, text, html };
}

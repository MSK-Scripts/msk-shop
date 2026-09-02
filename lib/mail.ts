import nodemailer, { type Transporter } from 'nodemailer';

// ── Outgoing mail ────────────────────────────────────────────────────────────
//
// The shop sends exactly one kind of mail today: the reminder that a free trial
// is about to end (see lib/emails/trialEnding.ts). Everything else the customer
// needs is either in the dashboard or comes from Stripe itself.
//
// Configuration lives in the environment (SMTP_HOST/PORT/USER/PASS, MAIL_FROM).
// If it is incomplete the module degrades to a no-op instead of throwing: a shop
// without mail credentials must still take orders, and a webhook must never fail
// because of a missing SMTP password.

export interface MailMessage {
  to:      string;
  subject: string;
  text:    string;
  html:    string;
}

interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/**
 * Read the SMTP configuration from the environment. Returns null when any
 * required value is missing, which is the signal to skip sending.
 *
 * Read on every call rather than cached at module load, so a config fix takes
 * effect on the next request instead of the next deploy.
 */
export function mailConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): MailConfig | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  const from = env.MAIL_FROM?.trim() || (user ? `MSK Scripts <${user}>` : '');
  const port = Number(env.SMTP_PORT ?? 465);

  if (!host || !user || !pass || !from || !Number.isFinite(port) || port <= 0) return null;
  return { host, port, user, pass, from };
}

/**
 * Make a value safe to write into a log line.
 *
 * A recipient address reaches this module from the withdrawal, cancellation and
 * report forms, which anyone can submit without signing in. A value carrying CR
 * or LF can forge additional log entries, and a very long one pushes real
 * entries out of view.
 *
 * The three forms do validate the address before it gets here (`lib/legalForms.ts`
 * collapses whitespace and then rejects anything that is not `user@host.tld`), so
 * this is not exploitable today. The guarantee would live three files away in
 * whichever validator a caller happened to use, though, and `sendMail` is a
 * shared helper whose next caller may not validate at all. The check belongs
 * where the value is written.
 *
 * Allow-list rather than block-list: printable ASCII plus everything from U+00A0
 * up, which keeps umlauts and every other real name intact while dropping the C0
 * controls, DEL and the C1 range. Written as a range so no literal control
 * character appears in the pattern.
 *
 * The two line-break replacements in front of it are redundant against that
 * range and stay anyway. CodeQL does not read a negated character class as a
 * sanitizer, it re-raised the same finding after the first attempt, and it is
 * right to be strict: the line break is the actual attack, and a reader should
 * see it handled by name rather than have to work out which code points a range
 * happens to exclude.
 */
function forLog(value: string): string {
  return String(value ?? '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/[^ -~\u00A0-\uFFFF]/g, '?')
    .slice(0, 120);
}

let transporter: Transporter | null = null;
let transporterKey = '';

function getTransporter(cfg: MailConfig): Transporter {
  // Rebuild when the configuration changed; otherwise reuse the pooled
  // connection instead of opening a TCP/TLS session per mail.
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host:   cfg.host,
      port:   cfg.port,
      secure: cfg.port === 465, // implicit TLS on 465, STARTTLS otherwise
      auth:   { user: cfg.user, pass: cfg.pass },
    });
    transporterKey = key;
  }
  return transporter;
}

/**
 * Send one mail. Returns true when it was handed to the SMTP server, false when
 * mail is not configured. Throws only on an actual send failure, so a caller can
 * tell "not configured" (fine, skip) apart from "server said no" (retry).
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const cfg = mailConfigFromEnv();
  if (!cfg) {
    console.warn('[mail] SMTP is not configured, skipping mail to', forLog(message.to));
    return false;
  }

  await getTransporter(cfg).sendMail({
    from:    cfg.from,
    to:      message.to,
    subject: message.subject,
    text:    message.text,
    html:    message.html,
  });
  return true;
}

import { describe, it, expect } from 'vitest'

import { sendMail } from '@/lib/mail'

// CodeQL alert 73 (js/log-injection, reported on 02.09.2026 on lib/mail.ts:76).
//
// The recipient address reaches `sendMail` from the three mandatory forms that
// anyone can submit without logging in, and ended up unfiltered in the
// log line "SMTP is not configured, skipping mail to …". A value with CR or LF
// could have faked additional log lines there.
//
// It was not exploitable: `lib/legalForms.ts` collapses all whitespace
// and then only lets `user@host.tld` through. But that guarantee lived three
// files away in a validator that a future caller of
// `sendMail` does not have to use, so the filter now sits where
// the writing happens.
//
// What is checked is the path through `sendMail`, not the filter itself: what
// matters is what really ends up in the log.

const NL = String.fromCharCode(10)
const CR = String.fromCharCode(13)

/** Runs `sendMail` into the "not configured" branch and captures the log line. */
async function capture(to: string): Promise<string> {
  const savedEnv = { ...process.env }
  for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']) {
    delete process.env[key]
  }

  const lines: string[] = []
  const original = console.warn
  console.warn = (...args: unknown[]) => { lines.push(args.map(String).join(' ')) }

  try {
    const sent = await sendMail({ to, subject: 's', text: 't', html: '<p>t</p>' })
    // Without configuration nothing may be sent; otherwise the test measures
    // the wrong branch and would send mails with real credentials.
    expect(sent).toBe(false)
  } finally {
    console.warn = original
    Object.assign(process.env, savedEnv)
  }

  return lines.join(NL)
}

describe('sendMail: Logzeile bei fehlender SMTP-Konfiguration', () => {
  it('meldet die uebersprungene Mail samt Adresse', async () => {
    const line = await capture('max@example.com')
    expect(line).toContain('SMTP is not configured')
    expect(line).toContain('max@example.com')
  })

  it('laesst keinen Zeilenumbruch in die Logzeile', async () => {
    // What is checked is the effect, not the replacement character: what matters
    // is that one message does not turn into two. What the line break is replaced
    // with is up to the implementation and may change.
    const line = await capture(`a@b.de${NL}2026-09-02 [mail] gefaelschte Zeile`)
    expect(line.split(NL)).toHaveLength(1)
    expect(line).not.toContain(NL)
  })

  it('faengt auch einen Wagenruecklauf ab', async () => {
    const line = await capture(`a@b.de${CR}${CR}gefaelscht`)
    expect(line).not.toContain(CR)
  })

  it('ersetzt uebrige Steuerzeichen', async () => {
    // Escape and null byte are not line breaks, but they belong in a log line
    // just as little: ANSI sequences can rewrite the output of a
    // terminal.
    const line = await capture(`a@b.de${String.fromCharCode(27)}[2Kgefaelscht`)
    expect(line).not.toContain(String.fromCharCode(27))
    expect(line).toContain('?')
  })

  it('deckelt die Laenge', async () => {
    // A very long value pushes real entries out of view.
    const line = await capture('x'.repeat(500) + '@example.com')
    expect(line.length).toBeLessThan(200)
  })

  it('laesst Umlaute stehen', async () => {
    // The filter is an allowlist. If it were limited to ASCII, it would
    // make every German address unreadable, and the log line would lose
    // exactly the purpose it is there for.
    const line = await capture('björn@müller.de')
    expect(line).toContain('björn@müller.de')
  })
})

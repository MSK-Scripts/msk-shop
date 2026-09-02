import { describe, it, expect } from 'vitest'

import { sendMail } from '@/lib/mail'

// CodeQL-Alert 73 (js/log-injection, gemeldet am 02.09.2026 auf lib/mail.ts:76).
//
// Die Empfaengeradresse erreicht `sendMail` aus den drei Pflichtformularen, die
// jede Person ohne Anmeldung absenden kann, und landete ungefiltert in der
// Logzeile "SMTP is not configured, skipping mail to …". Ein Wert mit CR oder LF
// haette dort zusaetzliche Logzeilen vortaeuschen koennen.
//
// Ausnutzbar war es nicht: `lib/legalForms.ts` faltet jeden Leerraum zusammen
// und laesst danach nur `user@host.tld` durch. Die Zusicherung lag aber drei
// Dateien entfernt in einem Validator, den ein kuenftiger Aufrufer von
// `sendMail` nicht benutzen muss — deshalb sitzt der Filter jetzt dort, wo
// geschrieben wird.
//
// Geprueft wird der Weg durch `sendMail`, nicht der Filter selbst: interessant
// ist, was am Ende wirklich im Log steht.

const NL = String.fromCharCode(10)
const CR = String.fromCharCode(13)

/** Laesst `sendMail` in den "nicht konfiguriert"-Zweig laufen und faengt die Logzeile ab. */
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
    // Ohne Konfiguration darf nichts verschickt werden — sonst misst der Test
    // den falschen Zweig und wuerde bei echten Zugangsdaten Mails versenden.
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
    const line = await capture(`a@b.de${NL}2026-09-02 [mail] gefaelschte Zeile`)
    expect(line.split(NL)).toHaveLength(1)
    expect(line).toContain('?')
  })

  it('faengt auch einen Wagenruecklauf ab', async () => {
    const line = await capture(`a@b.de${CR}${CR}gefaelscht`)
    expect(line).not.toContain(CR)
  })

  it('deckelt die Laenge', async () => {
    // Ein sehr langer Wert schiebt echte Eintraege aus dem Blickfeld.
    const line = await capture('x'.repeat(500) + '@example.com')
    expect(line.length).toBeLessThan(200)
  })

  it('laesst Umlaute stehen', async () => {
    // Der Filter ist eine Allowlist. Waere sie auf ASCII beschraenkt, wuerde
    // sie jede deutsche Adresse unlesbar machen, und die Logzeile verlore
    // genau den Zweck, fuer den sie da ist.
    const line = await capture('björn@müller.de')
    expect(line).toContain('björn@müller.de')
  })
})

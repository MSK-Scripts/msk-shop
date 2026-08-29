import { describe, it, expect } from 'vitest'
import { parseEnv, setEnvValues, unquote, quote } from '@/lib/botEnv'

// A faithful slice of the bot's own .env.example: the comment blocks above the
// keys ARE the documentation the customer reads, so preserving them is the whole
// point of patching line by line instead of re-serialising an object.
const SAMPLE = `# Discord Ticket Bot
# Copy this file to .env and fill in your values

# To use an external database instead, set DATABASE_URL to one of:
#   MySQL/MariaDB:  mysql://HOST:PORT/ticketbot
# DATABASE_URL=""

# Your Discord bot token (from https://discord.com/developers/applications)
TOKEN="OLD_TOKEN"

# Your Discord application/client ID
CLIENT_ID="123456789012345678"

# Off by default. The dashboard can restart the bot and edit this .env.
DASHBOARD_ENABLED="false"
DASHBOARD_PORT="3010"

# The URL your browser uses.
DASHBOARD_PUBLIC_URL="http://127.0.0.1:3010"
`

describe('parseEnv', () => {
  it('reads defined keys and unquotes them', () => {
    const env = parseEnv(SAMPLE)
    expect(env.TOKEN).toBe('OLD_TOKEN')
    expect(env.CLIENT_ID).toBe('123456789012345678')
    expect(env.DASHBOARD_PUBLIC_URL).toBe('http://127.0.0.1:3010')
  })

  it('ignores commented-out keys', () => {
    expect(parseEnv(SAMPLE)).not.toHaveProperty('DATABASE_URL')
  })

  it('handles unquoted and single-quoted values and the export prefix', () => {
    const env = parseEnv(`A=plain\nB='single'\nexport C="double"\n`)
    expect(env).toEqual({ A: 'plain', B: 'single', C: 'double' })
  })
})

describe('setEnvValues', () => {
  it('rewrites an existing key in place and leaves everything else byte-identical', () => {
    const out = setEnvValues(SAMPLE, { TOKEN: 'NEW_TOKEN' })

    expect(parseEnv(out).TOKEN).toBe('NEW_TOKEN')
    // Exactly one line differs.
    const before = SAMPLE.split('\n')
    const after  = out.split('\n')
    expect(after).toHaveLength(before.length)
    const diff = before.map((l, i) => (l === after[i] ? null : i)).filter(i => i !== null)
    expect(diff).toHaveLength(1)
    expect(after[diff[0]!]).toBe('TOKEN="NEW_TOKEN"')
  })

  it('keeps every comment line', () => {
    const out = setEnvValues(SAMPLE, { DASHBOARD_PUBLIC_URL: 'https://tickets-aabbccddeeff.msk-scripts.de' })
    expect(out).toContain('# The URL your browser uses.')
    expect(out).toContain('# Your Discord bot token (from https://discord.com/developers/applications)')
  })

  // Un-commenting the example line would change what the comment block above it
  // means; appending is the honest edit.
  it('appends a key that only exists as a commented example instead of reviving it', () => {
    const out = setEnvValues(SAMPLE, { DATABASE_URL: 'mysql://db.example/tickets' })
    expect(out).toContain('# DATABASE_URL=""')
    expect(parseEnv(out).DATABASE_URL).toBe('mysql://db.example/tickets')
    expect(out).toContain('# ── Added by the MSK hosting dashboard')
  })

  it('treats undefined as "leave alone" so untouched secret fields can be passed through', () => {
    const out = setEnvValues(SAMPLE, { TOKEN: undefined, CLIENT_ID: '999' })
    expect(parseEnv(out).TOKEN).toBe('OLD_TOKEN')
    expect(parseEnv(out).CLIENT_ID).toBe('999')
  })

  it('returns the text untouched when there is nothing to do', () => {
    expect(setEnvValues(SAMPLE, {})).toBe(SAMPLE)
    expect(setEnvValues(SAMPLE, { TOKEN: undefined })).toBe(SAMPLE)
  })

  it('rejects a key that is not a valid env name', () => {
    expect(() => setEnvValues(SAMPLE, { 'TOKEN\nEVIL': 'x' })).toThrow(/Invalid env key/)
  })

  it('only touches the first matching key line, not a lookalike inside a comment', () => {
    const src = '# TOKEN="documented"\nTOKEN="real"\n'
    const out = setEnvValues(src, { TOKEN: 'new' })
    expect(out).toBe('# TOKEN="documented"\nTOKEN="new"\n')
  })
})

describe('quoting', () => {
  // A value that breaks out of its quotes would silently change other keys, or
  // make the bot fail to start with a parse error nobody can attribute.
  it('survives a round trip through characters dotenv treats as syntax', () => {
    for (const value of ['a b', 'quote"inside', 'back\\slash', 'hash#comment', 'new\nline', "single'quote", '']) {
      expect(unquote(quote(value))).toBe(value)
    }
  })

  it('cannot be escaped out of via an embedded quote', () => {
    const out = setEnvValues('CLIENT_SECRET="x"\n', { CLIENT_SECRET: '"\nTOKEN="stolen' })
    expect(parseEnv(out).TOKEN).toBeUndefined()
    expect(parseEnv(out).CLIENT_SECRET).toBe('"\nTOKEN="stolen')
  })
})

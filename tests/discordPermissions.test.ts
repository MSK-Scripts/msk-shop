import { describe, it, expect } from 'vitest';
import { canManageGuild, ADMINISTRATOR, MANAGE_GUILD } from '@/lib/discordPermissions';

// Real bitfields, shaped like the ones GET /users/@me/guilds returns.
const VIEW_CHANNEL   = BigInt(0x400);
const SEND_MESSAGES  = BigInt(0x800);
const bits = (...v: bigint[]) => v.reduce((a, b) => a | b, BigInt(0)).toString();

describe('canManageGuild', () => {
  it('lets the owner through regardless of the bitfield', () => {
    expect(canManageGuild('0', true)).toBe(true);
    expect(canManageGuild(bits(VIEW_CHANNEL), true)).toBe(true);
  });

  it('accepts ADMINISTRATOR', () => {
    expect(canManageGuild(bits(ADMINISTRATOR), false)).toBe(true);
  });

  // The case reported on 2026-09-03: Manage Server without Administrator.
  // If this test fails, that customer is locked out of the dashboard again.
  it('accepts MANAGE_GUILD without ADMINISTRATOR', () => {
    expect(canManageGuild(bits(MANAGE_GUILD), false)).toBe(true);
    expect(canManageGuild(bits(MANAGE_GUILD, VIEW_CHANNEL, SEND_MESSAGES), false)).toBe(true);
  });

  it('rejects a member with neither bit', () => {
    expect(canManageGuild(bits(VIEW_CHANNEL, SEND_MESSAGES), false)).toBe(false);
    expect(canManageGuild('0', false)).toBe(false);
  });

  it('rejects an unreadable bitfield instead of granting access', () => {
    for (const bad of ['', 'abc', 'null', '1.5']) {
      expect(canManageGuild(bad, false)).toBe(false);
    }
  });

  it('handles bitfields beyond Number.MAX_SAFE_INTEGER', () => {
    // Discord hands out bits beyond 2^53 these days, hence BigInt.
    const high = BigInt('1') << BigInt(60);
    expect(canManageGuild((high | MANAGE_GUILD).toString(), false)).toBe(true);
    expect(canManageGuild(high.toString(), false)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateConfig — semantic validation mirrored from the bot
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors discord_ticketbot/src/config.js → validateConfig() so that a dashboard
// save can never write a config that makes the bot exit(1) on the next restart.
// Used in two places:
//   • client (inline): errors highlight fields and block Save; warnings are shown
//     but do not block.
//   • server (PUT /api/bot-config): errors → 400. Hard backstop so even a raw
//     file-mode save cannot ship a bot-crashing config.
//
// IMPORTANT: the bot repo is separate. When src/config.js changes its rules,
// update this mirror too — the "bot boot test" in the plan surfaces any drift.

import type { Lang } from '@/lib/i18n';
import type { JSONPath } from './jsoncEdit';

export interface SemanticIssue {
  path?: JSONPath;
  message: Record<Lang, string>;
  severity: 'error' | 'warn';
}

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Enum whitelists (defense-in-depth for the raw file mode). Violations are
// reported as warnings — the bot itself does not exit on these, so we must not
// be stricter than the bot and block an otherwise-valid save.
const ENUMS = {
  priority:          ['low', 'medium', 'high', 'urgent'],
  interactionType:   ['BUTTON', 'SELECT_MENU'],
  whoCanClose:       ['EVERYONE', 'STAFFONLY'],
  whoCanReopen:      ['EVERYONE', 'STAFFONLY'],
  statusType:        ['PLAYING', 'WATCHING', 'LISTENING', 'STREAMING', 'COMPETING'],
  statusPresence:    ['online', 'idle', 'dnd', 'invisible'],
  questionStyle:     ['SHORT', 'PARAGRAPH'],
} as const;

function err(message: Record<Lang, string>, path?: JSONPath): SemanticIssue {
  return { severity: 'error', message, path };
}
function warn(message: Record<Lang, string>, path?: JSONPath): SemanticIssue {
  return { severity: 'warn', message, path };
}

function enumWarn(
  value: unknown, allowed: readonly string[], path: JSONPath, field: string,
): SemanticIssue | null {
  if (value === undefined || value === null || value === '') return null;
  if (isStr(value) && allowed.includes(value)) return null;
  return warn({
    en: `"${field}" should be one of: ${allowed.join(', ')}.`,
    de: `"${field}" sollte einer von: ${allowed.join(', ')} sein.`,
  }, path);
}

/**
 * Validate a parsed config.jsonc model. Returns all issues (errors + warnings).
 * `error`-severity issues mean the bot would refuse to start.
 */
export function validateBotConfig(model: unknown): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  if (!isObj(model)) {
    return [err({
      en: 'Configuration must be a JSON object.',
      de: 'Die Konfiguration muss ein JSON-Objekt sein.',
    })];
  }

  // ── Required fields (mirrors the `required` table) ─────────────────────────
  const required: [string, 'string' | 'array' | 'object'][] = [
    ['openTicketChannelId', 'string'],
    ['ticketTypes', 'array'],
    ['rolesWhoHaveAccessToTheTickets', 'array'],
    ['closeOption', 'object'],
    ['mainColor', 'string'],
  ];
  for (const [key, type] of required) {
    const val = model[key];
    const actual = Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val;
    if (val === undefined || val === null) {
      issues.push(err({
        en: `Missing required field: "${key}".`,
        de: `Pflichtfeld fehlt: "${key}".`,
      }, [key]));
    } else if (actual !== type) {
      issues.push(err({
        en: `Field "${key}" must be a ${type}, got ${actual}.`,
        de: `Feld "${key}" muss ein ${type} sein, ist aber ${actual}.`,
      }, [key]));
    } else if (type === 'string' && (val as string).trim() === '') {
      issues.push(err({
        en: `Field "${key}" is empty — please set a value.`,
        de: `Feld "${key}" ist leer — bitte einen Wert setzen.`,
      }, [key]));
    }
  }

  // ── mainColor must be a hex color ──────────────────────────────────────────
  const mainColor = model.mainColor;
  if (isStr(mainColor) && mainColor.trim() !== '' && !HEX_RE.test(mainColor.trim())) {
    issues.push(err({
      en: `"mainColor" must be a hex color like "#2ee676", got "${mainColor}".`,
      de: `"mainColor" muss eine Hex-Farbe wie "#2ee676" sein, ist aber "${mainColor}".`,
    }, ['mainColor']));
  }

  // ── ticketTypes ────────────────────────────────────────────────────────────
  const types = model.ticketTypes;
  if (Array.isArray(types)) {
    if (types.length === 0) {
      issues.push(err({
        en: 'ticketTypes must contain at least one entry.',
        de: 'ticketTypes muss mindestens einen Eintrag enthalten.',
      }, ['ticketTypes']));
    }
    if (types.length > 25) {
      issues.push(err({
        en: 'ticketTypes cannot have more than 25 entries (Discord limit).',
        de: 'ticketTypes darf höchstens 25 Einträge haben (Discord-Limit).',
      }, ['ticketTypes']));
    }
    types.forEach((t: unknown, i: number) => {
      const tt = isObj(t) ? t : {};
      if (!tt.codeName)   issues.push(err({ en: `ticketTypes[${i}] is missing "codeName".`,   de: `ticketTypes[${i}] fehlt "codeName".` },   ['ticketTypes', i, 'codeName']));
      if (!tt.name)       issues.push(err({ en: `ticketTypes[${i}] is missing "name".`,       de: `ticketTypes[${i}] fehlt "name".` },       ['ticketTypes', i, 'name']));
      if (!tt.categoryId) issues.push(err({ en: `ticketTypes[${i}] is missing "categoryId".`, de: `ticketTypes[${i}] fehlt "categoryId".` }, ['ticketTypes', i, 'categoryId']));
      if (tt.staffRoles !== undefined && !Array.isArray(tt.staffRoles)) {
        issues.push(err({ en: `ticketTypes[${i}].staffRoles must be an array.`, de: `ticketTypes[${i}].staffRoles muss ein Array sein.` }, ['ticketTypes', i, 'staffRoles']));
      }
      const es = enumWarn(tt.priority, ENUMS.priority, ['ticketTypes', i, 'priority'], `ticketTypes[${i}].priority`);
      if (es) issues.push(es);
      if (Array.isArray(tt.questions)) {
        (tt.questions as unknown[]).forEach((q, qi) => {
          const qq = isObj(q) ? q : {};
          const qs = enumWarn(qq.style, ENUMS.questionStyle, ['ticketTypes', i, 'questions', qi, 'style'], `question style`);
          if (qs) issues.push(qs);
        });
      }
    });
  }

  // ── Enum warnings on the option objects ────────────────────────────────────
  const panel = isObj(model.panel) ? model.panel : {};
  const it = enumWarn(panel.interactionType, ENUMS.interactionType, ['panel', 'interactionType'], 'panel.interactionType');
  if (it) issues.push(it);

  const closeOption = isObj(model.closeOption) ? model.closeOption : {};
  const wc = enumWarn(closeOption.whoCanCloseTicket, ENUMS.whoCanClose, ['closeOption', 'whoCanCloseTicket'], 'closeOption.whoCanCloseTicket');
  if (wc) issues.push(wc);

  const reopenOption = isObj(model.reopenOption) ? model.reopenOption : {};
  const wr = enumWarn(reopenOption.whoCanReopen, ENUMS.whoCanReopen, ['reopenOption', 'whoCanReopen'], 'reopenOption.whoCanReopen');
  if (wr) issues.push(wr);

  const status = isObj(model.status) ? model.status : {};
  const st = enumWarn(status.type, ENUMS.statusType, ['status', 'type'], 'status.type');
  if (st) issues.push(st);
  const sp = enumWarn(status.status, ENUMS.statusPresence, ['status', 'status'], 'status.status');
  if (sp) issues.push(sp);

  return issues;
}

const PLACEHOLDER_RE = /^YOUR_.*_HERE$/;
const isUnset = (v: string | undefined) => !v || v.trim() === '' || PLACEHOLDER_RE.test(v.trim());

/**
 * Validate the .env values. All issues are warnings: the dashboard must never
 * lock a user out of saving their .env, but it surfaces missing credentials.
 */
export function validateBotEnv(env: Map<string, string>): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  for (const key of ['TOKEN', 'CLIENT_ID', 'GUILD_ID'] as const) {
    if (isUnset(env.get(key))) {
      issues.push(warn({
        en: `${key} is not set — the bot will not start without it.`,
        de: `${key} ist nicht gesetzt — der Bot startet ohne diesen Wert nicht.`,
      }));
    }
  }
  if (isUnset(env.get('MSK_API_KEY'))) {
    issues.push(warn({
      en: 'MSK_API_KEY is not set — transcripts will be sent as file attachments instead of links.',
      de: 'MSK_API_KEY ist nicht gesetzt — Transcripts werden als Datei-Anhang statt als Link versendet.',
    }));
  }
  return issues;
}

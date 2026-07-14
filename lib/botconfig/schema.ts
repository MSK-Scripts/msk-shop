// ─────────────────────────────────────────────────────────────────────────────
// schema — declarative description of the bot config form
// ─────────────────────────────────────────────────────────────────────────────
// CONFIG_SCHEMA drives the generic form renderer for config.jsonc. Each field
// carries its JSONPath, an input kind, a bilingual label and (mostly) a help
// text lifted from the comments in config.example.jsonc. The "Ticket Types"
// section is a composite rendered by TicketTypesEditor; snippets.jsonc is its
// own composite (SnippetsEditor) and .env is driven by ENV_SCHEMA.

import type { Lang } from '@/lib/i18n';
import type { JSONPath } from './jsoncEdit';

export type FieldKind =
  | 'toggle' | 'text' | 'number' | 'select' | 'color' | 'emoji' | 'idList' | 'textarea';
export type IdKind = 'role' | 'channel' | 'category';

export interface SelectOption { value: string; label: Record<Lang, string> }

export interface FieldDef {
  path: JSONPath;
  kind: FieldKind;
  label: Record<Lang, string>;
  help?: Record<Lang, string>;
  options?: SelectOption[];
  min?: number;
  max?: number;
  idKind?: IdKind;
}

export interface Section {
  id: string;
  title: Record<Lang, string>;
  fields: FieldDef[];
  /** When set, ConfigForm renders a hand-built composite editor for this section. */
  composite?: 'ticketTypes';
}

// Small helpers to keep the schema readable.
const L = (en: string, de: string): Record<Lang, string> => ({ en, de });
const opt = (value: string, en: string, de: string): SelectOption => ({ value, label: { en, de } });

// ── Reusable option sets ─────────────────────────────────────────────────────
export const PRIORITY_OPTIONS: SelectOption[] = [
  opt('low', 'Low', 'Niedrig'),
  opt('medium', 'Medium', 'Mittel'),
  opt('high', 'High', 'Hoch'),
  opt('urgent', 'Urgent', 'Dringend'),
];
export const QUESTION_STYLE_OPTIONS: SelectOption[] = [
  opt('SHORT', 'Short (single line)', 'Kurz (einzeilig)'),
  opt('PARAGRAPH', 'Paragraph (multi-line)', 'Absatz (mehrzeilig)'),
];
const WHO_OPTIONS: SelectOption[] = [
  opt('EVERYONE', 'Everyone', 'Jeder'),
  opt('STAFFONLY', 'Staff only', 'Nur Team'),
];

// ── config.jsonc ─────────────────────────────────────────────────────────────
export const CONFIG_SCHEMA: Section[] = [
  {
    id: 'appearance',
    title: L('Startup & Appearance', 'Start & Erscheinungsbild'),
    fields: [
      { path: ['showLog'], kind: 'toggle', label: L('Show info logs', 'Info-Logs anzeigen'),
        help: L('Show INFO log messages on startup (commands, events, components).',
                'INFO-Log-Meldungen beim Start anzeigen (Commands, Events, Components).') },
      { path: ['mainColor'], kind: 'color', label: L('Main color', 'Hauptfarbe'),
        help: L('Embed main color and accent of the modern HTML transcript.',
                'Haupt-Embed-Farbe und Akzent des modernen HTML-Transcripts.') },
      { path: ['lang'], kind: 'select', label: L('Bot language', 'Bot-Sprache'),
        options: [opt('en', 'English', 'Englisch'), opt('de', 'German', 'Deutsch')] },
      { path: ['transcriptDesign'], kind: 'select', label: L('Transcript design', 'Transcript-Design'),
        options: [opt('modern', 'Modern (MSK)', 'Modern (MSK)'), opt('classic', 'Classic (Discord)', 'Klassisch (Discord)')],
        help: L('HTML transcript style.', 'HTML-Transcript-Stil.') },
      { path: ['transcriptLang'], kind: 'select', label: L('Transcript language', 'Transcript-Sprache'),
        options: [opt('en', 'English', 'Englisch'), opt('de', 'German', 'Deutsch'), opt('hu', 'Hungarian', 'Ungarisch')],
        help: L('Language of the HTML transcript (falls back to English).',
                'Sprache des HTML-Transcripts (Fallback Englisch).') },
    ],
  },
  {
    id: 'panel',
    title: L('Ticket Panel', 'Ticket-Panel'),
    fields: [
      { path: ['openTicketChannelId'], kind: 'text', idKind: 'channel',
        label: L('Panel channel ID', 'Panel-Kanal-ID'),
        help: L('Channel where /setup posts the ticket panel.', 'Kanal, in den /setup das Panel sendet.') },
      { path: ['panel', 'interactionType'], kind: 'select', label: L('Interaction type', 'Interaktionstyp'),
        options: [opt('BUTTON', 'Button → select menu', 'Button → Auswahlmenü'),
                  opt('SELECT_MENU', 'Select menu directly', 'Auswahlmenü direkt')] },
      { path: ['panel', 'autoUpdateOnStart'], kind: 'toggle', label: L('Auto-refresh panel on start', 'Panel beim Start aktualisieren'),
        help: L('Refresh the existing /setup panel on every bot start (picks up embed/text changes).',
                'Das bestehende /setup-Panel bei jedem Start aktualisieren (übernimmt Embed-/Text-Änderungen).') },
      { path: ['panel', 'logo', 'enabled'], kind: 'toggle', label: L('Show logo', 'Logo anzeigen') },
      { path: ['panel', 'logo', 'file'], kind: 'text', label: L('Logo file', 'Logo-Datei'),
        help: L('Filename inside the assets/ folder.', 'Dateiname im assets/-Ordner.') },
      { path: ['panel', 'banner', 'enabled'], kind: 'toggle', label: L('Show banner', 'Banner anzeigen') },
      { path: ['panel', 'banner', 'file'], kind: 'text', label: L('Banner file', 'Banner-Datei'),
        help: L('Filename inside the assets/ folder.', 'Dateiname im assets/-Ordner.') },
    ],
  },
  {
    id: 'ticketTypes',
    title: L('Ticket Types', 'Ticket-Typen'),
    composite: 'ticketTypes',
    fields: [
      { path: ['ticketNameOption'], kind: 'text', label: L('Default channel name template', 'Standard-Kanalname-Vorlage'),
        help: L('Placeholders: USERNAME, USERID, TICKETCOUNT.', 'Platzhalter: USERNAME, USERID, TICKETCOUNT.') },
    ],
  },
  {
    id: 'claim',
    title: L('Claim Options', 'Claim-Optionen'),
    fields: [
      { path: ['claimOption', 'claimButton'], kind: 'toggle', label: L('Show claim button', 'Claim-Button anzeigen') },
      { path: ['claimOption', 'nameWhenClaimed'], kind: 'text', label: L('Name when claimed', 'Name bei Claim'),
        help: L('S_ = staff, U_ = user (USERNAME, USERID, TICKETCOUNT).', 'S_ = Team, U_ = User (USERNAME, USERID, TICKETCOUNT).') },
      { path: ['claimOption', 'categoryWhenClaimed'], kind: 'text', idKind: 'category',
        label: L('Category when claimed', 'Kategorie bei Claim'),
        help: L('Category ID to move the ticket to when claimed, or empty.', 'Kategorie-ID, in die das Ticket bei Claim verschoben wird, oder leer.') },
    ],
  },
  {
    id: 'access',
    title: L('Access Control', 'Zugriffsrechte'),
    fields: [
      { path: ['rolesWhoHaveAccessToTheTickets'], kind: 'idList', idKind: 'role',
        label: L('Staff roles (global)', 'Team-Rollen (global)'),
        help: L('Roles with access to all tickets (fallback when a type has no staffRoles).',
                'Rollen mit Zugriff auf alle Tickets (Fallback, wenn ein Typ keine staffRoles hat).') },
      { path: ['rolesWhoCanNotCreateTickets'], kind: 'idList', idKind: 'role',
        label: L('Roles blocked from creating tickets', 'Rollen ohne Ticket-Erstellung') },
    ],
  },
  {
    id: 'ping',
    title: L('Ping on Open', 'Ping beim Öffnen'),
    fields: [
      { path: ['pingRoleWhenOpened'], kind: 'toggle', label: L('Ping staff on new ticket', 'Team bei neuem Ticket pingen') },
      { path: ['roleToPingWhenOpenedId'], kind: 'idList', idKind: 'role', label: L('Roles to ping', 'Zu pingende Rollen') },
    ],
  },
  {
    id: 'logging',
    title: L('Logging', 'Logging'),
    fields: [
      { path: ['logs'], kind: 'toggle', label: L('Enable close logs', 'Close-Logs aktivieren') },
      { path: ['logsChannelId'], kind: 'text', idKind: 'channel', label: L('Log channel ID', 'Log-Kanal-ID') },
    ],
  },
  {
    id: 'close',
    title: L('Close Options', 'Schließen'),
    fields: [
      { path: ['closeOption', 'closeButton'], kind: 'toggle', label: L('Show close button', 'Close-Button anzeigen') },
      { path: ['closeOption', 'dmUser'], kind: 'toggle', label: L('DM user on close', 'User bei Close anschreiben') },
      { path: ['closeOption', 'createTranscript'], kind: 'toggle', label: L('Create transcript', 'Transcript erstellen') },
      { path: ['closeOption', 'askReason'], kind: 'toggle', label: L('Ask for close reason', 'Nach Grund fragen') },
      { path: ['closeOption', 'whoCanCloseTicket'], kind: 'select', label: L('Who can close', 'Wer darf schließen'), options: WHO_OPTIONS },
      { path: ['closeOption', 'closeTicketCategoryId'], kind: 'text', idKind: 'category',
        label: L('Closed-tickets category', 'Kategorie für geschlossene Tickets'),
        help: L('Category ID to move closed tickets to, or empty to not move.', 'Kategorie-ID für geschlossene Tickets, oder leer.') },
    ],
  },
  {
    id: 'reopen',
    title: L('Reopen Options', 'Wiedereröffnen'),
    fields: [
      { path: ['reopenOption', 'enabled'], kind: 'toggle', label: L('Allow reopening', 'Wiedereröffnen erlauben') },
      { path: ['reopenOption', 'button'], kind: 'toggle', label: L('Show reopen button', 'Reopen-Button anzeigen') },
      { path: ['reopenOption', 'whoCanReopen'], kind: 'select', label: L('Who can reopen', 'Wer darf wiedereröffnen'), options: WHO_OPTIONS },
    ],
  },
  {
    id: 'rating',
    title: L('Rating System', 'Bewertung'),
    fields: [
      { path: ['ratingSystem', 'enabled'], kind: 'toggle', label: L('Ask for rating after close', 'Nach Close um Bewertung bitten') },
      { path: ['ratingSystem', 'dmUser'], kind: 'toggle', label: L('Send rating request via DM', 'Bewertungs-Anfrage per DM') },
      { path: ['ratingSystem', 'ratingsChannelId'], kind: 'text', idKind: 'channel', label: L('Ratings channel ID', 'Bewertungs-Kanal-ID') },
    ],
  },
  {
    id: 'staffReminder',
    title: L('Staff Reminder', 'Staff-Erinnerung'),
    fields: [
      { path: ['staffReminder', 'enabled'], kind: 'toggle', label: L('Enable staff reminder', 'Staff-Erinnerung aktivieren') },
      { path: ['staffReminder', 'afterHours'], kind: 'number', min: 1, label: L('After hours without reply', 'Nach Stunden ohne Antwort') },
      { path: ['staffReminder', 'pingRoles'], kind: 'toggle', label: L('Mention staff roles', 'Team-Rollen erwähnen') },
    ],
  },
  {
    id: 'autoClose',
    title: L('Auto-Close', 'Auto-Close'),
    fields: [
      { path: ['autoClose', 'enabled'], kind: 'toggle', label: L('Enable auto-close', 'Auto-Close aktivieren') },
      { path: ['autoClose', 'inactiveHours'], kind: 'number', min: 1, label: L('Close after inactive hours', 'Schließen nach Stunden Inaktivität') },
      { path: ['autoClose', 'warnBeforeHours'], kind: 'number', min: 0, label: L('Warn hours before', 'Warnen Stunden vorher') },
      { path: ['autoClose', 'excludeClaimed'], kind: 'toggle', label: L('Exclude claimed tickets', 'Beanspruchte Tickets ausnehmen') },
    ],
  },
  {
    id: 'limits',
    title: L('Limits', 'Limits'),
    fields: [
      { path: ['maxTicketOpened'], kind: 'number', min: 0, label: L('Max open tickets per user', 'Max. offene Tickets pro User'),
        help: L('0 = unlimited.', '0 = unbegrenzt.') },
    ],
  },
  {
    id: 'status',
    title: L('Bot Status', 'Bot-Status'),
    fields: [
      { path: ['status', 'enabled'], kind: 'toggle', label: L('Set a presence', 'Presence setzen') },
      { path: ['status', 'dynamic'], kind: 'toggle', label: L('Dynamic text', 'Dynamischer Text'),
        help: L('Use the dynamic template with live ticket counts instead of the static text.',
                'Dynamische Vorlage mit Live-Ticket-Zahlen statt statischem Text verwenden.') },
      { path: ['status', 'dynamicText'], kind: 'text', label: L('Dynamic text template', 'Dynamische Text-Vorlage'),
        help: L('Placeholders: {open}, {total}, {closed}.', 'Platzhalter: {open}, {total}, {closed}.') },
      { path: ['status', 'dynamicInterval'], kind: 'number', min: 1, label: L('Update interval (min)', 'Aktualisierungs-Intervall (Min)') },
      { path: ['status', 'text'], kind: 'text', label: L('Static text', 'Statischer Text') },
      { path: ['status', 'type'], kind: 'select', label: L('Activity type', 'Aktivitätstyp'),
        options: ['PLAYING', 'WATCHING', 'LISTENING', 'STREAMING', 'COMPETING'].map(v => opt(v, v[0] + v.slice(1).toLowerCase(), v[0] + v.slice(1).toLowerCase())) },
      { path: ['status', 'url'], kind: 'text', label: L('Stream URL', 'Stream-URL'),
        help: L('Only used for the STREAMING type.', 'Nur für den STREAMING-Typ.') },
      { path: ['status', 'status'], kind: 'select', label: L('Presence', 'Presence'),
        options: [opt('online', 'Online', 'Online'), opt('idle', 'Idle', 'Abwesend'), opt('dnd', 'Do not disturb', 'Bitte nicht stören'), opt('invisible', 'Invisible', 'Unsichtbar')] },
    ],
  },
  {
    id: 'notifications',
    title: L('User Notifications', 'Benutzer-Benachrichtigungen'),
    fields: [
      { path: ['userNotifications', 'enabled'], kind: 'toggle', label: L('Show "Notify me" button', '"Notify me"-Button anzeigen'),
        help: L('Users opt in to a DM when staff first replies (max 1 DM / 30 min).',
                'User abonnieren eine DM bei der ersten Team-Antwort (max. 1 DM / 30 Min).') },
    ],
  },
];

// ── Default literals for new array items ─────────────────────────────────────
export const DEFAULT_QUESTION = {
  label: '',
  placeholder: '',
  style: 'SHORT',
  maxLength: 100,
};

export const DEFAULT_TICKET_TYPE = {
  codeName: '',
  name: '',
  description: '',
  emoji: '',
  color: '',
  categoryId: '',
  priority: 'medium',
  ticketNameOption: '',
  customDescription: '',
  cantAccess: [] as string[],
  staffRoles: [] as string[],
  askQuestions: false,
  questions: [] as (typeof DEFAULT_QUESTION)[],
};

export const DEFAULT_SNIPPET = {
  name: '',
  description: '',
  content: '',
  embed: null as null | { title: string; color: string },
};

// ── .env ─────────────────────────────────────────────────────────────────────
export interface EnvFieldDef {
  key: string;
  label: Record<Lang, string>;
  help: Record<Lang, string>;
  secret?: boolean;
  optional?: boolean;
}

export const ENV_SCHEMA: EnvFieldDef[] = [
  { key: 'TOKEN', secret: true, label: L('Bot token', 'Bot-Token'),
    help: L('Discord bot token from the developer portal.', 'Discord-Bot-Token aus dem Developer-Portal.') },
  { key: 'CLIENT_ID', label: L('Application / Client ID', 'Application-/Client-ID'),
    help: L('Your Discord application ID.', 'Deine Discord-Application-ID.') },
  { key: 'GUILD_ID', label: L('Server (guild) ID', 'Server-(Guild-)ID'),
    help: L('The Discord server the commands are registered to.', 'Der Discord-Server, für den die Commands registriert werden.') },
  { key: 'MSK_API_KEY', secret: true, label: L('MSK API key', 'MSK-API-Key'),
    help: L('Enables transcript links. Without it transcripts are sent as file attachments.',
            'Schaltet Transcript-Links frei. Ohne ihn werden Transcripts als Datei-Anhang versendet.') },
  { key: 'MSK_API_URL', label: L('MSK API URL', 'MSK-API-URL'),
    help: L('Base URL of the MSK API. Do not change unless self-hosting the website.',
            'Basis-URL der MSK-API. Nur ändern, wenn du die Website selbst hostest.') },
  { key: 'DATABASE_URL', secret: true, optional: true, label: L('Database URL', 'Datenbank-URL'),
    help: L('Optional. Empty = bundled SQLite. Otherwise mysql:// or postgres:// (append ?ssl=true for TLS).',
            'Optional. Leer = eingebautes SQLite. Sonst mysql:// oder postgres:// (?ssl=true für TLS).') },
];

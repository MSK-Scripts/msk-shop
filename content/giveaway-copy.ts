import type { Lang } from '@/lib/i18n'
import type { LabelledText } from '@/content/ticketbot-copy'

/**
 * Sichtbare Texte der Giveaway-Bot-Landingpage, je Sprache.
 *
 * Gleiche Aufteilung wie `content/ticketbot-copy.ts`: Texte hier, Icons in
 * `components/bots/GiveawayLanding.tsx`, Reihenfolge ist Vertrag zwischen
 * beidem. `tests/botLandingCopy.test.ts` prüft, dass EN und DE gleich lang
 * bleiben.
 *
 * Die Slash-Befehle selbst (`/gcreate`, `/gsettings`, …) werden bewusst NICHT
 * übersetzt: Sie heißen im Bot in jeder Sprache gleich.
 */

export interface CommandRow {
  cmd:  string
  who:  string
  text: string
}

export interface GiveawayCopy {
  altHref:  string
  altLabel: string

  badge:      string
  headline:   { lead: string; accent: string; tail: string }
  heroText:   string
  highlights: string[]
  heroCtaInvite:  string
  heroCtaDocs:    string
  heroCtaDiscord: string

  stepsEyebrow: string
  stepsHeading: string
  stepsSub:     string
  steps:        LabelledText[]
  stepsCta:     string

  featuresEyebrow: string
  featuresHeading: string
  featuresSub:     string
  features:        LabelledText[]

  commandsEyebrow: string
  commandsHeading: string
  commandsSub:     string
  /** Rollen-Label je Befehl, positionsgleich zu COMMAND_NAMES in der Komponente. */
  commandWho:      string[]
  commandText:     string[]

  settingsEyebrow: string
  settingsHeading: string
  settingsIntroA:  string
  settingsIntroB:  string
  settingsCtaInvite: string
  settingsCtaSource: string
  settings:        LabelledText[]

  couponEyebrow: string
  couponHeading: string
  couponSubA:    string
  couponSubStrong: string
  couponSubB:    string
  coupons:       LabelledText[]
  couponNote:    string

  trustEyebrow: string
  trustHeading: string
  trust:        LabelledText[]

  ctaHeading: string
  ctaTextA:   string
  ctaTextB:   string
  ctaInvite:  string
  ctaDocs:    string
}

const en: GiveawayCopy = {
  altHref:  '/de/giveaway',
  altLabel: 'Diese Seite auf Deutsch',

  badge: 'Discord Giveaway Bot',
  headline: { lead: 'Discord', accent: 'Giveaway Bot', tail: ' that survives a restart' },
  heroText:
    'A free, multilingual giveaway bot for Discord, built on Discord.js v14 and configurable '
    + 'per server. Button entry, restart-safe scheduling, weighted bonus entries, eligibility '
    + 'rules, templates and pause/resume. Invite the official instance and create your first '
    + 'giveaway in seconds.',
  highlights: ['Free to invite', 'Restart-safe', 'Multilingual', 'Discord.js v14', 'No privileged intents'],
  heroCtaInvite:  'Invite the bot',
  heroCtaDocs:    'Documentation',
  heroCtaDiscord: 'Join Discord',

  stepsEyebrow: 'Get started',
  stepsHeading: 'Your first giveaway in three steps',
  stepsSub:     'No server, no database and no config files. Just invite the bot and go.',
  steps: [
    { title: 'Invite the bot', text: 'One click adds the official instance. No hosting, no setup.' },
    { title: 'Run /gcreate',   text: 'Fill in title, prizes, duration and number of winners in a modal.' },
    { title: 'Members join',   text: 'They click the button; winners are drawn automatically when the timer ends.' },
  ],
  stepsCta: 'Invite the bot',

  featuresEyebrow: 'Features',
  featuresHeading: 'More than a random draw',
  featuresSub:     'Everything a serious community needs to run fair, reliable giveaways.',
  features: [
    { title: 'Button Entry',            text: 'Members join with a single click. No reactions, no spam. Customisable emoji, label and button style.' },
    { title: 'Restart-Safe',            text: 'A poll-based scheduler means no giveaway is ever lost or orphaned, even after a full server reboot.' },
    { title: 'Multiple Prizes',         text: 'List several prizes per giveaway. Either every winner gets all of them, or winner 1 gets prize 1, winner 2 gets prize 2, and so on.' },
    { title: 'Weighted Bonus Entries',  text: 'Grant specific roles extra entries (up to 100) for a fairer or reward-driven draw.' },
    { title: 'Eligibility Rules',       text: 'Whitelist and blacklist roles, server-wide or scoped to a single giveaway, plus minimum account age and server membership.' },
    { title: 'Pause & Resume',          text: 'Freeze the timer mid-giveaway if something goes wrong, then resume it where you left off.' },
    { title: 'Templates',               text: 'Save and reuse giveaway configurations for recurring weekly or event giveaways.' },
    { title: 'Reroll Winners',          text: 'Redraw all winners, or replace a single winner, for any ended giveaway.' },
    { title: 'Winner DMs',              text: 'Winners get a DM with the prize, your claim instructions and a link to the giveaway.' },
    { title: 'Ending-Soon Reminders',   text: 'Automatically remind your members a configurable time before a giveaway ends.' },
    { title: 'Edit & Extend',           text: 'Adjust a running giveaway or extend its end time on the fly, no need to recreate it.' },
    { title: 'Web Dashboard',           text: 'Create and fully manage your giveaways and settings from the browser. Log in with Discord, no commands required.' },
    { title: 'Public Results Pages',    text: 'Every finished giveaway gets a public results page showing the winners and the participant count.' },
    { title: 'Tebex Winner Coupons',    text: 'Connect your own Tebex store and every winner automatically receives their own single-use discount code by DM, optionally limited to selected packages.' },
    { title: 'Multilingual',            text: 'English, German, French and Spanish built in. Pick the language per server.' },
    { title: 'Per-Guild Branding',      text: 'Custom embed colour, button emoji and style so every giveaway matches your community.' },
    { title: 'Audit Logging',           text: 'Optional log channel records every giveaway event: created, ended, rerolled and more.' },
    { title: 'Manager Role',            text: 'Delegate giveaway control to a dedicated role without handing out Manage Server.' },
    { title: 'Least-Privilege',         text: 'Only the Guilds intent and minimal permissions. No message-content access, firewall friendly.' },
  ],

  commandsEyebrow: 'Commands',
  commandsHeading: 'Slash commands for everything',
  commandsSub:     'Manager commands need Manage Server or your configured manager role.',
  commandWho: [
    'Manager', 'Manager', 'Manager', 'Manager', 'Manager', 'Manager', 'Manager', 'Manager',
    'Manager', 'Manage Server', 'Everyone', 'Everyone', 'Everyone', 'Everyone', 'Everyone',
  ],
  commandText: [
    'Open a modal and create a giveaway in the current channel. The mode option switches to one prize per winner.',
    'Edit a running giveaway (title, description, winners, prizes).',
    'Extend a running giveaway’s end time.',
    'End a giveaway immediately and draw the winners.',
    'Redraw all winners, or replace a single winner with the optional user option.',
    'Cancel an active giveaway without drawing a winner.',
    'Pause a giveaway and freeze its timer.',
    'Resume a paused giveaway.',
    'Save, list, delete or use giveaway templates.',
    'Show, set or remove per-server settings, and per-giveaway role rules.',
    'List the active giveaways in the server.',
    'Show details about a specific giveaway.',
    'Show this server’s giveaway statistics.',
    'Overview of every command.',
    'Get the invite link for the bot.',
  ],

  settingsEyebrow:   'Per-server settings',
  settingsHeading:   'Tailored to your community',
  settingsIntroA:    'Every server configures the bot independently via',
  settingsIntroB:    '. Match your branding, set the rules and delegate control, all without touching a config file.',
  settingsCtaInvite: 'Invite the bot',
  settingsCtaSource: 'View source',
  settings: [
    { title: 'Appearance',  text: 'Embed colour, button emoji and button style (Primary / Secondary / Success / Danger).' },
    { title: 'Language',    text: 'Switch the bot UI between English, German, French and Spanish.' },
    { title: 'Eligibility', text: 'Whitelist & blacklist roles (server-wide or per giveaway), bonus entries, minimum account and membership age.' },
    { title: 'Roles & Logs', text: 'Manager role, notify role to ping on creation and an optional audit log channel.' },
    { title: 'Tebex Store', text: 'Connect your own shop so winners get a discount code. Set up by the server owner, stored encrypted.' },
  ],

  couponEyebrow:   'Tebex coupons',
  couponHeading:   'Turn a win into a purchase',
  couponSubA:      'Run a Tebex shop? Connect',
  couponSubStrong: 'your own store',
  couponSubB:      'and every winner automatically receives a personal discount code by DM. Not our shop, yours.',
  coupons: [
    { title: 'One code per winner',  text: 'Every winner gets their own single-use code. Pick the percentage, restrict it to selected packages and give it an expiry, or let it run forever.' },
    { title: 'Rerolls stay clean',   text: 'Replace a winner and their code is revoked in your store before the new one is issued. The other winners keep theirs.' },
    { title: 'Owner-only, encrypted', text: 'Your Tebex key is stored encrypted and only the server owner can add, view or remove it. Administrators cannot.' },
  ],
  couponNote: 'The code is only ever sent in the winner’s DM, never in the public results message or on the results page.',

  trustEyebrow: 'Built right',
  trustHeading: 'Reliable by design',
  trust: [
    { title: 'Discord.js v14', text: 'Native slash commands, modals and buttons. No legacy message-content scraping.' },
    { title: 'Open source',    text: 'Code published on GitHub for full transparency, with a documented security model.' },
    { title: 'Maintained',     text: 'Automated CI checks, dependency updates and active development by MSK Scripts.' },
  ],

  ctaHeading: 'Ready to host your next giveaway?',
  ctaTextA:   'Invite the official instance. It’s free, and your first giveaway is only a',
  ctaTextB:   'away.',
  ctaInvite:  'Invite the bot',
  ctaDocs:    'Read the Docs',
}

const de: GiveawayCopy = {
  altHref:  '/giveaway',
  altLabel: 'This page in English',

  badge: 'Discord Giveaway Bot',
  headline: { lead: 'Discord', accent: 'Giveaway Bot', tail: ', der jeden Neustart übersteht' },
  heroText:
    'Ein kostenloser, mehrsprachiger Giveaway-Bot für Discord, gebaut auf Discord.js v14 und '
    + 'pro Server konfigurierbar. Teilnahme per Knopfdruck, neustartsichere Zeitsteuerung, '
    + 'gewichtete Bonuslose, Teilnahmeregeln, Vorlagen sowie Pause und Fortsetzen. '
    + 'Lade die offizielle Instanz ein und erstelle dein erstes Gewinnspiel in Sekunden.',
  highlights: ['Kostenlos einladbar', 'Neustartsicher', 'Mehrsprachig', 'Discord.js v14', 'Keine privilegierten Intents'],
  heroCtaInvite:  'Bot einladen',
  heroCtaDocs:    'Dokumentation',
  heroCtaDiscord: 'Discord beitreten',

  stepsEyebrow: 'Loslegen',
  stepsHeading: 'Dein erstes Gewinnspiel in drei Schritten',
  stepsSub:     'Kein Server, keine Datenbank, keine Konfigurationsdateien. Bot einladen und los.',
  steps: [
    { title: 'Bot einladen',      text: 'Ein Klick fügt die offizielle Instanz hinzu. Kein Hosting, keine Einrichtung.' },
    { title: '/gcreate ausführen', text: 'Titel, Preise, Laufzeit und Anzahl der Gewinner in einem Modal eintragen.' },
    { title: 'Mitglieder machen mit', text: 'Sie klicken auf den Knopf, die Gewinner werden beim Ablauf automatisch gezogen.' },
  ],
  stepsCta: 'Bot einladen',

  featuresEyebrow: 'Funktionen',
  featuresHeading: 'Mehr als eine Zufallsziehung',
  featuresSub:     'Alles, was eine ernsthafte Community für faire und verlässliche Gewinnspiele braucht.',
  features: [
    { title: 'Teilnahme per Knopf',     text: 'Mitglieder machen mit einem Klick mit. Keine Reaktionen, kein Spam. Emoji, Beschriftung und Knopfstil sind frei wählbar.' },
    { title: 'Neustartsicher',          text: 'Ein abfragebasierter Scheduler sorgt dafür, dass kein Gewinnspiel verloren geht, auch nicht nach einem kompletten Serverneustart.' },
    { title: 'Mehrere Preise',          text: 'Mehrere Preise pro Gewinnspiel. Entweder bekommt jeder Gewinner alle, oder Gewinner 1 bekommt Preis 1, Gewinner 2 bekommt Preis 2, und so weiter.' },
    { title: 'Gewichtete Bonuslose',    text: 'Bestimmten Rollen zusätzliche Lose geben (bis zu 100), für eine fairere oder belohnende Ziehung.' },
    { title: 'Teilnahmeregeln',         text: 'Rollen auf die Whitelist oder Blacklist setzen, serverweit oder nur für ein Gewinnspiel, dazu Mindestalter des Accounts und der Servermitgliedschaft.' },
    { title: 'Pause & Fortsetzen',      text: 'Den Timer mitten im Gewinnspiel einfrieren, wenn etwas schiefgeht, und danach dort weitermachen, wo du aufgehört hast.' },
    { title: 'Vorlagen',                text: 'Konfigurationen speichern und wiederverwenden, für wöchentliche Gewinnspiele oder Events.' },
    { title: 'Neu auslosen',            text: 'Alle Gewinner neu ziehen oder einen einzelnen Gewinner ersetzen, bei jedem beendeten Gewinnspiel.' },
    { title: 'DM an Gewinner',          text: 'Gewinner bekommen eine DM mit dem Preis, deiner Anleitung zum Einlösen und einem Link zum Gewinnspiel.' },
    { title: 'Erinnerung vor Ende',     text: 'Deine Mitglieder werden automatisch eine einstellbare Zeit vor dem Ende erinnert.' },
    { title: 'Bearbeiten & Verlängern', text: 'Ein laufendes Gewinnspiel anpassen oder die Endzeit im laufenden Betrieb verlängern, ohne es neu anzulegen.' },
    { title: 'Web-Dashboard',           text: 'Gewinnspiele und Einstellungen komplett im Browser erstellen und verwalten. Anmeldung per Discord, ganz ohne Befehle.' },
    { title: 'Öffentliche Ergebnisseiten', text: 'Jedes beendete Gewinnspiel bekommt eine öffentliche Ergebnisseite mit den Gewinnern und der Teilnehmerzahl.' },
    { title: 'Tebex-Gutscheine',        text: 'Verbinde deinen eigenen Tebex-Store und jeder Gewinner erhält automatisch seinen persönlichen Einmal-Gutschein per DM, auf Wunsch nur für ausgewählte Pakete.' },
    { title: 'Mehrsprachig',            text: 'Englisch, Deutsch, Französisch und Spanisch sind eingebaut. Die Sprache wird pro Server gewählt.' },
    { title: 'Eigenes Branding',        text: 'Eigene Embed-Farbe, eigenes Knopf-Emoji und eigener Stil, damit jedes Gewinnspiel zu deiner Community passt.' },
    { title: 'Audit-Log',               text: 'Ein optionaler Log-Kanal hält jedes Ereignis fest: erstellt, beendet, neu ausgelost und mehr.' },
    { title: 'Manager-Rolle',           text: 'Gib die Kontrolle über Gewinnspiele an eine eigene Rolle ab, ohne „Server verwalten“ zu vergeben.' },
    { title: 'Minimale Rechte',         text: 'Nur der Guilds-Intent und minimale Berechtigungen. Kein Zugriff auf Nachrichteninhalte, firewallfreundlich.' },
  ],

  commandsEyebrow: 'Befehle',
  commandsHeading: 'Slash-Befehle für alles',
  commandsSub:     'Manager-Befehle brauchen „Server verwalten“ oder deine eingestellte Manager-Rolle.',
  commandWho: [
    'Manager', 'Manager', 'Manager', 'Manager', 'Manager', 'Manager', 'Manager', 'Manager',
    'Manager', 'Server verwalten', 'Alle', 'Alle', 'Alle', 'Alle', 'Alle',
  ],
  commandText: [
    'Öffnet ein Modal und erstellt ein Gewinnspiel im aktuellen Kanal. Die Option mode stellt auf einen Preis pro Gewinner um.',
    'Bearbeitet ein laufendes Gewinnspiel (Titel, Beschreibung, Gewinner, Preise).',
    'Verlängert die Endzeit eines laufenden Gewinnspiels.',
    'Beendet ein Gewinnspiel sofort und zieht die Gewinner.',
    'Lost alle Gewinner neu aus, oder ersetzt über die optionale Nutzerangabe einen einzelnen.',
    'Bricht ein aktives Gewinnspiel ab, ohne einen Gewinner zu ziehen.',
    'Pausiert ein Gewinnspiel und friert den Timer ein.',
    'Setzt ein pausiertes Gewinnspiel fort.',
    'Vorlagen speichern, auflisten, löschen oder verwenden.',
    'Zeigt, setzt oder entfernt Servereinstellungen und Rollenregeln je Gewinnspiel.',
    'Listet die aktiven Gewinnspiele auf dem Server auf.',
    'Zeigt Details zu einem bestimmten Gewinnspiel.',
    'Zeigt die Gewinnspiel-Statistik dieses Servers.',
    'Übersicht über alle Befehle.',
    'Liefert den Einladungslink für den Bot.',
  ],

  settingsEyebrow:   'Einstellungen pro Server',
  settingsHeading:   'Auf deine Community zugeschnitten',
  settingsIntroA:    'Jeder Server konfiguriert den Bot unabhängig über',
  settingsIntroB:    '. Passe das Erscheinungsbild an, lege die Regeln fest und gib Kontrolle ab, ganz ohne Konfigurationsdatei.',
  settingsCtaInvite: 'Bot einladen',
  settingsCtaSource: 'Quellcode ansehen',
  settings: [
    { title: 'Erscheinungsbild', text: 'Embed-Farbe, Knopf-Emoji und Knopfstil (Primary / Secondary / Success / Danger).' },
    { title: 'Sprache',          text: 'Die Bot-Oberfläche zwischen Englisch, Deutsch, Französisch und Spanisch umschalten.' },
    { title: 'Teilnahme',        text: 'Whitelist- und Blacklist-Rollen (serverweit oder pro Gewinnspiel), Bonuslose, Mindestalter von Account und Mitgliedschaft.' },
    { title: 'Rollen & Logs',    text: 'Manager-Rolle, Rolle die beim Erstellen gepingt wird, und ein optionaler Audit-Log-Kanal.' },
    { title: 'Tebex-Store',      text: 'Verbinde deinen eigenen Shop, damit Gewinner einen Gutschein bekommen. Wird vom Serverinhaber eingerichtet und verschlüsselt gespeichert.' },
  ],

  couponEyebrow:   'Tebex-Gutscheine',
  couponHeading:   'Aus einem Gewinn einen Kauf machen',
  couponSubA:      'Du betreibst einen Tebex-Shop? Verbinde',
  couponSubStrong: 'deinen eigenen Store',
  couponSubB:      'und jeder Gewinner bekommt automatisch einen persönlichen Gutschein per DM. Nicht unser Shop, deiner.',
  coupons: [
    { title: 'Ein Code pro Gewinner',   text: 'Jeder Gewinner bekommt seinen eigenen Einmal-Code. Prozentsatz wählen, auf ausgewählte Pakete beschränken und ein Ablaufdatum setzen, oder unbegrenzt laufen lassen.' },
    { title: 'Saubere Neuauslosung',    text: 'Ersetzt du einen Gewinner, wird dessen Code in deinem Store zurückgezogen, bevor der neue ausgegeben wird. Die anderen Gewinner behalten ihren.' },
    { title: 'Nur Inhaber, verschlüsselt', text: 'Dein Tebex-Key wird verschlüsselt gespeichert, und nur der Serverinhaber kann ihn hinzufügen, ansehen oder entfernen. Administratoren nicht.' },
  ],
  couponNote: 'Der Code geht ausschließlich per DM an den Gewinner, nie in die öffentliche Ergebnismeldung und nie auf die Ergebnisseite.',

  trustEyebrow: 'Sauber gebaut',
  trustHeading: 'Von Grund auf verlässlich',
  trust: [
    { title: 'Discord.js v14', text: 'Native Slash-Befehle, Modals und Knöpfe. Kein Auslesen von Nachrichteninhalten wie früher.' },
    { title: 'Quelloffen',     text: 'Der Code liegt für volle Transparenz auf GitHub, mit dokumentiertem Sicherheitsmodell.' },
    { title: 'Gepflegt',       text: 'Automatische CI-Prüfungen, Abhängigkeits-Updates und aktive Weiterentwicklung durch MSK Scripts.' },
  ],

  ctaHeading: 'Bereit für dein nächstes Gewinnspiel?',
  ctaTextA:   'Lade die offizielle Instanz ein. Sie ist kostenlos, und dein erstes Gewinnspiel ist nur ein',
  ctaTextB:   'entfernt.',
  ctaInvite:  'Bot einladen',
  ctaDocs:    'Zur Dokumentation',
}

export const GIVEAWAY_COPY: Record<Lang, GiveawayCopy> = { en, de }

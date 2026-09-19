import type { Lang } from '@/lib/i18n'

/**
 * Sichtbare Texte der Ticket-Bot-Landingpage, je Sprache.
 *
 * Warum hier und nicht in `lib/i18n.ts`: Das sind rund 120 Marketing-Strings pro
 * Sprache, die nur eine einzige Seite betreffen. In `lib/i18n.ts` würden sie die
 * geteilten Tabellen zumutlos aufblähen. Die Icons bleiben in
 * `components/bots/TicketBotLanding.tsx` und werden positionsgleich zu den
 * Listen hier gehalten, genau wie bei `HOME_FEATURE_ICONS`.
 *
 * **Reihenfolge ist Vertrag.** `features`, `hubCards`, `verifySteps`,
 * `dashboardItems`, `hostedItems` und `tierCards` müssen in beiden Sprachen
 * gleich lang und gleich sortiert sein wie die Icon-Arrays in der Komponente.
 * `tests/botLandingCopy.test.ts` prüft das.
 */

export interface LabelledText {
  title: string
  text:  string
}

export interface TicketBotHubCard extends LabelledText {
  eyebrow: string
  cta:     string
}

export interface TicketBotTierCard {
  name:     string
  /**
   * Shown instead of the price computed from `TIER_CONFIG`. Only the free tier
   * uses it ("Free" / "Kostenlos"); every paid card leaves it null so the
   * number on the page and the number the checkout charges cannot drift apart.
   * That drift is exactly what the comment on `priceCents` in lib/tiers.ts
   * warns about.
   */
  priceOverride: string | null
  priceSub: string
  badge:    string | null
  cta:      string
}

export interface TicketBotCopy {
  /** hreflang-Partner dieser Fassung: sichtbarer Umschaltlink oben auf der Seite. */
  altHref:  string
  altLabel: string

  badge:      string
  headline:   { lead: string; accent: string; tail: string }
  heroText:   string
  highlights: string[]
  heroCtaKey:      string
  heroCtaDocs:     string
  heroCtaDiscord:  string
  /** Proof line under the hero CTAs. Deliberately a checkable claim. */
  heroProof:       string
  heroProofCta:    string

  problemEyebrow: string
  problemHeading: string
  problems:       LabelledText[]

  hubEyebrow:  string
  hubHeading:  string
  hubSub:      string
  hubCards:    TicketBotHubCard[]

  featuresEyebrow: string
  featuresHeading: string
  featuresSub:     string
  features:        LabelledText[]

  verifyEyebrow: string
  verifyHeading: string
  verifySteps:   LabelledText[]
  verifyCta:     string

  dashboardEyebrow:  string
  dashboardHeading:  string
  dashboardIntroA:   string
  dashboardIntroB:   string
  dashboardIntroC:   string
  dashboardSecure:   string
  dashboardDocsCta:  string
  dashboardItems:    LabelledText[]

  hostedEyebrow:     string
  hostedHeading:     string
  hostedText:        string
  hostedCtaDashboard: string
  hostedCtaDiscord:  string
  hostedItems:       LabelledText[]

  tiersEyebrow:  string
  tiersHeading:  string
  tiersSubLead:  string
  tiersSubTrial: string
  tiersSubTail:  string
  tierCards:     TicketBotTierCard[]
  /** `{size}` bzw. `{days}` / `{n}` werden zur Laufzeit aus TIER_CONFIG ersetzt. */
  tierFeatureHosting:      string
  tierFeatureTranscript:   string
  tierFeatureAttachments:  string
  tierFeatureNoAttachments: string
  tierFeatureDomain:       string
  tierFeatureBranding:     string
  tierFeatureStorage:      string
  /** Used instead of `tierFeatureStorage` from two years up, where a day count stops being readable. */
  tierFeatureStorageYears: string
  tierFeatureUploads:      string
  tierFeatureHosted:       string
  /** `{price}` and `{n}` are filled from TIER_CONFIG at runtime. */
  tierPriceYear: string
  tierNote: LabelledText

  faqEyebrow: string
  faqHeading: string
  faq:        LabelledText[]

  ctaHeading: string
  ctaText:    string
  ctaKey:     string
  ctaDocs:    string
}

const en: TicketBotCopy = {
  altHref:  '/de/ticketbot',
  altLabel: 'Diese Seite auf Deutsch',

  badge: 'Discord Ticket Bot',
  headline: { lead: 'Discord', accent: 'Ticket Bot', tail: ' that stays on your server' },
  heroText:
    'A self-hosted ticket system for Discord admins who want their transcripts on their '
    + 'own machine. Free, no telemetry, no basics behind a paywall.',
  highlights: ['Self-hosted', 'No game server needed', 'No telemetry', 'SQLite · MySQL · PostgreSQL', 'Discord.js v14'],
  heroCtaKey:     'Set up your bot in 3 minutes',
  heroCtaDocs:    'Documentation',
  heroCtaDiscord: 'Join Discord',
  heroProof:      'Built on Discord.js v14, AGPL-3.0. Every number on this page is live:',
  heroProofCta:   'see the stats',

  problemEyebrow: 'Why this exists',
  problemHeading: 'Your support history is not yours',
  problems: [
    {
      title: 'One click and the history is gone',
      text:  'A moderator deletes a ticket channel and the only record of what happened goes with it. Four weeks later somebody asks, and you have nothing to show.',
    },
    {
      title: 'Every transcript sits with someone else',
      text:  'Your member data, your disputes, your payout arguments end up on a provider’s infrastructure, and you never find out what happens to them there.',
    },
    {
      title: 'The basics cost extra',
      text:  'Transcripts, attachments, more than one panel. The very things you got the bot for sit behind a paywall, billed per server.',
    },
  ],

  hubEyebrow: 'Get started',
  hubHeading: 'Everything in three steps',
  hubSub:     'Verify your account, manage your bot and track its usage.',
  hubCards: [
    {
      eyebrow: 'Step 1',
      title:   'Verify',
      text:    'Sign in with Discord and select your server. Your personal API key is generated instantly and unlocks the MSK transcript service for your bot.',
      cta:     'Get API Key',
    },
    {
      eyebrow: 'Manage',
      title:   'Dashboard',
      text:    'Set up a custom domain for your transcripts and, on Premium, fully manage a hosted bot: start, stop, restart, one-click update and stream live logs.',
      cta:     'Open Dashboard',
    },
    {
      eyebrow: 'Insights',
      title:   'Stats',
      text:    'Browse anonymous live statistics of the MSK Ticket Bot across all servers: hosted transcripts, active API keys, tier distribution and storage usage.',
      cta:     'View Stats',
    },
  ],

  featuresEyebrow: 'Features',
  featuresHeading: 'A full feature set out of the box',
  featuresSub:     'Everything a serious support team needs. No add-ons, no paywalled basics.',
  features: [
    { title: 'Ticket Types',           text: 'Up to 25 configurable types, each with its own emoji, color, category and questions.' },
    { title: 'Questionnaires',         text: 'Modal forms with up to 5 questions shown when a ticket is opened.' },
    { title: 'Claim System',           text: 'Staff claim and release tickets. Embed, topic and channel name update automatically.' },
    { title: 'Priorities',             text: 'Low, Medium, High or Urgent, predefined per ticket type or set live via /priority, reflected in the channel topic and opening embed.' },
    { title: 'Rating System',          text: '1 to 5 star feedback after closing, posted automatically to a channel of your choice.' },
    { title: 'Auto-Close & Reminders', text: 'Close inactive tickets automatically and ping staff after X hours without a reply.' },
    { title: 'HTML Transcripts',       text: 'Self-contained HTML with avatars embedded as Base64, no CDN needed, served via a public link.' },
    { title: 'Canned Responses',       text: 'Pre-defined snippets sent with one command, with placeholders and autocomplete.' },
    { title: 'Custom Domain',          text: 'Premium servers serve transcripts under their own domain with automatic SSL.' },
    { title: 'Lock & Blacklist',       text: 'Lock a ticket to mute the user, or blacklist users from opening tickets entirely.' },
    { title: 'Reopen Tickets',         text: 'Reopen a closed ticket with one click or /reopen. It restores access and moves the ticket back, so you never have to recreate it.' },
    { title: 'User Notifications',     text: 'Users can opt in to a DM when staff first replies, rate-limited to avoid spam.' },
    { title: 'Broadcast',              text: 'Send a single message to every open ticket channel at once.' },
    { title: 'Flexible Database',      text: 'Runs on SQLite with zero setup, or connect your own MySQL, MariaDB or PostgreSQL, with a migration script to move existing data.' },
    { title: 'Self-Hosted Dashboard',  text: 'Optional built-in web dashboard to manage tickets, stats, config and the bot itself from the browser. Disabled by default, secure by default.' },
  ],

  verifyEyebrow: 'How verification works',
  verifyHeading: 'From nothing to a running bot in three minutes',
  verifySteps: [
    { title: 'Sign in with Discord', text: 'No second password to create.' },
    { title: 'Select your server',   text: 'We show the servers you administer, you pick one.' },
    { title: 'Copy the API key',     text: 'It appears straight away, drop it into the bot’s .env.' },
    { title: 'Start the bot',        text: 'Host it yourself, or switch on hosting with us.' },
  ],
  verifyCta: 'Start verification',

  dashboardEyebrow: 'New · self-hosted',
  dashboardHeading: 'A web dashboard, right in your bot',
  dashboardIntroA:  'Start the bot with',
  dashboardIntroB:
    'and manage everything from the browser instead of over SSH: tickets, statistics, '
    + 'the full config and the bot process itself. It ships with the bot and works on '
    + 'every tier, including the free one. It stays fully optional:',
  dashboardIntroC:  'keeps running the plain bot with no web server at all.',
  dashboardSecure:
    'Secure by default: off until you enable it, bound to localhost so it is never '
    + 'exposed by accident, and it refuses to start on a public interface without HTTPS. '
    + 'Login is Discord OAuth, access is granted per role and per user, and every change '
    + 'is written to an audit log.',
  dashboardDocsCta: 'Dashboard docs',
  dashboardItems: [
    { title: 'Tickets & Stats',   text: 'Browse and filter tickets, claim, close, reopen, move and reply, with live team statistics.' },
    { title: 'Config & Locales',  text: 'Edit config.jsonc, snippets, .env and the language files in a form or raw view with syntax highlighting.' },
    { title: 'Permissions',       text: 'Grant dashboard access per role or per user, each with fine-grained rights, backed by an audit log.' },
    { title: 'Reply as yourself', text: 'Answers you send from the dashboard appear in Discord under your own name and avatar, not the bot.' },
  ],

  hostedEyebrow: 'Hosted & Business',
  hostedHeading: 'Or let us host it for you',
  hostedText:
    'Prefer not to run a server at all? Set hosting up yourself in the dashboard: '
    + 'enter your bot token, client ID and client secret, and we install the bot, start it '
    + 'and check that it really came up. Your bot then gets its own address, and your whole '
    + 'team signs in there with Discord. No SSH access or server knowledge required.',
  hostedCtaDashboard: 'Set it up in the dashboard',
  hostedCtaDiscord:   'Ask on Discord',
  hostedItems: [
    { title: 'Set up yourself',  text: 'Three values from the Discord developer portal and one button. No ticket, no waiting.' },
    { title: 'Stays reversible', text: 'Remove hosting whenever you want. We keep the installation for 14 days, so one click brings it back with your tickets intact.' },
    { title: 'Bot control and live logs', text: 'Start, stop, restart and update the bot, and read its output live, which is exactly what you need when it will not come up.' },
    { title: 'Its own address',  text: 'The bot dashboard runs on its own address with its own Discord login, so your team gets in too. Bring your own domain if you prefer.' },
  ],

  tiersEyebrow:  'Transcript service',
  tiersHeading:  'Choose your tier',
  tiersSubLead:  'Host transcripts as public links. Premium tiers come with a',
  tiersSubTrial: '14-day free trial',
  tiersSubTail:  ', no credit card required. Cancel anytime. No VAT is added (§ 19 UStG), the price you see is the price you pay.',
  tierCards: [
    { name: 'Basic',    priceOverride: 'Free', priceSub: 'forever', badge: null,           cta: 'Get API Key' },
    { name: 'Premium',  priceOverride: null,   priceSub: '/ month', badge: null,           cta: 'Start free trial' },
    { name: 'Hosted',   priceOverride: null,   priceSub: '/ month', badge: 'Most popular', cta: 'Start free trial' },
    { name: 'Business', priceOverride: null,   priceSub: '/ month', badge: null,           cta: 'Start free trial' },
  ],
  tierFeatureHosting:       'Transcript hosting & links',
  tierFeatureTranscript:    'Up to {size} per transcript',
  tierFeatureAttachments:   'Attachments up to {size} per ticket',
  tierFeatureNoAttachments: 'File attachments',
  tierFeatureDomain:        'Custom domain',
  tierFeatureBranding:      'Remove the MSK branding',
  tierFeatureStorage:       '{days} days storage',
  tierFeatureStorageYears:  '{n} years storage',
  tierFeatureUploads:       '{n} uploads / hour',
  tierFeatureHosted:        'Hosted bot management',
  tierPriceYear: 'or {price} / year, {n} months free',
  tierNote: {
    title: 'Plans are per guild',
    text:  'A subscription applies to a single Discord server. Each guild you manage has its own plan, upgrade them independently from each guild’s dashboard.',
  },

  faqEyebrow: 'Before you ask',
  faqHeading: 'The questions we get most',
  faq: [
    {
      title: 'Is the bot free, or is that a trial balloon?',
      text:  'The bot is AGPL-3.0 and stays free, including tickets, panels and transcript generation. What you pay for is the hosting around it: longer retention, attachments, your own domain, a managed process.',
    },
    {
      title: 'What happens to my ticket data?',
      text:  'The ticket database lives with you, in your SQLite or your own SQL server. Only the transcripts your bot actively uploads reach us, and you can delete them at any time. There is no telemetry, and the code is open to check.',
    },
    {
      title: 'I already run a ticket bot. Is it worth switching?',
      text:  'Only if one of two things bothers you: that your transcripts sit with someone else, or that the basics cost money. Otherwise stay where you are.',
    },
    {
      title: 'Do I need a game server or FiveM?',
      text:  'No. It is a plain Discord bot. It needs Node.js and a bot token, nothing else.',
    },
    {
      title: 'What happens if I cancel?',
      text:  'You can cancel any time in the billing portal. The bot keeps running, it is yours. Transcripts already stored with us stay for another 30 days, which is enough time to save them.',
    },
  ],

  ctaHeading: 'Your first ticket runs in three minutes',
  ctaText:    'Sign in, pick a server, copy the key. After that you decide whether you host it or we do.',
  ctaKey:     'Set up your bot in 3 minutes',
  ctaDocs:    'Read the Docs',
}

const de: TicketBotCopy = {
  altHref:  '/ticketbot',
  altLabel: 'This page in English',

  badge: 'Discord Ticket Bot',
  headline: { lead: 'Discord', accent: 'Ticket Bot', tail: ', der auf deinem Server bleibt' },
  heroText:
    'Ticketsystem zum Selbsthosten für Discord-Betreiber, die ihre Transkripte nicht fremden '
    + 'Servern geben wollen. Kostenlos, ohne Telemetrie, ohne Grundfunktion hinter einer Bezahlschranke.',
  highlights: ['Selbst gehostet', 'Kein Gameserver nötig', 'Keine Telemetrie', 'SQLite · MySQL · PostgreSQL', 'Discord.js v14'],
  heroCtaKey:     'Bot in 3 Minuten einrichten',
  heroCtaDocs:    'Dokumentation',
  heroCtaDiscord: 'Discord beitreten',
  heroProof:      'Gebaut auf Discord.js v14, AGPL-3.0. Alle Zahlen auf dieser Seite sind live:',
  heroProofCta:   'zur Statistik',

  problemEyebrow: 'Warum es das gibt',
  problemHeading: 'Dein Support gehört dir nicht',
  problems: [
    {
      title: 'Ein Klick, und die Historie ist weg',
      text:  'Ein Moderator löscht einen Ticketkanal, und die einzige Aufzeichnung des Vorgangs ist verschwunden. Bei einer Rückfrage vier Wochen später hast du nichts in der Hand.',
    },
    {
      title: 'Jedes Transkript liegt bei jemand anderem',
      text:  'Deine Nutzerdaten, deine Konflikte, deine Auszahlungsstreitigkeiten landen auf der Infrastruktur eines fremden Anbieters, und du erfährst nicht, was damit passiert.',
    },
    {
      title: 'Die Grundfunktion kostet extra',
      text:  'Transkripte, Anhänge, mehr als ein Panel. Genau das, wofür du den Bot geholt hast, steht hinter einer Bezahlschranke, pro Server abgerechnet.',
    },
  ],

  hubEyebrow: 'Loslegen',
  hubHeading: 'Alles in drei Schritten',
  hubSub:     'Account verifizieren, Bot verwalten, Nutzung im Blick behalten.',
  hubCards: [
    {
      eyebrow: 'Schritt 1',
      title:   'Verifizieren',
      text:    'Mit Discord anmelden und deinen Server auswählen. Dein persönlicher API-Key wird sofort erzeugt und schaltet den MSK-Transkriptdienst für deinen Bot frei.',
      cta:     'API-Key holen',
    },
    {
      eyebrow: 'Verwalten',
      title:   'Dashboard',
      text:    'Eigene Domain für deine Transkripte einrichten und mit Premium einen gehosteten Bot vollständig steuern: starten, stoppen, neu starten, per Klick aktualisieren und Live-Logs mitlesen.',
      cta:     'Dashboard öffnen',
    },
    {
      eyebrow: 'Zahlen',
      title:   'Statistiken',
      text:    'Anonyme Live-Statistiken des MSK Ticket Bots über alle Server hinweg: gehostete Transkripte, aktive API-Keys, Tier-Verteilung und belegter Speicher.',
      cta:     'Statistiken ansehen',
    },
  ],

  featuresEyebrow: 'Funktionen',
  featuresHeading: 'Voller Funktionsumfang ab Werk',
  featuresSub:     'Alles, was ein ernsthaftes Support-Team braucht. Keine Add-ons, keine Grundfunktion gegen Aufpreis.',
  features: [
    { title: 'Ticket-Typen',              text: 'Bis zu 25 konfigurierbare Typen, jeder mit eigenem Emoji, eigener Farbe, Kategorie und eigenen Fragen.' },
    { title: 'Fragebögen',                text: 'Modal-Formulare mit bis zu 5 Fragen, die beim Öffnen eines Tickets erscheinen.' },
    { title: 'Claim-System',              text: 'Teammitglieder übernehmen Tickets und geben sie wieder frei. Embed, Thema und Kanalname aktualisieren sich automatisch.' },
    { title: 'Prioritäten',               text: 'Niedrig, Mittel, Hoch oder Dringend, pro Ticket-Typ vorbelegt oder live per /priority gesetzt, sichtbar im Kanalthema und im Eröffnungs-Embed.' },
    { title: 'Bewertungssystem',          text: 'Bewertung mit 1 bis 5 Sternen nach dem Schließen, automatisch in einen Kanal deiner Wahl gepostet.' },
    { title: 'Auto-Close & Erinnerungen', text: 'Inaktive Tickets automatisch schließen und das Team nach X Stunden ohne Antwort anpingen.' },
    { title: 'HTML-Transkripte',          text: 'Eigenständiges HTML mit als Base64 eingebetteten Avataren, ohne CDN, erreichbar über einen öffentlichen Link.' },
    { title: 'Textbausteine',             text: 'Vorgefertigte Antworten mit einem Befehl senden, inklusive Platzhaltern und Autovervollständigung.' },
    { title: 'Eigene Domain',             text: 'Premium-Server liefern ihre Transkripte unter der eigenen Domain aus, mit automatischem SSL.' },
    { title: 'Sperren & Blacklist',       text: 'Ein Ticket sperren, um den Nutzer stummzuschalten, oder Nutzer komplett vom Öffnen ausschließen.' },
    { title: 'Tickets wieder öffnen',     text: 'Ein geschlossenes Ticket per Klick oder /reopen erneut öffnen. Zugriff und Kategorie werden wiederhergestellt, du musst nichts neu anlegen.' },
    { title: 'Benachrichtigungen',        text: 'Nutzer können sich eine DM schicken lassen, sobald das Team zum ersten Mal antwortet, mit Ratenbegrenzung gegen Spam.' },
    { title: 'Rundnachricht',             text: 'Eine Nachricht auf einmal in jeden offenen Ticket-Kanal schicken.' },
    { title: 'Flexible Datenbank',        text: 'Läuft ohne Einrichtung auf SQLite, oder verbinde deine eigene MySQL, MariaDB oder PostgreSQL. Ein Migrationsskript übernimmt vorhandene Daten.' },
    { title: 'Eigenes Dashboard',         text: 'Optionales mitgeliefertes Web-Dashboard für Tickets, Statistiken, Konfiguration und den Bot selbst. Standardmäßig aus, standardmäßig abgesichert.' },
  ],

  verifyEyebrow: 'So läuft die Verifizierung',
  verifyHeading: 'In drei Minuten von nichts zum laufenden Bot',
  verifySteps: [
    { title: 'Mit Discord anmelden', text: 'Ohne ein weiteres Passwort anzulegen.' },
    { title: 'Server auswählen',     text: 'Wir zeigen dir die Server, auf denen du Administrator bist.' },
    { title: 'API-Key kopieren',     text: 'Er erscheint sofort, du trägst ihn in die .env des Bots ein.' },
    { title: 'Bot starten',          text: 'Selbst hosten oder das Hosting bei uns aktivieren.' },
  ],
  verifyCta: 'Verifizierung starten',

  dashboardEyebrow: 'Neu · selbst gehostet',
  dashboardHeading: 'Ein Web-Dashboard direkt im Bot',
  dashboardIntroA:  'Starte den Bot mit',
  dashboardIntroB:
    'und verwalte alles im Browser statt über SSH: Tickets, Statistiken, die komplette '
    + 'Konfiguration und den Bot-Prozess selbst. Es kommt mit dem Bot mit und funktioniert '
    + 'in jedem Tier, auch im kostenlosen. Es bleibt vollständig optional:',
  dashboardIntroC:  'startet weiterhin den reinen Bot, ganz ohne Webserver.',
  dashboardSecure:
    'Standardmäßig abgesichert: aus, bis du es einschaltest, an localhost gebunden, damit es '
    + 'nicht versehentlich nach außen hängt, und es verweigert den Start auf einer öffentlichen '
    + 'Schnittstelle ohne HTTPS. Angemeldet wird per Discord OAuth, Zugriff wird pro Rolle und '
    + 'pro Nutzer vergeben, und jede Änderung landet im Audit-Log.',
  dashboardDocsCta: 'Dashboard-Doku',
  dashboardItems: [
    { title: 'Tickets & Statistiken', text: 'Tickets durchsuchen und filtern, übernehmen, schließen, wieder öffnen, verschieben und beantworten, mit Live-Statistiken fürs Team.' },
    { title: 'Config & Sprachen',     text: 'config.jsonc, Textbausteine, .env und die Sprachdateien im Formular oder in der Rohansicht mit Syntaxhervorhebung bearbeiten.' },
    { title: 'Berechtigungen',        text: 'Dashboard-Zugriff pro Rolle oder pro Nutzer vergeben, jeweils mit feinen Einzelrechten und Audit-Log.' },
    { title: 'Unter eigenem Namen',   text: 'Antworten aus dem Dashboard erscheinen in Discord unter deinem Namen und deinem Avatar, nicht unter dem des Bots.' },
  ],

  hostedEyebrow: 'Hosted & Business',
  hostedHeading: 'Oder wir hosten ihn für dich',
  hostedText:
    'Du willst gar keinen eigenen Server betreiben? Richte das Hosting selbst im Dashboard ein: '
    + 'Bot-Token, Client ID und Client Secret eintragen, und wir installieren den Bot, starten ihn '
    + 'und prüfen, ob er wirklich hochgekommen ist. Dein Bot bekommt danach eine eigene Adresse, '
    + 'an der sich dein ganzes Team mit Discord anmeldet. Ohne SSH-Zugang und ohne Serverkenntnisse.',
  hostedCtaDashboard: 'Im Dashboard einrichten',
  hostedCtaDiscord:   'Auf Discord fragen',
  hostedItems: [
    { title: 'Selbst einrichten',   text: 'Drei Werte aus dem Discord Developer Portal und ein Knopf. Kein Ticket, kein Warten.' },
    { title: 'Bleibt umkehrbar',    text: 'Hosting jederzeit wieder entfernen. Wir heben die Installation 14 Tage auf, ein Klick holt sie samt deinen Tickets zurück.' },
    { title: 'Steuerung und Live-Logs', text: 'Bot starten, stoppen, neu starten und aktualisieren, und seine Ausgabe live mitlesen. Genau das brauchst du, wenn er nicht hochkommt.' },
    { title: 'Eine eigene Adresse', text: 'Das Bot-Dashboard läuft unter einer eigenen Adresse mit eigenem Discord-Login, damit auch dein Team hineinkommt. Auf Wunsch unter deiner eigenen Domain.' },
  ],

  tiersEyebrow:  'Transkriptdienst',
  tiersHeading:  'Wähle deinen Tarif',
  tiersSubLead:  'Transkripte als öffentliche Links hosten. Die Premium-Tarife starten mit',
  tiersSubTrial: '14 Tagen kostenlos',
  tiersSubTail:  ', ohne Kreditkarte. Jederzeit kündbar. Als Kleinunternehmer nach § 19 UStG ohne Umsatzsteuer, der genannte Preis ist der bezahlte Preis.',
  tierCards: [
    { name: 'Basic',    priceOverride: 'Kostenlos', priceSub: 'dauerhaft', badge: null,              cta: 'API-Key holen' },
    { name: 'Premium',  priceOverride: null,        priceSub: '/ Monat',   badge: null,              cta: 'Kostenlos testen' },
    { name: 'Hosted',   priceOverride: null,        priceSub: '/ Monat',   badge: 'Am beliebtesten', cta: 'Kostenlos testen' },
    { name: 'Business', priceOverride: null,        priceSub: '/ Monat',   badge: null,              cta: 'Kostenlos testen' },
  ],
  tierFeatureHosting:       'Transkript-Hosting & Links',
  tierFeatureTranscript:    'Bis zu {size} pro Transkript',
  tierFeatureAttachments:   'Anhänge bis {size} pro Ticket',
  tierFeatureNoAttachments: 'Datei-Anhänge',
  tierFeatureDomain:        'Eigene Domain',
  tierFeatureBranding:      'MSK-Branding entfernen',
  tierFeatureStorage:       '{days} Tage Speicherdauer',
  tierFeatureStorageYears:  '{n} Jahre Speicherdauer',
  tierFeatureUploads:       '{n} Uploads / Stunde',
  tierFeatureHosted:        'Verwaltung des gehosteten Bots',
  tierPriceYear: 'oder {price} / Jahr, {n} Monate geschenkt',
  tierNote: {
    title: 'Tarife gelten pro Server',
    text:  'Ein Abo gilt für einen einzelnen Discord-Server. Jede Guild, die du verwaltest, hat ihren eigenen Tarif und wird unabhängig über das jeweilige Dashboard hochgestuft.',
  },

  faqEyebrow: 'Bevor du fragst',
  faqHeading: 'Die häufigsten Fragen',
  faq: [
    {
      title: 'Ist der Bot wirklich kostenlos oder ist das ein Testballon?',
      text:  'Der Bot ist AGPL-3.0 und bleibt kostenlos, inklusive Tickets, Panels und Transkript-Erzeugung. Bezahlt wird nur unser Hosting drumherum: längere Aufbewahrung, Anhänge, eigene Domain, gemanagter Betrieb.',
    },
    {
      title: 'Was passiert mit meinen Ticketdaten?',
      text:  'Die Ticketdatenbank liegt bei dir, in deiner SQLite oder deiner eigenen SQL. Bei uns landen ausschließlich die Transkripte, die dein Bot aktiv hochlädt, und die kannst du jederzeit löschen. Telemetrie gibt es nicht, der Code ist offen und nachprüfbar.',
    },
    {
      title: 'Ich habe schon einen Ticketbot. Lohnt der Wechsel?',
      text:  'Nur wenn dich eins von zwei Dingen stört: dass deine Transkripte bei einem fremden Anbieter liegen, oder dass Basisfunktionen Geld kosten. Sonst bleib, wo du bist.',
    },
    {
      title: 'Brauche ich einen Gameserver oder FiveM?',
      text:  'Nein. Es ist ein reiner Discord-Bot, er braucht Node.js und ein Bot-Token, mehr nicht.',
    },
    {
      title: 'Was ist, wenn ich kündige?',
      text:  'Du kannst jederzeit im Kundenportal kündigen. Der Bot läuft danach weiter, er ist ja deiner. Deine bereits gespeicherten Transkripte behältst du noch 30 Tage, Zeit genug zum Sichern.',
    },
  ],

  ctaHeading: 'In drei Minuten läuft dein erstes Ticket',
  ctaText:    'Anmelden, Server wählen, Schlüssel kopieren. Danach entscheidest du, ob du selbst hostest oder uns lässt.',
  ctaKey:     'Bot in 3 Minuten einrichten',
  ctaDocs:    'Zur Dokumentation',
}

export const TICKETBOT_COPY: Record<Lang, TicketBotCopy> = { en, de }

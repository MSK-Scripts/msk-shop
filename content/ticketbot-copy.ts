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
  price:    string
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
  hostedCtaRequest:  string
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
  tierFeatureStorage:      string
  tierFeatureUploads:      string
  tierFeatureHosted:       string
  tierNote: LabelledText

  ctaHeading: string
  ctaText:    string
  ctaKey:     string
  ctaDocs:    string
}

const en: TicketBotCopy = {
  altHref:  '/de/ticketbot',
  altLabel: 'Diese Seite auf Deutsch',

  badge: 'Discord Ticket Bot',
  headline: { lead: 'Discord', accent: 'Ticket Bot', tail: ' you host yourself' },
  heroText:
    'A free, self-hosted support ticket system for Discord, built on Discord.js v14. '
    + 'It runs on SQLite out of the box or on your own MySQL, MariaDB or PostgreSQL. '
    + 'No telemetry, no paywalled basics. Verify to get your API key, run and configure '
    + 'the bot from the dashboard, and keep an eye on the live stats.',
  highlights: ['Self-hosted', 'No telemetry', 'SQLite · MySQL · PostgreSQL', 'Discord.js v14', 'German & English'],
  heroCtaKey:     'Get API Key',
  heroCtaDocs:    'Documentation',
  heroCtaDiscord: 'Join Discord',

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
  verifyHeading: 'Your API key in under a minute',
  verifySteps: [
    { title: 'Connect Discord',    text: 'Link your Discord account and servers.' },
    { title: 'Select your server', text: 'Pick the guild the bot runs on.' },
    { title: 'Get your API key',   text: 'Generated instantly, just drop it into .env.' },
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

  hostedEyebrow: 'Premium & Premium+',
  hostedHeading: 'Or let us host it for you',
  hostedText:
    'Prefer not to run a server at all? Premium customers can have their bot instance '
    + 'fully hosted by MSK Scripts and manage everything from the same dashboard. '
    + 'No SSH access or server knowledge required.',
  hostedCtaDashboard: 'Open Dashboard',
  hostedCtaRequest:   'Request hosting',
  hostedItems: [
    { title: 'Bot Control',      text: 'Start, stop and restart the bot with a single click.' },
    { title: 'One-click Update', text: 'Pull the latest version, install deps and restart, no terminal needed.' },
    { title: 'Live Log Console', text: 'Real-time stream of the bot output right in the dashboard.' },
    { title: 'Own Dashboard',    text: 'Open the bot’s own web dashboard through an authenticated gateway, no port ever exposed.' },
  ],

  tiersEyebrow:  'Transcript service',
  tiersHeading:  'Choose your tier',
  tiersSubLead:  'Host transcripts as public links. Premium tiers come with a',
  tiersSubTrial: '14-day free trial',
  tiersSubTail:  ', no credit card required. Cancel anytime, billed monthly afterwards.',
  tierCards: [
    { name: 'Basic',    price: 'Free',  priceSub: 'forever', badge: null,           cta: 'Get API Key' },
    { name: 'Premium',  price: '€3.99', priceSub: '/ month', badge: 'Most popular', cta: 'Start free trial' },
    { name: 'Premium+', price: '€6.99', priceSub: '/ month', badge: null,           cta: 'Start free trial' },
  ],
  tierFeatureHosting:       'Transcript hosting & links',
  tierFeatureTranscript:    'Up to {size} per transcript',
  tierFeatureAttachments:   'Attachments up to {size} per ticket',
  tierFeatureNoAttachments: 'File attachments',
  tierFeatureDomain:        'Custom domain',
  tierFeatureStorage:       '{days} days storage',
  tierFeatureUploads:       '{n} uploads / hour',
  tierFeatureHosted:        'Hosted bot management',
  tierNote: {
    title: 'Plans are per guild',
    text:  'A subscription applies to a single Discord server. Each guild you manage has its own plan, upgrade them independently from each guild’s dashboard.',
  },

  ctaHeading: 'Ready to set up your ticket bot?',
  ctaText:    'Verify your account to grab your API key, it only takes a minute.',
  ctaKey:     'Get API Key',
  ctaDocs:    'Read the Docs',
}

const de: TicketBotCopy = {
  altHref:  '/ticketbot',
  altLabel: 'This page in English',

  badge: 'Discord Ticket Bot',
  headline: { lead: 'Discord', accent: 'Ticket Bot', tail: ' zum Selbsthosten' },
  heroText:
    'Ein kostenloses Ticketsystem für den Discord-Support, das du selbst hostest, gebaut auf '
    + 'Discord.js v14. Es läuft direkt mit SQLite oder mit deiner eigenen MySQL, MariaDB oder '
    + 'PostgreSQL. Keine Telemetrie, keine Grundfunktion hinter einer Bezahlschranke. '
    + 'Verifizieren, API-Key holen, den Bot über das Dashboard starten und konfigurieren, '
    + 'und die Live-Statistiken im Blick behalten.',
  highlights: ['Selbst gehostet', 'Keine Telemetrie', 'SQLite · MySQL · PostgreSQL', 'Discord.js v14', 'Deutsch & Englisch'],
  heroCtaKey:     'API-Key holen',
  heroCtaDocs:    'Dokumentation',
  heroCtaDiscord: 'Discord beitreten',

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
  verifyHeading: 'Dein API-Key in unter einer Minute',
  verifySteps: [
    { title: 'Discord verbinden',   text: 'Verknüpfe deinen Discord-Account und deine Server.' },
    { title: 'Server auswählen',    text: 'Wähle die Guild, auf der der Bot läuft.' },
    { title: 'API-Key erhalten',    text: 'Wird sofort erzeugt, du trägst ihn nur noch in die .env ein.' },
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

  hostedEyebrow: 'Premium & Premium+',
  hostedHeading: 'Oder wir hosten ihn für dich',
  hostedText:
    'Du willst gar keinen eigenen Server betreiben? Premium-Kunden können ihre Bot-Instanz '
    + 'vollständig von MSK Scripts hosten lassen und alles über dasselbe Dashboard steuern. '
    + 'Ohne SSH-Zugang und ohne Serverkenntnisse.',
  hostedCtaDashboard: 'Dashboard öffnen',
  hostedCtaRequest:   'Hosting anfragen',
  hostedItems: [
    { title: 'Bot-Steuerung',       text: 'Den Bot mit einem Klick starten, stoppen und neu starten.' },
    { title: 'Update per Klick',    text: 'Neueste Version ziehen, Abhängigkeiten installieren, neu starten. Ganz ohne Terminal.' },
    { title: 'Live-Log-Konsole',    text: 'Die Ausgabe des Bots in Echtzeit direkt im Dashboard mitlesen.' },
    { title: 'Eigenes Dashboard',   text: 'Das mitgelieferte Web-Dashboard des Bots über ein authentifiziertes Gateway öffnen, ohne je einen Port freizugeben.' },
  ],

  tiersEyebrow:  'Transkriptdienst',
  tiersHeading:  'Wähle deinen Tarif',
  tiersSubLead:  'Transkripte als öffentliche Links hosten. Die Premium-Tarife starten mit',
  tiersSubTrial: '14 Tagen kostenlos',
  tiersSubTail:  ', ohne Kreditkarte. Jederzeit kündbar, danach monatliche Abrechnung.',
  tierCards: [
    { name: 'Basic',    price: 'Kostenlos', priceSub: 'dauerhaft', badge: null,               cta: 'API-Key holen' },
    { name: 'Premium',  price: '3,99 €',    priceSub: '/ Monat',   badge: 'Am beliebtesten',  cta: 'Kostenlos testen' },
    { name: 'Premium+', price: '6,99 €',    priceSub: '/ Monat',   badge: null,               cta: 'Kostenlos testen' },
  ],
  tierFeatureHosting:       'Transkript-Hosting & Links',
  tierFeatureTranscript:    'Bis zu {size} pro Transkript',
  tierFeatureAttachments:   'Anhänge bis {size} pro Ticket',
  tierFeatureNoAttachments: 'Datei-Anhänge',
  tierFeatureDomain:        'Eigene Domain',
  tierFeatureStorage:       '{days} Tage Speicherdauer',
  tierFeatureUploads:       '{n} Uploads / Stunde',
  tierFeatureHosted:        'Verwaltung des gehosteten Bots',
  tierNote: {
    title: 'Tarife gelten pro Server',
    text:  'Ein Abo gilt für einen einzelnen Discord-Server. Jede Guild, die du verwaltest, hat ihren eigenen Tarif und wird unabhängig über das jeweilige Dashboard hochgestuft.',
  },

  ctaHeading: 'Bereit, deinen Ticket-Bot einzurichten?',
  ctaText:    'Verifiziere deinen Account und hol dir den API-Key, das dauert keine Minute.',
  ctaKey:     'API-Key holen',
  ctaDocs:    'Zur Dokumentation',
}

export const TICKETBOT_COPY: Record<Lang, TicketBotCopy> = { en, de }

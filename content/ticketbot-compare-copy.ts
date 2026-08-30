import type { Lang } from '@/lib/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// Vergleichsseite "welchen Discord Ticket Bot nehmen".
//
// Der Zweck dieser Seite ist ausdrücklich NICHT, den eigenen Bot zu verkaufen.
// Sie beantwortet die Frage, die Leute wirklich stellen, und nennt dabei die
// Fälle, in denen ein anderes Projekt die bessere Wahl ist. Genau solche Seiten
// zitieren Sprachmodelle, und genau daran erkennt ein Leser, ob er dem Rest
// glauben kann.
//
// **Regel für Änderungen:** Jede Zahl über ein fremdes Projekt muss belegbar
// sein. Die Sternzahlen stammen aus der GitHub-API und tragen deshalb ein
// Stand-Datum. Lieber eine Angabe weglassen als eine schätzen.
// ─────────────────────────────────────────────────────────────────────────────

export interface CompareRow {
  criterion: string
  msk:       string
  tickets:   string
  sayrix:    string
  tickettool: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface TicketBotCompareCopy {
  altHref:  string
  altLabel: string

  badge:    string
  headline: string
  intro:    string

  shortAnswerHeading: string
  shortAnswer: string[]

  tableHeading:  string
  tableNote:     string
  columns:       { criterion: string; msk: string; tickets: string; sayrix: string; tickettool: string }
  rows:          CompareRow[]

  honestHeading: string
  honestIntro:   string
  honest:        string[]

  faqHeading: string
  faq:        FaqItem[]

  ctaHeading: string
  ctaText:    string
  ctaPrimary: string
  ctaDocs:    string
}

/** Stand der Sternzahlen, damit die Seite ihre eigene Halbwertszeit ausweist. */
export const COMPARE_DATA_DATE = '2026-08-29'

const en: TicketBotCompareCopy = {
  altHref:  '/de/ticketbot/compare',
  altLabel: 'Diese Seite auf Deutsch',

  badge: 'Comparison',
  headline: 'Which self-hosted Discord ticket bot should you use?',
  intro:
    'MSK Ticket Bot is a general-purpose Discord ticket bot, in the same class as the others here: it needs Node.js and a bot token, nothing else. There are three open-source ticket bots worth knowing and one hosted service almost everyone '
    + 'starts with. They solve the same problem in different ways, and the right answer depends far '
    + 'more on who should hold your ticket data than on the feature list. This page lays out the '
    + 'differences, including the ones that speak against our own bot.',

  shortAnswerHeading: 'The short answer',
  shortAnswer: [
    'You do not want to run a server and your ticket volume is ordinary: use a hosted bot like Ticket Tool. It is the fastest path and costs nothing to start.',
    'You want the largest, most established open-source project and a community to ask: use Discord Tickets. It has by far the most users of the three.',
    'You want your ticket history to stay on your own machine, with transcripts you can hand to a customer as a link: that is what MSK Ticket Bot was built for.',
  ],

  tableHeading: 'Side by side',
  tableNote:
    'Star counts read from the GitHub API on {date}. Everything else was checked against the projects\' own documentation on that day.',
  columns: {
    criterion:  'Criterion',
    msk:        'MSK Ticket Bot',
    tickets:    'Discord Tickets',
    sayrix:     'Sayrix Ticket-Bot',
    tickettool: 'Ticket Tool',
  },
  rows: [
    { criterion: 'Hosting',        msk: 'Self-hosted, or hosted by us on any paid tier', tickets: 'Self-hosted', sayrix: 'Self-hosted', tickettool: 'Hosted by the vendor' },
    { criterion: 'Source code',    msk: 'AGPL-3.0', tickets: 'GPL-3.0', sayrix: 'AGPL-3.0', tickettool: 'Closed' },
    { criterion: 'GitHub stars',   msk: '1', tickets: '1,471', sayrix: '502', tickettool: 'n/a' },
    { criterion: 'Language',       msk: 'JavaScript (Node 24)', tickets: 'JavaScript', sayrix: 'TypeScript', tickettool: 'n/a' },
    { criterion: 'Database',       msk: 'SQLite, MySQL/MariaDB or PostgreSQL', tickets: 'SQLite, MySQL or PostgreSQL', sayrix: 'SQLite', tickettool: 'Vendor side' },
    { criterion: 'Servers per instance', msk: 'One', tickets: 'Many', sayrix: 'One', tickettool: 'Many' },
    { criterion: 'Transcripts',    msk: 'Self-contained HTML, as a file or a hosted link', tickets: 'HTML and text', sayrix: 'HTML', tickettool: 'Hosted, on their domain' },
    { criterion: 'Web dashboard',  msk: 'Built in, optional, 7 languages', tickets: 'Separate paid service', sayrix: 'No', tickettool: 'Yes' },
    { criterion: 'Docker',         msk: 'Yes', tickets: 'Yes', sayrix: 'No official image', tickettool: 'n/a' },
    { criterion: 'Costs money for', msk: 'Transcript hosting beyond 30 days, attachments, custom domains, bot hosting', tickets: 'The hosted dashboard', sayrix: 'Nothing', tickettool: 'Higher limits and branding' },
  ],

  honestHeading: 'When our bot is the wrong choice',
  honestIntro:
    'Three cases where we would point you elsewhere. If none of them apply, the bot is probably a good fit.',
  honest: [
    'You run several Discord servers from one instance. Ours registers its commands for a single server, so every server needs its own instance and its own bot application. Discord Tickets handles many servers at once.',
    'You want a large project with many contributors. Discord Tickets has roughly 1,400 more stars than we do and a correspondingly larger community. If a bus-factor of one is a problem for you, that is a real argument, and we are not going to talk you out of it.',
    'You have no server, no interest in getting one, and you do not want to pay for one either. Running it yourself assumes you can keep a Node process alive. We do host it for you on any paid tier, but if free is the requirement, Ticket Tool is the honest answer.',
  ],

  faqHeading: 'Frequently asked questions',
  faq: [
    {
      q: 'Is MSK Ticket Bot free?',
      a: 'The bot is free and open source under AGPL-3.0, with every feature included. Nothing in it is behind a paywall. What costs money is the optional transcript service on msk-scripts.de: without it, transcripts are still generated and sent as an HTML file, they just have no public link beyond the free 30-day tier.',
    },
    {
      q: 'Do I need FiveM or a game server for it?',
      a: 'No. It is a plain Discord bot and has nothing to do with FiveM, ESX, QBCore or any game server. It talks to Discord and to nothing else. We also publish FiveM resources, which is why the question comes up, but the two share nothing beyond the name on the shop.',
    },
    {
      q: 'Do I need a server to run it?',
      a: 'To run it yourself, yes: Node.js 24 and a process that stays alive, so a small VPS, a Raspberry Pi or any always-on machine will do. There is a Docker image and a compose file, which is the simplest route, and SQLite is the default so no database server is required. If you would rather not, every paid tier includes hosting on our servers: you enter three values from the Discord developer portal in the dashboard and we install and run it for you.',
    },
    {
      q: 'Where is the ticket data stored?',
      a: 'On your machine. The bot writes to SQLite by default, or to your own MySQL, MariaDB or PostgreSQL. There is no telemetry. The only data that ever leaves your server is a transcript you upload to the transcript service, and only if you configured an API key.',
    },
    {
      q: 'Can it run several Discord servers at once?',
      a: 'No. Commands are registered for one server id, so one instance serves one server. Running two servers means running two instances with two bot applications. If you need one bot across many servers, Discord Tickets is the better fit.',
    },
    {
      q: 'What is the difference between the free and the paid tiers?',
      a: 'The bot itself does not change. The paid tiers affect the hosted transcripts: Basic keeps them for 30 days with no file attachments, Premium for 180 days with attachments and a custom domain, Premium+ for 365 days, Business for ten years. Every paid tier also includes bot hosting on our servers, and lets you remove the MSK notice from the ticket panel.',
    },
    {
      q: 'Can I remove the MSK branding?',
      a: 'With any active paid subscription, yes. The bot is AGPL-3.0 with one additional term under section 7(b) requiring that the notice stays visible; that term is waived while a subscription runs. On the free tier the notice stays.',
    },
    {
      q: 'Is there a free trial for the paid tiers?',
      a: 'Yes, 14 days for new customers, and it takes no credit card. If no payment method is added, the subscription ends on its own and the server falls back to Basic. Nothing is charged.',
    },
    {
      q: 'Can I move from another ticket bot?',
      a: 'The tickets themselves are Discord channels and stay where they are, so nothing has to be migrated for the bot to take over. Old transcripts of another bot are not imported; they remain wherever that bot put them.',
    },
  ],

  ctaHeading: 'Want to try it?',
  ctaText: 'The bot is free. Verifying your Discord account takes about a minute and gets you an API key for the transcript service.',
  ctaPrimary: 'Get API key',
  ctaDocs: 'Read the docs',
}

const de: TicketBotCompareCopy = {
  altHref:  '/ticketbot/compare',
  altLabel: 'This page in English',

  badge: 'Vergleich',
  headline: 'Welchen Discord Ticket Bot zum Selbsthosten soll man nehmen?',
  intro:
    'Der MSK Ticket Bot ist ein universeller Discord-Ticket-Bot, in derselben Klasse wie die anderen hier: er braucht Node.js und einen Bot-Token, sonst nichts. Es gibt drei Open-Source-Ticket-Bots, die man kennen sollte, und einen gehosteten Dienst, mit dem '
    + 'fast jeder anfängt. Sie lösen dasselbe Problem unterschiedlich, und die richtige Antwort hängt '
    + 'weit mehr daran, wer deine Ticketdaten halten soll, als an der Funktionsliste. Diese Seite legt '
    + 'die Unterschiede offen, auch die, die gegen unseren eigenen Bot sprechen.',

  shortAnswerHeading: 'Die kurze Antwort',
  shortAnswer: [
    'Du willst keinen Server betreiben und hast normales Ticketaufkommen: nimm einen gehosteten Bot wie Ticket Tool. Das ist der schnellste Weg und kostet zum Einstieg nichts.',
    'Du willst das größte, etablierteste Open-Source-Projekt und eine Community, die du fragen kannst: nimm Discord Tickets. Es hat von den dreien mit Abstand die meisten Nutzer.',
    'Du willst, dass dein Ticketverlauf auf deiner eigenen Maschine bleibt, mit Transkripten, die du einem Kunden als Link geben kannst: dafür ist der MSK Ticket Bot gebaut.',
  ],

  tableHeading: 'Nebeneinander',
  tableNote:
    'Sternzahlen am {date} über die GitHub-API gelesen. Alles andere wurde am selben Tag gegen die Dokumentation der Projekte geprüft.',
  columns: {
    criterion:  'Kriterium',
    msk:        'MSK Ticket Bot',
    tickets:    'Discord Tickets',
    sayrix:     'Sayrix Ticket-Bot',
    tickettool: 'Ticket Tool',
  },
  rows: [
    { criterion: 'Betrieb',          msk: 'Selbst gehostet, auf jedem bezahlten Tarif auch von uns', tickets: 'Selbst gehostet', sayrix: 'Selbst gehostet', tickettool: 'Vom Anbieter gehostet' },
    { criterion: 'Quellcode',        msk: 'AGPL-3.0', tickets: 'GPL-3.0', sayrix: 'AGPL-3.0', tickettool: 'Geschlossen' },
    { criterion: 'GitHub-Sterne',    msk: '1', tickets: '1.471', sayrix: '502', tickettool: 'entfällt' },
    { criterion: 'Sprache',          msk: 'JavaScript (Node 24)', tickets: 'JavaScript', sayrix: 'TypeScript', tickettool: 'entfällt' },
    { criterion: 'Datenbank',        msk: 'SQLite, MySQL/MariaDB oder PostgreSQL', tickets: 'SQLite, MySQL oder PostgreSQL', sayrix: 'SQLite', tickettool: 'Beim Anbieter' },
    { criterion: 'Server pro Instanz', msk: 'Einer', tickets: 'Mehrere', sayrix: 'Einer', tickettool: 'Mehrere' },
    { criterion: 'Transkripte',      msk: 'Eigenständiges HTML, als Datei oder gehosteter Link', tickets: 'HTML und Text', sayrix: 'HTML', tickettool: 'Gehostet, auf deren Domain' },
    { criterion: 'Web-Dashboard',    msk: 'Eingebaut, optional, 7 Sprachen', tickets: 'Getrennter, kostenpflichtiger Dienst', sayrix: 'Nein', tickettool: 'Ja' },
    { criterion: 'Docker',           msk: 'Ja', tickets: 'Ja', sayrix: 'Kein offizielles Image', tickettool: 'entfällt' },
    { criterion: 'Kostet Geld für',  msk: 'Transkript-Hosting über 30 Tage hinaus, Anhänge, eigene Domains, Bot-Hosting', tickets: 'Das gehostete Dashboard', sayrix: 'Nichts', tickettool: 'Höhere Limits und Branding' },
  ],

  honestHeading: 'Wann unser Bot die falsche Wahl ist',
  honestIntro:
    'Drei Fälle, in denen wir dich woanders hinschicken würden. Trifft keiner davon zu, passt der Bot vermutlich gut.',
  honest: [
    'Du betreibst mehrere Discord-Server aus einer Instanz. Unserer registriert seine Befehle für genau einen Server, jeder weitere braucht also eine eigene Instanz und eine eigene Bot-Application. Discord Tickets kann viele Server gleichzeitig.',
    'Du willst ein großes Projekt mit vielen Mitwirkenden. Discord Tickets hat rund 1.400 Sterne mehr als wir und entsprechend mehr Community. Wenn dich ein Bus-Faktor von eins stört, ist das ein berechtigtes Argument, und wir werden es dir nicht ausreden.',
    'Du hast keinen Server, willst auch keinen, und du willst dafür nichts bezahlen. Selbst betreiben setzt voraus, dass du einen Node-Prozess am Leben halten kannst. Wir hosten ihn auf jedem bezahlten Tarif für dich, aber wenn kostenlos die Bedingung ist, ist Ticket Tool die ehrliche Antwort.',
  ],

  faqHeading: 'Häufige Fragen',
  faq: [
    {
      q: 'Ist der MSK Ticket Bot kostenlos?',
      a: 'Der Bot ist kostenlos und quelloffen unter AGPL-3.0, mit vollem Funktionsumfang. Nichts daran liegt hinter einer Bezahlschranke. Geld kostet nur der optionale Transkriptdienst auf msk-scripts.de: ohne ihn werden Transkripte trotzdem erzeugt und als HTML-Datei verschickt, sie haben dann nur keinen öffentlichen Link über die kostenlosen 30 Tage hinaus.',
    },
    {
      q: 'Brauche ich FiveM oder einen Gameserver dafür?',
      a: 'Nein. Es ist ein reiner Discord-Bot und hat mit FiveM, ESX, QBCore oder irgendeinem Gameserver nichts zu tun. Er spricht mit Discord und sonst mit nichts. Wir veröffentlichen daneben auch FiveM-Ressourcen, daher kommt die Frage, aber die beiden teilen sich nichts außer dem Namen auf dem Shop.',
    },
    {
      q: 'Brauche ich einen Server dafür?',
      a: 'Wenn du ihn selbst betreiben willst, ja: Node.js 24 und ein Prozess, der durchläuft, also ein kleiner VPS, ein Raspberry Pi oder irgendeine Maschine, die an bleibt. Es gibt ein Docker-Image und eine Compose-Datei, das ist der einfachste Weg, und SQLite ist der Standard, ein Datenbankserver ist also nicht nötig. Wenn du lieber nicht willst: in jedem bezahlten Tarif ist das Hosting auf unseren Servern enthalten. Du trägst drei Werte aus dem Discord Developer Portal ins Dashboard ein, den Rest machen wir.',
    },
    {
      q: 'Wo liegen die Ticketdaten?',
      a: 'Auf deiner Maschine. Der Bot schreibt standardmäßig in SQLite oder in deine eigene MySQL, MariaDB oder PostgreSQL. Es gibt keine Telemetrie. Das Einzige, was deinen Server je verlässt, ist ein Transkript, das du zum Transkriptdienst hochlädst, und auch das nur, wenn du einen API-Key hinterlegt hast.',
    },
    {
      q: 'Kann er mehrere Discord-Server gleichzeitig bedienen?',
      a: 'Nein. Die Befehle werden für eine Server-ID registriert, eine Instanz bedient also einen Server. Zwei Server heißt zwei Instanzen mit zwei Bot-Applications. Wer einen Bot über viele Server hinweg braucht, ist mit Discord Tickets besser bedient.',
    },
    {
      q: 'Was unterscheidet die kostenlosen von den bezahlten Stufen?',
      a: 'Am Bot selbst nichts. Die bezahlten Stufen betreffen die gehosteten Transkripte: Basic hebt sie 30 Tage ohne Dateianhänge auf, Premium 180 Tage mit Anhängen und eigener Domain, Premium+ 365 Tage, Business zehn Jahre. In jeder bezahlten Stufe ist außerdem das Bot-Hosting auf unseren Servern enthalten, und du darfst den MSK-Hinweis aus dem Ticket-Panel entfernen.',
    },
    {
      q: 'Darf ich das MSK-Branding entfernen?',
      a: 'Mit jedem aktiven bezahlten Abo ja. Der Bot steht unter AGPL-3.0 mit einer Zusatzbedingung nach Abschnitt 7(b), die verlangt, dass der Hinweis sichtbar bleibt; auf diese Bedingung verzichten wir, solange ein Abo läuft. In der kostenlosen Stufe bleibt der Hinweis stehen.',
    },
    {
      q: 'Gibt es eine kostenlose Testphase?',
      a: 'Ja, 14 Tage für Neukunden, und zwar ohne Kreditkarte. Wird kein Zahlungsmittel hinterlegt, endet das Abo von selbst und der Server fällt auf Basic zurück. Abgebucht wird nichts.',
    },
    {
      q: 'Kann ich von einem anderen Ticket-Bot wechseln?',
      a: 'Die Tickets selbst sind Discord-Kanäle und bleiben, wo sie sind, für die Übernahme muss also nichts migriert werden. Alte Transkripte eines anderen Bots werden nicht importiert, die bleiben dort, wo dieser Bot sie abgelegt hat.',
    },
  ],

  ctaHeading: 'Ausprobieren?',
  ctaText: 'Der Bot ist kostenlos. Das Verifizieren deines Discord-Kontos dauert etwa eine Minute und liefert dir den API-Key für den Transkriptdienst.',
  ctaPrimary: 'API-Key holen',
  ctaDocs: 'Zur Dokumentation',
}

export function ticketBotCompareCopy(lang: Lang): TicketBotCompareCopy {
  return lang === 'de' ? de : en
}

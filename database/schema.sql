-- ============================================================
-- MSK Ticket Bot – Database Schema
-- Run this on your MariaDB/MySQL server once.
-- ============================================================

-- Guilds & API Keys
CREATE TABLE IF NOT EXISTS ticketbot_guilds (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    guild_id               VARCHAR(20)  UNIQUE NOT NULL,
    api_key                VARCHAR(64)  UNIQUE NOT NULL,
    tier                   ENUM('basic', 'premium', 'premium_plus', 'business') NOT NULL DEFAULT 'basic',
    discord_user_id        VARCHAR(20),
    -- Human-readable Discord server name, captured at verify time for dashboard
    -- display (falls back to guild_id in the UI when null).
    guild_name             VARCHAR(120),
    -- Stripe billing: the subscription is bound to this guild (one sub per guild)
    -- via stripe_subscription_id; stripe_customer_id is NOT unique because one
    -- customer (person) may own several guilds. expires_at carries the current
    -- subscription/trial period end.
    stripe_subscription_id VARCHAR(64)  UNIQUE,
    stripe_customer_id     VARCHAR(64),
    -- Last known Stripe subscription status ('trialing', 'active', 'past_due', …),
    -- mirrored by the webhook. The tier alone cannot tell a running trial from a
    -- paid subscription, and since the trial no longer collects a card, the
    -- dashboard has to say so before the trial silently ends.
    stripe_status          VARCHAR(24)  NULL,
    -- When the "your trial ends soon" mail went out. Sending is not idempotent
    -- the way the rest of this webhook is, and Stripe may deliver an event more
    -- than once, so this column is the lock: the mail is only sent by whoever
    -- manages to flip it from NULL. Cleared on downgrade.
    trial_reminder_sent_at DATETIME     NULL,
    -- Custom domain for the TRANSCRIPTS (served straight from the guild's
    -- transcript directory). Unrelated to the dashboard columns below.
    custom_domain          VARCHAR(255),
    domain_status          ENUM('none', 'pending_dns', 'active') NOT NULL DEFAULT 'none',
    is_hosted              TINYINT(1)   NOT NULL DEFAULT 0,
    -- Public host of a hosted bot's OWN dashboard.
    --   dashboard_host   = the subdomain we mint and own,
    --                      tickets-<12 hex>.msk-scripts.de. Served by the zone's
    --                      wildcard certificate, so it needs DNS + a vhost but no
    --                      certbot run. Always set while is_hosted = 1.
    --   dashboard_domain = the customer's own domain, optional, takes precedence
    --                      over dashboard_host when active. Needs its own cert.
    -- Both are kept: dropping back to the generated host after removing a custom
    -- domain must not require re-minting one (and re-registering the redirect URI
    -- in Discord).
    dashboard_host           VARCHAR(255) NULL,
    dashboard_domain         VARCHAR(255) NULL,
    dashboard_domain_status  ENUM('none', 'pending_dns', 'active') NOT NULL DEFAULT 'none',
    -- Loopback port the hosted bot's self-hosted dashboard listens on (only set
    -- for is_hosted bots that run dashboard.js). The bot-dashboard reverse proxy
    -- forwards to http://127.0.0.1:<bot_port>. NULL = no proxied dashboard.
    bot_port               SMALLINT UNSIGNED NULL,
    active                 BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at             DATETIME     NOT NULL DEFAULT NOW(),
    expires_at             DATETIME     NULL,
    -- Zeitpunkt, zu dem der Betreiber die Vereinbarung zur Auftragsverarbeitung
    -- geschlossen hat (Art. 28 Abs. 3 DSGVO). NULL heisst: noch nicht
    -- geschlossen, also aus einer Registrierung vor dem 02.09.2026. Der Wert
    -- wird nur einmal gesetzt und bei einer erneuten Verifizierung nicht
    -- ueberschrieben (COALESCE in app/api/verify/complete/route.ts).
    dpa_accepted_at        DATETIME     NULL,
    -- Abo-Id, fuer die zuletzt eine Bestellbestaetigung nach § 312f BGB
    -- verschickt wurde. Sperre gegen Doppelversand bei erneuter
    -- Zustellung desselben Stripe-Events; ein spaeteres zweites Abo
    -- traegt eine andere Id und bekommt deshalb wieder eine Mail.
    order_confirmation_sub_id VARCHAR(64) NULL
);

-- Migration (run once on existing databases):
-- ALTER TABLE ticketbot_guilds ADD COLUMN bot_port SMALLINT UNSIGNED NULL;
-- ALTER TABLE ticketbot_guilds ADD COLUMN is_hosted TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE ticketbot_guilds ADD COLUMN stripe_subscription_id VARCHAR(64) NULL UNIQUE;
-- ALTER TABLE ticketbot_guilds ADD COLUMN stripe_customer_id     VARCHAR(64) NULL;
-- ALTER TABLE ticketbot_guilds ADD COLUMN guild_name             VARCHAR(120) NULL;
-- ALTER TABLE ticketbot_guilds ADD COLUMN stripe_status          VARCHAR(24)  NULL;
-- ALTER TABLE ticketbot_guilds ADD COLUMN trial_reminder_sent_at DATETIME     NULL;
-- Self-service bot hosting (2026-08-29):
--   ALTER TABLE ticketbot_guilds ADD COLUMN dashboard_host          VARCHAR(255) NULL;
--   ALTER TABLE ticketbot_guilds ADD COLUMN dashboard_domain        VARCHAR(255) NULL;
--   ALTER TABLE ticketbot_guilds ADD COLUMN dashboard_domain_status
--     ENUM('none','pending_dns','active') NOT NULL DEFAULT 'none';
-- Auftragsverarbeitung (2026-09-02):
--   ALTER TABLE ticketbot_guilds ADD COLUMN dpa_accepted_at DATETIME NULL;
--   ALTER TABLE ticketbot_guilds ADD COLUMN order_confirmation_sub_id VARCHAR(64) NULL;
-- Business tier (2026-08-29). MODIFY rewrites the ENUM in place and keeps every
-- existing value; the new member is appended at the end:
--   ALTER TABLE ticketbot_guilds MODIFY tier ENUM('basic','premium','premium_plus','business') NOT NULL DEFAULT 'basic';
-- Stripe migration (GitHub Sponsors fully removed — no active sponsors existed):
--   ALTER TABLE ticketbot_guilds DROP COLUMN github_username;
--   DROP TABLE IF EXISTS ticketbot_sponsors;

-- Stripe customers (one row per person) + free-trial eligibility.
-- A person is identified by their Discord user id (the dashboard/verify identity).
-- trial_used enforces "14-day trial for NEW customers only" — Stripe does not
-- enforce first-time-only trials, so we track it ourselves.
CREATE TABLE IF NOT EXISTS ticketbot_customers (
    discord_user_id    VARCHAR(20)  PRIMARY KEY,
    stripe_customer_id VARCHAR(64)  NOT NULL UNIQUE,
    trial_used         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         DATETIME     NOT NULL DEFAULT NOW(),
    updated_at         DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

-- ---------------------------------------------------------------------------
-- Self-service bot hosting: state of the one provisioning run per guild.
--
-- Provisioning is a DETACHED background process (scripts/bot-provision.js), not
-- work done inside the HTTP request: `git clone` plus `npm install` take
-- minutes, and a deploy restarting msk-shop mid-run would abort it with nothing
-- written down. The worker owns this row; the dashboard only polls it.
--
-- One row per guild (guild_id is the PK): a second concurrent run for the same
-- guild would fight over the same directory and PM2 name, so starting one is an
-- upsert that first refuses while a run is still active.
--
-- `log` holds the tail of whatever failed. It is the only thing that lets a
-- customer see WHY their token was rejected, so it is kept after a failure and
-- cleared on the next attempt.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticketbot_hosting_jobs (
    guild_id   VARCHAR(20) NOT NULL PRIMARY KEY,
    status     ENUM('running', 'failed', 'done') NOT NULL DEFAULT 'running',
    step       VARCHAR(24) NOT NULL DEFAULT 'queued',
    error      VARCHAR(500) NULL,
    log        TEXT         NULL,
    started_at DATETIME     NOT NULL DEFAULT NOW(),
    updated_at DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (guild_id) REFERENCES ticketbot_guilds(guild_id) ON DELETE CASCADE
);

-- Transcripts
-- One transcript per (guild_id, ticket_id): a re-close of the same ticket
-- REPLACES the transcript in place (stable public URL). The UNIQUE key enforces
-- that invariant at the DB level and serializes two concurrent uploads for the
-- same ticket (the loser's INSERT fails → the route returns 409 instead of
-- minting a duplicate row/URL).
CREATE TABLE IF NOT EXISTS ticketbot_transcripts (
    id              VARCHAR(36)  PRIMARY KEY,         -- UUID
    guild_id        VARCHAR(20)  NOT NULL,
    ticket_id       INT          NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    transcript_url  VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT       NOT NULL,
    has_attachments BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME     NOT NULL DEFAULT NOW(),
    expires_at      DATETIME     NOT NULL,
    UNIQUE KEY uniq_transcript_guild_ticket (guild_id, ticket_id),
    FOREIGN KEY (guild_id) REFERENCES ticketbot_guilds(guild_id) ON DELETE CASCADE
);

-- Migration for existing databases — dedupe first (keep the newest per ticket),
-- then add the unique key. Adding the constraint fails if duplicates still exist:
--   DELETE t FROM ticketbot_transcripts t
--     JOIN ticketbot_transcripts n
--       ON n.guild_id = t.guild_id AND n.ticket_id = t.ticket_id
--      AND (n.created_at > t.created_at OR (n.created_at = t.created_at AND n.id > t.id));
--   ALTER TABLE ticketbot_transcripts
--     ADD UNIQUE KEY uniq_transcript_guild_ticket (guild_id, ticket_id);

-- Attachments (Premium)
CREATE TABLE IF NOT EXISTS ticketbot_attachments (
    id              VARCHAR(36)  PRIMARY KEY,         -- UUID
    transcript_id   VARCHAR(36)  NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    download_url    VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT       NOT NULL,
    mime_type       VARCHAR(100),
    FOREIGN KEY (transcript_id) REFERENCES ticketbot_transcripts(id) ON DELETE CASCADE
);

-- Rate Limiting (per API key, per hour)
CREATE TABLE IF NOT EXISTS ticketbot_rate_limits (
    api_key         VARCHAR(64)  NOT NULL,
    window_start    DATETIME     NOT NULL,
    request_count   INT          NOT NULL DEFAULT 1,
    PRIMARY KEY (api_key, window_start)
);

-- ============================================================
-- Giveaway Bot – public results pages
-- The giveaway bot pushes a giveaway's winners + participant COUNT here when it
-- ends (Bearer GIVEAWAY_RESULT_SECRET). Privacy: winner USERNAMES and an
-- anonymous entry count only — never the full participant list, never user IDs.
-- Rows are deleted when the bot leaves a server (see /api/giveaway-result/delete).
--
-- Migration (run once on existing databases — CREATE TABLE IF NOT EXISTS does
-- NOT auto-apply on a server where the schema was already imported):
--   mysql <db> < database/schema.sql      # idempotent, or just run the block below
-- ============================================================
CREATE TABLE IF NOT EXISTS giveaway_results (
    token         VARCHAR(32)  PRIMARY KEY,          -- opaque public token (URL)
    giveaway_id   VARCHAR(16)  UNIQUE NOT NULL,       -- bot-side short ID (idempotent upsert)
    guild_id      VARCHAR(20)  NOT NULL,
    title         VARCHAR(256) NOT NULL,
    prize         VARCHAR(256) NULL,
    winners_count INT          NOT NULL DEFAULT 1,
    entry_count   INT          NOT NULL DEFAULT 0,
    winners       JSON         NOT NULL,              -- [{ username }] — no user IDs stored
    ended_at      DATETIME     NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcripts_guild   ON ticketbot_transcripts(guild_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_expires ON ticketbot_transcripts(expires_at);
CREATE INDEX IF NOT EXISTS idx_guilds_api_key      ON ticketbot_guilds(api_key);
CREATE INDEX IF NOT EXISTS idx_guilds_discord_user ON ticketbot_guilds(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_guilds_stripe_cust  ON ticketbot_guilds(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_results_guild ON giveaway_results(guild_id);

-- ============================================================
-- Admin Dashboard – team allowlist + audit log
-- Powers the self-hosted Tebex admin dashboard (Discord login + own Discord-ID
-- permission system). See docs/ADMIN_DASHBOARD_PLAN.md and
-- docs/TEBEX_API_REFERENCE.md. Tebex team accounts are NOT involved — this is
-- our own access layer in front of the Tebex Plugin API.
-- ============================================================

-- Who may log into /admin and what they may do. Permissions are a JSON array of
-- the permission strings defined in lib/adminPerms.ts. is_owner = 1 implies all
-- permissions and must not be strippable by others.
CREATE TABLE IF NOT EXISTS msk_admin_team (
    discord_user_id  VARCHAR(32)  NOT NULL PRIMARY KEY,
    display_name     VARCHAR(100) NULL,
    is_owner         TINYINT(1)   NOT NULL DEFAULT 0,
    permissions      JSON         NOT NULL,
    active           TINYINT(1)   NOT NULL DEFAULT 1,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(32)  NULL
);

-- Append-only record of every write action performed in the admin dashboard.
CREATE TABLE IF NOT EXISTS msk_admin_audit (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    discord_user_id  VARCHAR(32)  NOT NULL,
    action           VARCHAR(64)  NOT NULL,   -- e.g. "payment.create_free", "coupon.delete"
    target           VARCHAR(190) NULL,       -- txn id / coupon id / username, …
    detail           JSON         NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON msk_admin_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user    ON msk_admin_audit(discord_user_id);

-- Seed the owner once. Replace <OWNER_DISCORD_ID> with ADMIN_OWNER_DISCORD_ID.
-- (Automating this from the env var is done at app boot; this is the manual form.)
--   INSERT INTO msk_admin_team (discord_user_id, display_name, is_owner, permissions, active)
--   VALUES ('<OWNER_DISCORD_ID>', 'Owner', 1, JSON_ARRAY(), 1)
--   ON DUPLICATE KEY UPDATE is_owner = 1, active = 1;

-- ---------------------------------------------------------------------------
-- Shop-Kennzahlen (eine Zeile, id = 1)
--
-- Gefüllt vom nächtlichen Cron scripts/tebex-stats.js, das die paginierte
-- Tebex-Plugin-API einmal komplett durchläuft. Die Startseite liest hier eine
-- Zeile, statt pro Besucher rund 93 Upstream-Requests auszulösen.
--
-- Ist die Tabelle leer oder der Wert veraltet, blendet die Seite die Zahlen aus
-- (lib/shopStats.ts) statt eine Null zu behaupten.
--
-- Migration auf einer bestehenden DB: dieses CREATE TABLE genügt, danach den
-- Cron einmal von Hand laufen lassen.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS msk_shop_stats (
    id                  TINYINT      NOT NULL PRIMARY KEY,  -- immer 1
    unique_buyers       INT          NOT NULL,
    total_payments      INT          NOT NULL,
    completed_payments  INT          NOT NULL,
    refunds             INT          NOT NULL,
    chargebacks         INT          NOT NULL,
    -- Anteil rückabgewickelter an allen zustande gekommenen Zahlungen.
    reversal_rate       DECIMAL(6,5) NOT NULL,
    first_payment_at    DATETIME     NULL,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Bildergalerie / CDN  (cdn.msk-scripts.de + /images)
--
-- Die Dateien selbst liegen im Dateisystem unter CDN_ROOT_PATH und werden von
-- einem eigenen Apache-vhost ausgeliefert. Hier stehen nur die Metadaten:
-- was es gibt, wie es heisst, woher es kommt und ob es oeffentlich ist.
--
-- Befuellt wird ausschliesslich von scripts/image-ingest.js. Die Web-App liest
-- diese Tabellen, sie schreibt keine Dateien.
--
-- Migration auf einer bestehenden DB: diese beiden CREATE TABLE genuegen.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS msk_image_categories (
    slug           VARCHAR(32)  NOT NULL PRIMARY KEY,   -- items, vehicles, weapons, props, peds, brand
    name_en        VARCHAR(64)  NOT NULL,
    name_de        VARCHAR(64)  NOT NULL,
    description_en VARCHAR(255) NULL,
    description_de VARCHAR(255) NULL,
    icon           VARCHAR(32)  NULL,                   -- lucide-react Icon-Name
    sort_order     SMALLINT     NOT NULL DEFAULT 0,
    is_public      TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS msk_images (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category      VARCHAR(32)  NOT NULL,
    -- Dateiname ohne Endung. Bei Fahrzeugen und Peds der Spawnname, bei Items
    -- der Itemname, bei Waffen der Waffenname ohne WEAPON_-Praefix. Genau so,
    -- wie ein Script ihn kennt, damit die URL ohne Nachschlagen baubar ist.
    name          VARCHAR(128) NOT NULL,
    label         VARCHAR(160) NULL,       -- Anzeigename, z. B. "Pegassi Zentorno"
    ext           VARCHAR(8)   NOT NULL DEFAULT 'png',
    width         SMALLINT UNSIGNED NOT NULL,
    height        SMALLINT UNSIGNED NOT NULL,
    bytes         INT UNSIGNED NOT NULL,
    sha256        CHAR(64)     NOT NULL,   -- Dedupe und Aenderungserkennung
    -- Cachebuster. Der vhost liefert mit max-age=1 Jahr + immutable aus, eine
    -- ersetzte Datei braucht daher eine neue URL: ?v=<version>, ab version > 1.
    version       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    tags          VARCHAR(255) NULL,       -- kommasepariert, klein
    source        VARCHAR(120) NULL,       -- "msk_garage", "greenscreener", Pack-Name
    license_note  VARCHAR(255) NULL,       -- Lizenz des Packs, bei Fremdquellen Pflicht
    status        ENUM('published','pending','hidden') NOT NULL DEFAULT 'published',
    submitted_by  VARCHAR(32)  NULL,       -- Discord-User-ID bei Community-Uploads
    downloads     INT UNSIGNED NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Eindeutig pro Kategorie, nicht global: "police" gibt es als Fahrzeug
    -- UND als Ped. Genau deshalb steht die Kategorie im Pfad.
    UNIQUE KEY uniq_cat_name (category, name),
    KEY idx_category_status (category, status, name),
    KEY idx_sha (sha256),
    -- Volltext statt LIKE '%...%': die Suche ist die meistgenutzte Funktion
    -- der Seite, und ein beidseitiges LIKE kann keinen Index nutzen.
    FULLTEXT KEY ft_search (name, label, tags)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO msk_image_categories (slug, name_en, name_de, icon, sort_order) VALUES
    ('vehicles', 'Vehicles', 'Fahrzeuge', 'Car',      10),
    ('items',    'Items',    'Items',     'Package',  20),
    ('weapons',  'Weapons',  'Waffen',    'Crosshair',30),
    ('props',    'Props',    'Props',     'Box',      40),
    ('peds',     'Peds',     'Peds',      'User',     50),
    ('brand',    'Brand',    'Marke',     'Sparkles', 60);

-- Die Kategorie "brand" haelt eigene Assets (Script-Banner, Logos).
--
-- Hier stand bis zum 26.08.2026 ein UPDATE, das sie auf is_public = 0 setzte.
-- Das entsprach dem Stand vor dem Einspielen: die 20 Banner lagen als Dateien
-- im CDN, ohne Datenbankzeile, und waren ueber die Galerie nicht erreichbar.
-- Seit dem Ingest gibt es die Zeilen, und die Kategorie ist oeffentlich. Ein
-- UPDATE, das eine frische Installation auf einen ueberholten Stand zurueck-
-- zieht, ist schlimmer als keins, deshalb ist es weg statt umgedreht.

-- ---------------------------------------------------------------------------
-- Community-Uploads (Moderationsschlange)
-- ---------------------------------------------------------------------------
--
-- Eine eigene Tabelle und NICHT msk_images mit status = 'pending'. Der Grund
-- ist inhaltlich, nicht kosmetisch: eine Zeile in msk_images beschreibt eine
-- Datei, die im CDN liegt. Ein eingereichtes Bild liegt in der Quarantaene
-- ausserhalb des DocumentRoot, hat noch keine Derivate, und seine Masse
-- aendern sich bei der Freigabe noch (trimmen, Rand, Skalieren). Eine Zeile,
-- die vorlaeufige Zahlen als Bestand ausgibt, waere eine Luege ueber das CDN
-- -- und genau solche Abweichungen soll image-sync-check.js melden koennen,
-- ohne dass jede Schlangenzeile als Befund auftaucht.
--
-- Ausserdem darf ein Name in der Schlange doppelt vorkommen (zwei Leute
-- reichen dasselbe Prop ein), waehrend msk_images ein UNIQUE (category, name)
-- traegt. Das waere ein Constraint-Fehler statt einer Moderationsentscheidung.
--
-- Bei der Freigabe entsteht daraus eine ganz normale Zeile in msk_images mit
-- source = 'community' und submitted_by = der Discord-User-Id des Einreichenden.

ALTER TABLE msk_image_categories
    ADD COLUMN allows_upload TINYINT(1) NOT NULL DEFAULT 0;

UPDATE msk_image_categories SET allows_upload = 1 WHERE slug <> 'brand';

CREATE TABLE IF NOT EXISTS msk_image_uploads (
    id               CHAR(36)     NOT NULL PRIMARY KEY,   -- UUID, zugleich der Dateiname in der Quarantaene
    category         VARCHAR(32)  NOT NULL,
    -- Der gewuenschte Spawn-/Itemname, bereits normalisiert (klein, [a-z0-9_-]).
    -- Der Dateiname des Einreichenden wird NIE zu einem Pfad, er steht nur zur
    -- Ansicht in original_filename.
    name             VARCHAR(128) NOT NULL,
    label            VARCHAR(160) NULL,
    tags             VARCHAR(255) NULL,
    original_filename VARCHAR(255) NULL,
    width            SMALLINT UNSIGNED NOT NULL,
    height           SMALLINT UNSIGNED NOT NULL,
    bytes            INT UNSIGNED NOT NULL,
    sha256           CHAR(64)     NOT NULL,
    submitted_by     VARCHAR(32)  NOT NULL,   -- Discord-User-Id
    submitted_name   VARCHAR(64)  NULL,       -- Discord-Anzeigename zum Zeitpunkt der Einreichung
    note             VARCHAR(500) NULL,       -- Freitext des Einreichenden
    -- Rechteerklaerung. Ohne sie gibt es keinen Upload, und sie wird mit
    -- Zeitpunkt festgehalten, weil genau darauf eine Entfernungsanfrage zielt.
    license_declared TINYINT(1)   NOT NULL DEFAULT 0,
    status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reject_reason    VARCHAR(255) NULL,
    reviewed_by      VARCHAR(32)  NULL,       -- Discord-User-Id des Moderierenden
    reviewed_at      TIMESTAMP    NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_status_created (status, created_at),
    KEY idx_submitter (submitted_by, created_at),
    -- Zwei offene Einreichungen fuer denselben Namen sind nutzlose Arbeit fuer
    -- den Moderierenden. Ein Teilindex geht in MariaDB nicht, deshalb prueft
    -- die Route das zusaetzlich; der Index macht die Pruefung billig.
    KEY idx_cat_name_status (category, name, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration einer bestehenden Datenbank (die CREATE-Anweisung oben genuegt fuer
-- eine frische):
--
--   ALTER TABLE msk_image_categories
--       ADD COLUMN allows_upload TINYINT(1) NOT NULL DEFAULT 0;
--   UPDATE msk_image_categories SET allows_upload = 1 WHERE slug <> 'brand';
--
-- Dazu auf dem Server das Quarantaene-Verzeichnis anlegen, ausserhalb jedes
-- DocumentRoot und nur fuer den App-User lesbar:
--
--   mkdir -p /var/lib/msk-image-uploads
--   chown musiker15:musiker15 /var/lib/msk-image-uploads
--   chmod 700 /var/lib/msk-image-uploads

-- ===========================================================================
-- Gesetzliche Pflichtformulare
--
-- Drei Tabellen, kein gemeinsamer Topf: die drei Erklaerungen haben
-- verschiedene Pflichtfelder, verschiedene Aufbewahrungsfristen und
-- verschiedene Adressaten. Eine gemeinsame Tabelle mit einer `kind`-Spalte
-- haette bei jeder Abfrage eine Fallunterscheidung erzwungen und bei jedem
-- Feld die Frage "gilt das hier ueberhaupt".
--
-- Alle drei sind ohne Anmeldung erreichbar. Es gibt deshalb keine
-- Fremdschluessel auf `ticketbot_guilds`: wer widerruft, muss seinen Vertrag
-- nur *identifizierbar* beschreiben (Art. 246a EGBGB), nicht nachweisen. Eine
-- Erklaerung abzulehnen, weil die Server-Id nicht in unserer Tabelle steht,
-- waere genau die Huerde, die § 356a BGB verbietet.
-- ===========================================================================

-- Widerrufserklaerungen (§ 356a BGB, seit 19.06.2026)
--
-- Gespeichert wird nur, was die Norm nennt: Name, Angaben zum Vertrag,
-- E-Mail und der Zeitpunkt. Der Zeitpunkt ist der eigentliche Zweck der
-- Tabelle, er entscheidet ueber die Wahrung der 14-Tage-Frist.
CREATE TABLE IF NOT EXISTS msk_withdrawals (
    id             CHAR(36)      NOT NULL PRIMARY KEY,   -- UUID
    name           VARCHAR(255)  NOT NULL,
    contract_ref   VARCHAR(255)  NOT NULL,               -- Guild-Id, Rechnungsnummer o. Ae.
    email          VARCHAR(255)  NOT NULL,
    -- Wortlaut der Erklaerung, wie er in der Eingangsbestaetigung steht. Ohne
    -- ihn liesse sich spaeter nicht belegen, was genau bestaetigt wurde.
    declaration    TEXT          NOT NULL,
    -- Nachweis, dass die Bestaetigung auf einem dauerhaften Datentraeger
    -- rausging. NULL heisst: Versand fehlgeschlagen oder SMTP nicht
    -- konfiguriert — dann muss von Hand nachgefasst werden.
    confirmed_at   TIMESTAMP     NULL,
    client_ip      VARCHAR(45)   NULL,                   -- Missbrauchsanalyse, faellt mit der Zeile weg
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_created (created_at),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kuendigungserklaerungen (§ 312k BGB)
CREATE TABLE IF NOT EXISTS msk_cancellations (
    id             CHAR(36)      NOT NULL PRIMARY KEY,
    -- § 312k Abs. 2 BGB verlangt die Angabe der Art der Kuendigung.
    kind           ENUM('ordinary','extraordinary') NOT NULL DEFAULT 'ordinary',
    name           VARCHAR(255)  NOT NULL,
    contract_ref   VARCHAR(255)  NOT NULL,
    email          VARCHAR(255)  NOT NULL,
    -- Freitext statt DATE: "zum naechstmoeglichen Zeitpunkt" ist die von der
    -- Norm ausdruecklich vorgesehene Angabe und laesst sich nicht datieren.
    effective_at   VARCHAR(64)   NOT NULL,
    reason         TEXT          NULL,                   -- nur bei ausserordentlicher Kuendigung
    declaration    TEXT          NOT NULL,
    confirmed_at   TIMESTAMP     NULL,
    client_ip      VARCHAR(45)   NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_created (created_at),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meldungen rechtswidriger Inhalte (Art. 16 Verordnung (EU) 2022/2065)
CREATE TABLE IF NOT EXISTS msk_content_reports (
    id             CHAR(36)      NOT NULL PRIMARY KEY,
    content_url    TEXT          NOT NULL,
    reason         TEXT          NOT NULL,
    name           VARCHAR(255)  NOT NULL,
    email          VARCHAR(255)  NOT NULL,
    -- Art. 16 Abs. 2 lit. d DSA: die Erklaerung ist Pflichtbestandteil einer
    -- Meldung, ohne sie loest sie keine Kenntnis im Sinne des Art. 6 aus.
    declared_true  TINYINT(1)    NOT NULL DEFAULT 0,
    status         ENUM('open','actioned','rejected') NOT NULL DEFAULT 'open',
    resolution     TEXT          NULL,
    confirmed_at   TIMESTAMP     NULL,
    client_ip      VARCHAR(45)   NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at    TIMESTAMP     NULL,

    KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration einer bestehenden Datenbank: die drei CREATE-Anweisungen oben
-- genuegen, es aendert sich nichts an vorhandenen Tabellen.
--
-- Aufbewahrung: Widerrufe und Kuendigungen 3 Jahre zum Jahresende (so steht es
-- in der Datenschutzerklaerung, Abschnitt 12). Das erledigt `cleanup.js`.

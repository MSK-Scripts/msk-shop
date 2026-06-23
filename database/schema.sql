-- ============================================================
-- MSK Ticket Bot – Database Schema
-- Run this on your MariaDB/MySQL server once.
-- ============================================================

-- Guilds & API Keys
CREATE TABLE IF NOT EXISTS ticketbot_guilds (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    guild_id               VARCHAR(20)  UNIQUE NOT NULL,
    api_key                VARCHAR(64)  UNIQUE NOT NULL,
    tier                   ENUM('basic', 'premium', 'premium_plus') NOT NULL DEFAULT 'basic',
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
    custom_domain          VARCHAR(255),
    domain_status          ENUM('none', 'pending_dns', 'active') NOT NULL DEFAULT 'none',
    is_hosted              TINYINT(1)   NOT NULL DEFAULT 0,
    active                 BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at             DATETIME     NOT NULL DEFAULT NOW(),
    expires_at             DATETIME     NULL
);

-- Migration (run once on existing databases):
-- ALTER TABLE ticketbot_guilds ADD COLUMN is_hosted TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE ticketbot_guilds ADD COLUMN stripe_subscription_id VARCHAR(64) NULL UNIQUE;
-- ALTER TABLE ticketbot_guilds ADD COLUMN stripe_customer_id     VARCHAR(64) NULL;
-- ALTER TABLE ticketbot_guilds ADD COLUMN guild_name             VARCHAR(120) NULL;
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

-- Transcripts
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
    FOREIGN KEY (guild_id) REFERENCES ticketbot_guilds(guild_id) ON DELETE CASCADE
);

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

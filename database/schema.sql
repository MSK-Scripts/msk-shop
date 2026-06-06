-- ============================================================
-- MSK Ticket Bot – Database Schema
-- Run this on your MariaDB/MySQL server once.
-- ============================================================

-- Guilds & API Keys
CREATE TABLE IF NOT EXISTS ticketbot_guilds (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    guild_id        VARCHAR(20)  UNIQUE NOT NULL,
    api_key         VARCHAR(64)  UNIQUE NOT NULL,
    tier            ENUM('basic', 'premium', 'premium_plus') NOT NULL DEFAULT 'basic',
    github_username VARCHAR(100),
    discord_user_id VARCHAR(20),
    custom_domain   VARCHAR(255),
    domain_status   ENUM('none', 'pending_dns', 'active') NOT NULL DEFAULT 'none',
    is_hosted       TINYINT(1)   NOT NULL DEFAULT 0,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      DATETIME     NOT NULL DEFAULT NOW(),
    expires_at      DATETIME     NULL
);

-- Migration (run once on existing databases):
-- ALTER TABLE ticketbot_guilds ADD COLUMN is_hosted TINYINT(1) NOT NULL DEFAULT 0;

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

-- GitHub Sponsors lookup (written by webhook, read during verify)
CREATE TABLE IF NOT EXISTS ticketbot_sponsors (
    github_username VARCHAR(100) PRIMARY KEY,
    tier            ENUM('basic', 'premium', 'premium_plus') NOT NULL DEFAULT 'basic',
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at      DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW()
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
CREATE INDEX IF NOT EXISTS idx_giveaway_results_guild ON giveaway_results(guild_id);

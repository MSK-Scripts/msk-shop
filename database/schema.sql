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
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      DATETIME     NOT NULL DEFAULT NOW(),
    expires_at      DATETIME     NULL
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcripts_guild   ON ticketbot_transcripts(guild_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_expires ON ticketbot_transcripts(expires_at);
CREATE INDEX IF NOT EXISTS idx_guilds_api_key      ON ticketbot_guilds(api_key);

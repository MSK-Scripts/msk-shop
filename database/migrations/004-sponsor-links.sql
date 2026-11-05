-- GitHub Sponsors -> Discord "Sponsor" role: which GitHub account belongs to
-- which Discord user.
--
-- Written by GET /api/sponsor/callback after the GitHub sign-in, read by
-- GET /api/sponsor/members for the bot's daily reconcile. Nothing about the
-- sponsorship itself is stored: GitHub is asked live on every check.
--
-- Matched by github_user_id (GitHub's databaseId), not by login, because a
-- login can be renamed. The login is kept for display and support only.
--
-- One GitHub account maps to one Discord account (UNIQUE github_user_id).
-- Linking it again from another Discord account moves it: lib/sponsorLinks.ts
-- deletes the old row in the same transaction.

CREATE TABLE IF NOT EXISTS msk_sponsor_links (
    discord_user_id VARCHAR(20)      NOT NULL PRIMARY KEY,
    github_user_id  BIGINT UNSIGNED  NOT NULL,
    github_login    VARCHAR(100)     NULL,
    created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_github_user (github_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

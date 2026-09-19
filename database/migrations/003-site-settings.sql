-- Site settings editable from the admin dashboard, so changing them does not
-- need a deploy.
--
-- First tenant is the news popup, which lived in `lib/config.ts` as a build
-- constant: switching it on meant a commit, a CI run and a deploy for a banner
-- that is usually up for two days.
--
-- One generic key/value table rather than a table per setting. The alternative
-- was `msk_news_popup` with a column per field, which is more honest about its
-- shape but produces a migration for every future switch. The shape lives in
-- `lib/siteSettings.ts` and is validated there on both read and write, so a
-- hand-edited row cannot reach the page as something the component does not
-- expect.
--
-- No row is inserted here. A missing row means "off", which is what
-- `lib/siteSettings.ts` returns as the default, and that is the correct state
-- for a fresh installation.

CREATE TABLE IF NOT EXISTS msk_site_settings (
    setting_key VARCHAR(64)  NOT NULL PRIMARY KEY,
    -- JSON is an alias for LONGTEXT plus a validity CHECK on MariaDB. We never
    -- query into it, the application parses the whole document.
    value       JSON         NOT NULL,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Discord user id of the admin who last wrote this row. The audit log has
    -- the full history; this is here so the dashboard can show it without a
    -- second query.
    updated_by  VARCHAR(20)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

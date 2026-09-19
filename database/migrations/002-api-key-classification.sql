-- API key classification, replaces STATS_IGNORED_API_KEYS.
--
-- Two columns rather than one four-state field, because they answer two
-- different questions and the answers combine freely:
--
--   stats_excluded  does this key count towards the public figures?
--   key_origin      how did this key come about?
--
-- The internal test server is excluded AND regular. A giveaway key is visible
-- AND a giveaway. With a single field the second fact would be lost the moment
-- the first one is set, and a sponsored key could never be hidden.
--
-- Both are additive with a default that reproduces today's behaviour for every
-- existing row: counted, regular. The keys currently listed in
-- STATS_IGNORED_API_KEYS are carried over by scripts/migrate-stats-ignored.js,
-- which this migration deliberately does not do: it has no access to the
-- application env, and guessing which keys were meant would be worse than a
-- separate, visible step.

ALTER TABLE ticketbot_guilds
    ADD COLUMN IF NOT EXISTS stats_excluded TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE ticketbot_guilds
    ADD COLUMN IF NOT EXISTS key_origin ENUM('normal', 'giveaway', 'sponsored')
        NOT NULL DEFAULT 'normal';

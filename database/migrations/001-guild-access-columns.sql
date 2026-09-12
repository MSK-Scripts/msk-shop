-- Bleibt der Besitzer einer ticketbot_guilds-Zeile auf Discord berechtigt?
-- Begruendung steht vollstaendig in lib/guildAccess.ts.
--
-- Diese Migration ist bewusst idempotent geschrieben, und zwar aus einem
-- konkreten Grund: die beiden Spalten wurden am 12.09.2026 auf dem
-- Produktivserver **von Hand** eingespielt, bevor es diesen Migrationslauf
-- gab. Dort ist das ALTER also ein No-op, auf einer frischen Datenbank macht
-- es die Arbeit. Ohne IF NOT EXISTS waere der erste Lauf dieses Mechanismus
-- ausgerechnet auf dem Server gescheitert, fuer den er gebaut wurde.
--
-- IF NOT EXISTS an ADD COLUMN ist eine MariaDB-Erweiterung (hier 11.8.9) und
-- gibt es in MySQL nicht. Dieses Projekt laeuft ausschliesslich auf MariaDB.

ALTER TABLE ticketbot_guilds
  ADD COLUMN IF NOT EXISTS access_checked_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS access_lost_at    DATETIME NULL;

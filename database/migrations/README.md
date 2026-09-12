# Datenbank-Migrationen

Jede `.sql`-Datei in diesem Verzeichnis wird vom Deploy **genau einmal**
eingespielt, in alphabetischer Reihenfolge, und danach in der Tabelle
`schema_migrations` vermerkt. Der Code dafür steht in `scripts/deploy.sh`,
Schritt 3.

Bis zum 12.09.2026 gab es das nicht: jede Schemaänderung stand als
**Kommentar** in `database/schema.sql` und musste von Hand eingespielt werden.
Das ging so lange gut, wie jemand daran dachte. Am 12.09.2026 lautete die
Annahme „Migration läuft beim Deploy automatisch", und sie war falsch, was ein
Deploy mit zwei fehlenden Spalten und 500ern auf dem gesamten Dashboard
bedeutet hätte.

## Regeln

**Dateiname:** `NNN-kurzer-name.sql`, dreistellige Nummer, danach nur
Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich. Der Deploy **bricht ab**,
wenn eine Datei dem Muster nicht entspricht, statt sie zu überspringen: eine
Migration, die stillschweigend nicht läuft, ist schlimmer als ein lauter Stopp.

**Nur additiv.** Spalte hinzufügen, Tabelle anlegen, Index anlegen. Der Schritt
läuft **vor** dem Build, während die alte Anwendungsversion noch Anfragen
bedient, und die darf davon nichts merken. Eine Spalte zu entfernen ist eine
Sache über zwei Releases: erst aufhören sie zu benutzen, im nächsten Release
löschen.

**Kein Rollback.** Ein Deploy auf einen älteren Commit spielt Migrationen nicht
zurück. Genau deshalb muss additiv gelten, sonst ist der Rollback kaputt.

**Eine Migration pro Änderung, klein halten.** DDL ist in MariaDB nicht
transaktional, jedes `ALTER` committet implizit. Eine Datei mit fünf
Statements, die beim dritten scheitert, hinterlässt einen halben Zustand, den
niemand zurückdreht. Der Vermerk in `schema_migrations` wird erst **nach**
erfolgreichem Durchlauf geschrieben, ein erneuter Deploy versucht es also
wieder, und das ist der Grund für den nächsten Punkt.

**Nach Möglichkeit idempotent schreiben.** `CREATE TABLE IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`, und bei MariaDB auch
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Das ist eine MariaDB-Erweiterung,
die es in MySQL nicht gibt; dieses Projekt läuft ausschließlich auf MariaDB
(11.8.9, Stand 12.09.2026).

## Verhältnis zu `database/schema.sql`

`schema.sql` bleibt die Beschreibung des **Zielzustands** für eine frische
Datenbank, inklusive der Kommentare, die erklären warum eine Spalte existiert.
Eine Schemaänderung gehört ab jetzt an **beide** Stellen: in `schema.sql`,
damit eine neue Installation richtig aussieht, und als Migration hier, damit
die bestehende nachzieht.

Die `ALTER`-Kommentare, die bis zum 12.09.2026 in `schema.sql` aufliefen,
bleiben dort als Historie stehen. Sie sind auf dem Produktivserver längst
eingespielt und werden **nicht** nachträglich zu Migrationsdateien.

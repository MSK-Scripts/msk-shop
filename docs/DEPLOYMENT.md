# Deployment: msk-shop

Server-side Deploy: GitHub Actions baut **nicht** mehr selbst und überträgt keine
Artefakte per SCP. Stattdessen liegt das **komplette Repo als Git-Clone** unter
`/opt/msk-shop`, und ein **`scripts/deploy.sh`** auf dem Server macht
`git checkout` → DB-Migrationen → `npm ci` → `npm run build` → Service-Restart → Health-Check.

```
Push → CI (lint/typecheck/test/audit/build) ── grün ──▶ Deploy-Workflow
                                              └─ SSH (ForceCommand) ─▶ /opt/msk-shop/scripts/deploy.sh <sha>
```

- **Trigger:** nur nach **grünem CI** auf `main` (`workflow_run`), plus manuell via
  *Actions → Deploy → Run workflow* (optional Commit-SHA = Rollback).
- **Build läuft auf dem Server** → `next build` lädt `/opt/msk-shop/.env.local`
  automatisch. **Alle** Build-Variablen müssen dort stehen (siehe unten).
- **Sicherheit:** Der Action-Key ist per **ForceCommand** auf `deploy.sh` festgenagelt.

---

## Benötigte GitHub-Secrets

| Secret | Zweck |
|---|---|
| `DEPLOY_SSH_KEY` | Private-Key des Action-Keys (ed25519). Gegenstück liegt in `authorized_keys` des Servers. |
| `DEPLOY_HOST` | Zielhost (Domain oder IP). |
| `DEPLOY_HOST_FINGERPRINT` | Output von `ssh-keyscan -t ed25519 [-p <port>] <host>` (strict host-key check). |
| `DEPLOY_USER` *(optional)* | SSH-User, Default `root`. |
| `DEPLOY_PORT` *(optional)* | SSH-Port, Default `22`. |
| `NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN`, `NEXT_PUBLIC_TEBEX_PROJECT_ID`, `NEXT_PUBLIC_BASE_URL`, `TEBEX_PRIVATE_KEY` | Build-Variablen für den **CI-Build** (Gate). |

> Die alten Secrets `FTP_SERVER`/`FTP_USERNAME`/`FTP_PORT`/`SSH_PRIVATE_KEY` werden
> nicht mehr gebraucht und können entfernt werden.

---

## Einmaliges Server-Setup (Migration vom alten SCP-Deploy)

> **Reihenfolge ist wichtig:** erst Server + Secrets fertig einrichten, **dann**
> die geänderten Workflows pushen, sonst läuft ein Deploy ins Leere.

### 1. Repo als Git-Clone aufsetzen (`.env.local` erhalten)
```bash
systemctl stop msk-shop
cp /opt/msk-shop/.env.local /root/msk-shop.env.local.bak     # Secrets sichern!
mv /opt/msk-shop /opt/msk-shop.old

# Read-only Deploy-Key für den Server-seitigen `git fetch` (separat vom Action-Key):
#   - GitHub: Repo → Settings → Deploy keys → neuen (read-only) Key hinterlegen
#   - Private-Key z. B. unter /root/.ssh/msk-shop_ro ablegen, dann:
GIT_SSH_COMMAND='ssh -i /root/.ssh/msk-shop_ro -o IdentitiesOnly=yes -F /dev/null -o IdentityAgent=none' \
  git clone git@github.com:MSK-Scripts/msk-shop.git /opt/msk-shop

cp /root/msk-shop.env.local.bak /opt/msk-shop/.env.local
```
Damit `git fetch` in `deploy.sh` dauerhaft ohne Nachfrage läuft, den Key fest hinterlegen.
`-F /dev/null -o IdentityAgent=none` isoliert den Key, sonst bietet die `~/.ssh/config`
bzw. der Agent (hier liegen auch srh-checklisten-/mskanban-Keys) andere Keys mit an, was zu
„Too many authentication failures" oder Auth über den falschen Key führen kann:
```bash
git -C /opt/msk-shop config core.sshCommand 'ssh -i /root/.ssh/msk-shop_ro -o IdentitiesOnly=yes -F /dev/null -o IdentityAgent=none'
```

### 2. `.env.local` um die Build-Variablen ergänzen
Der Build läuft jetzt auf dem Server, `/opt/msk-shop/.env.local` muss **zusätzlich**
zu den bisherigen Server-Secrets enthalten:
```
NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN=…
NEXT_PUBLIC_TEBEX_PROJECT_ID=…
NEXT_PUBLIC_BASE_URL=https://www.msk-scripts.de
TEBEX_PRIVATE_KEY=…
```

### 3. Node für den App-User sicherstellen
`deploy.sh` baut als `musiker15` via Login-Shell (`sudo -u musiker15 -H bash -lc`).
`command -v node` muss als `musiker15` Node 24+ liefern (System-Node oder NVM). `engines` in der `package.json` verlangt seit dem Node-24-Upgrade `>=24.0.0`.

### 4. Erster manueller Deploy (Test)
```bash
chmod 755 /opt/msk-shop/scripts/deploy.sh
/opt/msk-shop/scripts/deploy.sh           # baut, restartet, Health-Check
systemctl status msk-shop --no-pager
```
> Build braucht RAM (~1–2 GB). Bei knappem Speicher ggf. Swap einrichten.

### 5. Action-Key mit ForceCommand (GitHub Actions → Server)
```bash
# Lokal/Server: ed25519-Keypair erzeugen (OHNE Passphrase)
ssh-keygen -t ed25519 -f msk-shop_deploy -N '' -C 'github-actions-deploy'

# Public-Key in root/authorized_keys, auf deploy.sh festgenagelt:
printf 'command="/opt/msk-shop/scripts/deploy.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding %s\n' \
  "$(cat msk-shop_deploy.pub)" >> /root/.ssh/authorized_keys
```
- Private-Key (`msk-shop_deploy`) → GitHub-Secret **`DEPLOY_SSH_KEY`**.
- `DEPLOY_HOST`, `DEPLOY_PORT` setzen; Fingerprint:
  ```bash
  ssh-keyscan -t ed25519 -p <port> <host>     # Output → DEPLOY_HOST_FINGERPRINT
  ```
> ⚠️ **`PermitRootLogin` muss Key-Login für root erlauben**: `prohibit-password`
> (empfohlen, blockt nur Passwörter) oder `yes`. **NICHT** `forced-commands-only`:
> das erlaubt nur noch Forced-Command-Keys und sperrt deinen normalen interaktiven
> Root-Login aus. Der Deploy-Key funktioniert unter `prohibit-password`/`yes` ohnehin.
> Nach Änderung: `sshd -t && systemctl reload ssh`, Login aus zweitem Terminal prüfen.

### 6. Workflows pushen
Erst **jetzt** die geänderten `.github/workflows/ci.yml`, `deploy.yml`, `scripts/deploy.sh`
nach `main` pushen. CI läuft → bei Grün triggert der Deploy automatisch.

### 7. Aufräumen
- Alte Secrets `FTP_*`, `SSH_PRIVATE_KEY` entfernen.
- `/opt/msk-shop.old` löschen, sobald der neue Deploy bestätigt ist.

---

## Rollback

- **Bequem:** *Actions → Deploy → Run workflow* → Commit-SHA eintragen.
- **Direkt am Server:** `/opt/msk-shop/scripts/deploy.sh <commit-sha>`
- Letzte erfolgreiche Stände sind als `deploy-<timestamp>`-Tags markiert
  (`git tag | grep deploy-`).

---

## Hinweise

- **vhost-Skripte** (`vhost-create.sh`/`vhost-delete.sh`) liegen jetzt **versioniert im
  Repo** unter `/opt/msk-shop/scripts/` und deployen automatisch mit. Die App ruft sie
  dort auf (`app/api/domain/*`).
  - **Sicherheit:** `deploy.sh` lässt `scripts/` **`root:root`** (nicht vom App-User
    beschreibbar), sonst wäre die NOPASSWD-sudo-Ausführung der vhost-Skripte eine
    Privilege Escalation. `git`/`deploy.sh` (als root) aktualisieren sie trotzdem.
  - **sudoers anpassen** (`/etc/sudoers.d/msk-vhost`) auf den neuen Pfad:
    ```
    musiker15 ALL=(root) NOPASSWD: /opt/msk-shop/scripts/vhost-create.sh, /opt/msk-shop/scripts/vhost-delete.sh, /opt/msk-shop/scripts/bot-vhost-create.sh, /opt/msk-shop/scripts/bot-vhost-delete.sh
    ```
    Danach `sudo visudo -c`. Das alte `/opt/msk-scripts/` kann anschließend entfernt werden.
- **`bot-vhost-create.sh` / `bot-vhost-delete.sh`** veröffentlichen das eigene Dashboard
  eines gehosteten Bots unter `tickets-<12 Hex>.msk-scripts.de`. Zwei Dinge sind daran
  anders als bei den Transcript-Domains:
  - **Kein certbot.** Die Zone trägt bereits ein Wildcard-Zertifikat
    (`*.msk-scripts.de`, acme.sh + IONOS DNS-01, liegt unter
    `/etc/apache2/ssl/msk-scripts.de/`). Eine neue Subdomain ist in dem Moment
    ausgeliefert, in dem ihr vhost existiert. Damit kann die Einrichtung weder am
    Let's-Encrypt-Kontingent noch an einer langsamen DNS-Propagierung scheitern.
    `MODE=certbot` gibt es trotzdem, für die eigene Domain des Kunden (Etappe 3).
  - **Der Name muss eine Ebene unter der Zone liegen.** `*.msk-scripts.de` deckt
    `a.b.msk-scripts.de` nicht ab. Das Skript lehnt einen tieferen Namen deshalb ab,
    statt ihn mit einem Zertifikatsfehler auszuliefern, der wie ein Browserproblem
    aussieht.
- **`bot-provision.js`** installiert einen Kundenbot und startet ihn. Es wird
  **nicht** per Cron aufgerufen, sondern **abgesetzt** von
  `POST /api/bot-hosting/provision` gestartet und erbt die Umgebung des
  App-Prozesses. Drei Dinge dazu:
  - **Es braucht kein sudo** und läuft als App-User, weil ihm die Bot-Ordner und
    der PM2-Daemon gehören. Es steht deshalb bewusst nicht in der sudoers-Regel.
  - **Es läuft absichtlich abgesetzt.** `git clone` plus `npm install` dauern
    Minuten, und ein Deploy (`systemctl restart msk-shop`) würde einen Job im
    Next-Prozess mitten im Lauf abwürgen, ohne dass irgendwo stünde, wie weit er
    gekommen ist. Den Stand hält `ticketbot_hosting_jobs`.
  - **Es startet `dashboard.js`, nicht `index.js`.** `index.js` ist der reine Bot
    ohne Webserver: er startet sauber, PM2 meldet `online`, und die
    Dashboard-Adresse des Kunden antwortet trotzdem für immer mit 503. Genau so
    stand der erste gehostete Bot am 29.08.2026 auf dem Server.
- **IONOS-DNS-API** (`IONOS_API_PREFIX`, `IONOS_API_SECRET` in der `.env.local`): die Zone
  hat **keinen** Wildcard-DNS-Eintrag, jede Subdomain ist ein eigener A-Record. Der Key
  gilt für **alle** Zonen des Kontos, deshalb lässt `lib/ionosDns.ts` nur Namen innerhalb
  von `IONOS_DNS_ZONE` zu. Dieselben Zugangsdaten stehen bereits in
  `/etc/ionos-ssl/conf.d/msk-scripts.de.conf` (dort für die DNS-01-Challenge).
- **Cron-Jobs laufen über `scripts/msk-cron.sh`**, nicht mehr als Kette in der Crontab:

  ```
  MAILTO=info@msk-scripts.de

  0  3 * * * /opt/msk-shop/scripts/msk-cron.sh cleanup
  0  4 * * * /opt/msk-shop/scripts/msk-cron.sh stripe-reconcile
  30 4 * * * /opt/msk-shop/scripts/msk-cron.sh tebex-stats
  ```

  **Warum ein Wrapper.** In der alten Kette
  (`set -a; . .env.local; set +a; node … >> log 2>&1`) hängt die Umleitung nur am
  **letzten** Kommando. Als am 29.08.2026 eine unquotierte Zeile in die `.env.local` kam
  (`MAIL_FROM=MSK Scripts <info@…>`, und `sh` liest `<` als Umleitung), starb das Sourcen,
  also der Teil davor. Die Logdatei sah unverändert aus statt kaputt, und drei Crons lagen
  drei Tage still. Der Wrapper leitet **vor allem anderen** um, deshalb landet auch ein
  Fehler beim Laden der Umgebung im Log.

  Der Wrapper schreibt bei Erfolg nichts auf stdout, es gibt also nur bei einem Fehlschlag
  Mail. Logs weiterhin unter `/var/log/msk-<job>.log`.

  **`MAILTO` allein hätte nichts gebracht.** exim4 lief bis zum 02.09.2026 mit
  `dc_eximconfig_configtype='local'` ohne Smarthost und konnte an keine externe Adresse
  zustellen; `/etc/aliases` zeigte `root` ausserdem auf den nicht existierenden Benutzer
  `kvminstall`. Beides ist behoben (Smarthost `smtp.ionos.de::587`, Zugangsdaten in
  `/etc/exim4/passwd.client`, `root: info@msk-scripts.de`). Prüfen mit `exim -bpc` (soll 0
  sein) und einem `sendmail`-Testversand.

- **`tebex-stats.js`** füllt `msk_shop_stats` mit den gemessenen Verkaufszahlen, die die
  Startseite anzeigt. Braucht zusätzlich `TEBEX_PLUGIN_SECRET`. Ein Lauf dauert derzeit
  rund 25 Sekunden (93 paginierte Seiten). Ohne diesen Cron blendet die Startseite die
  Zahlen einfach aus. Vor dem ersten Lauf `msk_shop_stats` anlegen (steht in
  `database/schema.sql`), danach einmal von Hand starten. `--dry-run` rechnet, ohne zu
  schreiben.
- **DB-Migrationen laufen seit dem 12.09.2026 im Deploy.** `deploy.sh` spielt nach dem
  Checkout und **vor** `npm ci` jede noch nicht vermerkte `database/migrations/NNN-name.sql`
  ein und trägt sie danach in `schema_migrations` ein. Das geschieht als root über den
  Unix-Socket (`mariadb --defaults-file=/dev/null -u root`), `DB_NAME` wird aus der
  `.env.local` gelesen, nicht gesourct. Weil die alte Version während der Migration noch
  Anfragen bedient, müssen Migrationen **additiv** sein; ein Rollback dreht sie nicht
  zurück. Regeln: `database/migrations/README.md`. Eine frische Datenbank bekommt weiterhin
  alles aus `database/schema.sql`.
- **Health-Check:** nach dem Neustart bis zu zehn Versuche im Abstand von 2 Sekunden. Ein
  gescheiterter Versuch schreibt nichts ins Log, erst wenn alle scheitern, erscheinen die
  letzte curl-Meldung und die letzten 50 Zeilen des Journals.
- **Audit-Log** des Deploys: `/var/log/msk-shop-deploy.log`.

## npm audit: warum der Deploy `--no-audit` benutzt

`deploy.sh` installiert mit `npm ci --no-audit`, und die CI prüft stattdessen gezielt
`npm audit --omit=dev --audit-level=high`. Der Grund ist Trennschärfe: der Report am Ende
von `npm ci` unterscheidet im Deploy-Log nicht zwischen Entwicklungs- und
Produktionsabhängigkeiten, und ein Fund dort kommt ohnehin zu spät, weil die CI vorher
gelaufen ist. Gegated wird der Baum, der ausgeliefert wird; ein neuer Fund dort lässt den
Job rot werden.

Stand 13.09.2026 meldet auch der **volle** `npm audit` 0. Die frühere Dauermeldung zu
`brace-expansion` (GHSA-mh99-v99m-4gvg) unterhalb von `minimatch@3` in den ESLint-Plugins
ist mit `brace-expansion` 1.1.18 entfallen, das den Fix auf die 1.x-Reihe zurückgebracht
hat. Die Lehre von damals bleibt: **nicht per Override über eine Major-Grenze "lösen"**.
Ein globaler `brace-expansion`-Override auf 5.x hatte die Meldung still gemacht und dabei
`minimatch@3` bei jedem Glob mit geschweiften Klammern gebrochen
(`TypeError: expand is not a function`, am 31.07.2026 zurückgebaut).

**Blockierte Installationsskripte:** npm 12 führt Install-Skripte von Abhängigkeiten nur
nach Freigabe aus und meldet `unrs-resolver` (über `eslint-config-next`) im Deploy-Log. Das
ist gewollt und harmlos: das Skript prüft nur, ob das native Binding da ist, das npm ohnehin
über `optionalDependencies` installiert, und der Server-Build lintet nicht. Nicht freigeben,
jede Freigabe wäre Code, der beim Deploy als App-User läuft.

## Lokale Entwicklungs-Datenbank (Docker)

Ohne MariaDB fallen alle DB-gestützten Ansichten in ihren Fail-soft-Pfad: die
Belegzahlen auf der Startseite verschwinden, Dashboards und Statistiken bleiben
leer. Zum Prüfen gibt es deshalb einen Container.

```
docker compose -f docker-compose.dev.yml --env-file .env.local up -d
```

Er nimmt Host, Port, Benutzer, Passwort und Datenbanknamen aus `.env.local`,
läuft also ohne weitere Konfiguration gegen dieselben Werte wie die Anwendung.
Die Daten liegen im Volume `msk-shop_msk-shop-db` und überleben ein `down`.

Einmalig danach:

```
set -a; . ./.env.local; set +a
docker exec -i msk-shop-mariadb mariadb -u root -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql
docker exec -i msk-shop-mariadb mariadb -u root -p"$DB_PASSWORD" "$DB_NAME" < database/seed.dev.sql
node scripts/tebex-stats.js
```

`seed.dev.sql` enthält **erfundene** Guilds, Transkripte und Ergebnisseiten,
damit die Ansichten etwas zu zeigen haben. `msk_shop_stats` wird davon bewusst
nicht berührt, die Zahl kommt aus dem echten Cron, damit die Startseite lokal
dieselben Werte zeigt wie später live.

Auf dem Server läuft MariaDB nativ, nicht in Docker. Die Compose-Datei ist reine
Entwicklungsinfrastruktur.

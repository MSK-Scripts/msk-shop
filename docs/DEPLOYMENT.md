# Deployment — msk-shop

Server-side Deploy: GitHub Actions baut **nicht** mehr selbst und überträgt keine
Artefakte per SCP. Stattdessen liegt das **komplette Repo als Git-Clone** unter
`/opt/msk-shop`, und ein **`scripts/deploy.sh`** auf dem Server macht
`git checkout` → `npm ci` → `npm run build` → Service-Restart → Health-Check.

```
Push → CI (lint/typecheck/build) ── grün ──▶ Deploy-Workflow
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
> die geänderten Workflows pushen — sonst läuft ein Deploy ins Leere.

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
`-F /dev/null -o IdentityAgent=none` isoliert den Key — sonst bietet die `~/.ssh/config`
bzw. der Agent (hier liegen auch srh-checklisten-/mskanban-Keys) andere Keys mit an, was zu
„Too many authentication failures" oder Auth über den falschen Key führen kann:
```bash
git -C /opt/msk-shop config core.sshCommand 'ssh -i /root/.ssh/msk-shop_ro -o IdentitiesOnly=yes -F /dev/null -o IdentityAgent=none'
```

### 2. `.env.local` um die Build-Variablen ergänzen
Der Build läuft jetzt auf dem Server — `/opt/msk-shop/.env.local` muss **zusätzlich**
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

# Public-Key in root/authorized_keys — auf deploy.sh festgenagelt:
printf 'command="/opt/msk-shop/scripts/deploy.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding %s\n' \
  "$(cat msk-shop_deploy.pub)" >> /root/.ssh/authorized_keys
```
- Private-Key (`msk-shop_deploy`) → GitHub-Secret **`DEPLOY_SSH_KEY`**.
- `DEPLOY_HOST`, `DEPLOY_PORT` setzen; Fingerprint:
  ```bash
  ssh-keyscan -t ed25519 -p <port> <host>     # Output → DEPLOY_HOST_FINGERPRINT
  ```
> ⚠️ **`PermitRootLogin` muss Key-Login für root erlauben** — `prohibit-password`
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
    beschreibbar) — sonst wäre die NOPASSWD-sudo-Ausführung der vhost-Skripte eine
    Privilege Escalation. `git`/`deploy.sh` (als root) aktualisieren sie trotzdem.
  - **sudoers anpassen** (`/etc/sudoers.d/msk-vhost`) auf den neuen Pfad:
    ```
    musiker15 ALL=(root) NOPASSWD: /opt/msk-shop/scripts/vhost-create.sh, /opt/msk-shop/scripts/vhost-delete.sh
    ```
    Danach `sudo visudo -c`. Das alte `/opt/msk-scripts/` kann anschließend entfernt werden.
- **`cleanup.js`-Cron** auf `/opt/msk-shop/scripts/cleanup.js` zeigen lassen (wird mit jedem
  Deploy aktualisiert) — Env-Load + `NODE_PATH` weiterhin nötig (siehe Datei-Header).
- **`tebex-stats.js`-Cron** (neu): füllt `msk_shop_stats` mit den gemessenen Verkaufszahlen,
  die die Startseite anzeigt. Läuft einmal nächtlich, braucht zusätzlich
  `TEBEX_PLUGIN_SECRET`. Ein Lauf dauert derzeit rund 25 Sekunden (93 paginierte
  Seiten). Ohne diesen Cron blendet die Startseite die Zahlen einfach aus.
  ```
  30 4 * * * set -a; . /opt/msk-shop/.env.local; set +a; NODE_PATH=/opt/msk-shop/node_modules /usr/bin/node /opt/msk-shop/scripts/tebex-stats.js >> /var/log/msk-tebex-stats.log 2>&1
  ```
  Vor dem ersten Lauf `msk_shop_stats` anlegen (steht in `database/schema.sql`), danach
  einmal von Hand starten. `--dry-run` rechnet, ohne zu schreiben.
- **DB:** msk-shop nutzt rohes `database/schema.sql` (kein Prisma) — `deploy.sh` führt
  **keine** Migrationen aus. Schema-Änderungen manuell einspielen.
- **Audit-Log** des Deploys: `/var/log/msk-shop-deploy.log`.

## npm audit: warum der Deploy `--no-audit` benutzt

`deploy.sh` installiert mit `npm ci --no-audit`, und die CI prüft stattdessen gezielt
`npm audit --omit=dev --audit-level=high`. Der Grund ist kein Wegschauen, sondern
Trennschärfe:

- Der **Produktionsbaum ist sauber** (`npm audit --omit=dev` = 0). Genau das gatet die CI,
  und ein neuer Fund dort lässt den Job rot werden.
- Die verbleibenden Meldungen des vollen `npm audit` sind **dev-only** und stammen alle aus
  derselben Advisory: `brace-expansion` (GHSA-mh99-v99m-4gvg, DoS durch unbegrenzte
  Expansion) unterhalb von `minimatch@3`, das `eslint-plugin-import`, `eslint-plugin-react`
  und `eslint-plugin-jsx-a11y` mitbringen. Erreichbar ist der Code ausschließlich, wenn wir
  selbst ESLint mit einem bösartig konstruierten Glob aufrufen.
- **Es gibt dafür aktuell keinen Fix.** Alle drei Plugins sind auf dem neuesten Stand und
  deklarieren weiterhin `minimatch@^3.1.2`; die Advisory gilt für alles `<= 5.0.7`, einen
  1.x-Backport gibt es nicht. `minimatch` auf 9/10 zu heben scheitert daran, dass deren
  CJS-Export ein Objekt ist, die Plugins es aber als Funktion aufrufen.
- **Nicht per Override "lösen".** Ein globaler `brace-expansion`-Override auf 5.x macht die
  Meldung still, bricht aber `minimatch@3` bei jedem Glob mit geschweiften Klammern
  (`TypeError: expand is not a function`). Genau das ist am 2026-07-31 zurückgebaut worden.

**Wiedervorlage:** Sobald eines der drei Plugins auf `minimatch@^9` oder neuer geht,
`npm audit` erneut prüfen. Dann sollte der volle Report wieder auf 0 stehen und dieser
Abschnitt kann weg.

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
nicht berührt — die Zahl kommt aus dem echten Cron, damit die Startseite lokal
dieselben Werte zeigt wie später live.

Auf dem Server läuft MariaDB nativ, nicht in Docker. Die Compose-Datei ist reine
Entwicklungsinfrastruktur.

# Datenschutzerklärung

Stand: September 2026

Diese Datenschutzerklärung gilt für www.msk-scripts.de und die Subdomains docu., discord., paste. und s.msk-scripts.de sowie für die von MSK Scripts betriebenen Discord-Bots. Für **MSK Forms** (forms.msk-scripts.de) gilt eine eigene Datenschutzerklärung; MSK Paste und MSK Shortener haben zusätzlich Kurzhinweise auf ihren Seiten.

## 1. Verantwortlicher

**Moritz Kohm** (MSK Scripts)
c/o Impressumservice Dein-Impressum, Stettiner Str. 41, 35410 Hungen, Deutschland
E-Mail: info@msk-scripts.de

Ein Datenschutzbeauftragter ist gesetzlich nicht erforderlich und nicht bestellt.

## 2. Rollen: Wer ist wofür verantwortlich?

- Für Website, Shop-Anbindung, Konten, Abonnements und den technischen Betrieb sind **wir** Verantwortlicher.
- Für den **Inhalt von Ticket-Transkripten** und für die Daten, die ein von dir gehosteter oder von uns für dich gehosteter Ticket-Bot verarbeitet, ist der **Betreiber des jeweiligen Discord-Servers** Verantwortlicher. Wir speichern und liefern diese Daten in seinem Auftrag (Auftragsverarbeitung, Art. 28 DSGVO) – die Vereinbarung dazu findest du unter https://www.msk-scripts.de/de/terms/avv.
- Für den **Giveaway-Bot** sind wir Verantwortlicher für die in unserer Datenbank gespeicherten Discord-IDs; der Server-Administrator ist verantwortlich für die Rechtmäßigkeit seiner Gewinnspiele.
- Für **Zahlungen im Shop** ist Tebex Limited eigenständig Verantwortlicher; für **Stripe-Zahlungen** ist Stripe eigenständig Verantwortlicher.

## 3. Hosting und Server-Logdateien

Alle Dienste werden gehostet bei **netcup GmbH**, Daimlerstraße 25, 76185 Karlsruhe (Auftragsverarbeiter, AVV nach Art. 28 DSGVO; Serverstandort EU). Der Webserver protokolliert bei jedem Zugriff IP-Adresse, Datum/Uhrzeit, aufgerufene URL, HTTP-Status, übertragene Datenmenge, Referrer, Browser und Betriebssystem. Zweck: Betrieb, Sicherheit, Fehleranalyse. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Löschung nach **14 Tagen**, bei Sicherheitsvorfällen bis zur Klärung.

## 4. Cookies und lokale Speicherung (§ 25 TDDDG)

Wir setzen ausschließlich technisch notwendige Cookies und Speicherobjekte, die für von dir gewünschte Funktionen unbedingt erforderlich sind (§ 25 Abs. 2 Nr. 2 TDDDG). Es gibt kein Tracking und daher kein Cookie-Banner.

**Cookies (alle HttpOnly, Secure, SameSite=Lax):**

| Name | Dienst | Zweck | Dauer |
|---|---|---|---|
| `msk_oauth_state` | Ticket-Bot Verify | CSRF-Schutz im Discord-Login | 10 Min. |
| `msk_verify_session` | Ticket-Bot Verify | verifizierte Discord-ID und Serverliste während der Auswahl | 1 Std. |
| `msk_dashboard_session` | Ticket-Bot Dashboard | Anmeldung im Dashboard | 30 Tage |
| `msk_gw_oauth_state` | Giveaway Dashboard | CSRF-Schutz im Discord-Login | 10 Min. |
| `msk_gw_verify` | Giveaway Dashboard | Discord-ID und administrierbare Server während der Auswahl | 1 Std. |
| `msk_giveaway_session` | Giveaway Dashboard | Anmeldung für den gewählten Server | 30 Tage |
| `msk_upload_oauth_state` | Bildergalerie | CSRF-Schutz im Discord-Login | 10 Min. |
| `msk_upload_session` | Bildergalerie | Anmeldung für das Einreichen von Bildern | 7 Tage |
| `msk_admin_oauth_state` | Admin-Bereich | CSRF-Schutz im Discord-Login | 10 Min. |
| `msk_admin_session` | Admin-Bereich | Anmeldung im internen Admin-Bereich | 1 Std. |
| `NEXT_LOCALE` | Paste, Shortener | Sprachwahl | 12 Monate |

**localStorage (Shop, wird nicht an unseren Server gesendet):**
`msk-cart` (Warenkorb-ID, dein CFX.re-Name, Warenkorbinhalt, bei Geschenken Name und Discord-ID des Empfängers) und `discordId` (deine Discord-ID) – bis zum Logout. Gib Empfängerdaten nur mit dessen Einverständnis ein.

**sessionStorage (Shop):** `discordReturnPath`, `wantDiscordAuth`, `pendingBasketIdent`, `pendingPackageId`, `pendingPackageType` – merken den laufenden Kauf während des CFX.re-/Discord-Logins; gelöscht beim Schließen des Tabs.

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Login, Warenkorb) bzw. lit. f DSGVO (Sprache). Die Sprache der Hauptseite steckt in der URL (`/de/`), dafür wird kein Cookie gesetzt.

## 5. Shop (Tebex, CFX.re, Discord)

Beim Kauf einer FiveM-Ressource meldest du dich über den Tebex-Identitätsdienst mit deinem **CFX.re-Konto** an; bei Paketen mit Discord-Rolle zusätzlich mit **Discord**. Verarbeitet werden: CFX.re-Nutzername und -ID (für die Zuweisung im Keymaster/Asset Escrow), Discord-ID (nur bei Discord-Rollen), IP-Adresse (Betrugsprävention beim Anlegen des Warenkorbs, an Tebex übermittelt), Warenkorbinhalt. Die Zahlung, Rechnung und Widerrufsabwicklung übernimmt **Tebex Limited**, 201 Haverstock Hill, London NW3 4QG, UK, als Verkäufer. Zahlungsdaten erhalten wir nicht. Wir erhalten von Tebex die Bestelldaten (Produkt, Zeitpunkt, CFX.re-/Discord-ID, Transaktions-ID), um Support zu leisten und Lizenzen zuzuordnen; diese speichern wir 3 Jahre nach Kauf, Abrechnungsdaten 10 Jahre (§ 147 AO).

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO; IP-Übermittlung Art. 6 Abs. 1 lit. f DSGVO. Drittland: Das Vereinigte Königreich verfügt über einen Angemessenheitsbeschluss der EU-Kommission. Tebex-Datenschutz: https://checkout.tebex.io/privacy

## 6. Ticket-Bot-Transcript-Service

### 6.1 Registrierung (Verify)
Beim Discord-Login (Scopes `identify`, `guilds`) erhalten wir deine Discord-ID und die Server, auf denen du Administrator bist. Gespeichert werden: Discord-ID, ID und Name des gewählten Servers, ein zufälliger API-Schlüssel, Abo-Stufe, Stripe-Kunden-/Abo-ID und -Status, Zeitpunkt der Trial-Erinnerung, ggf. eigene Domain und deren Status. Nicht gewählte Server und Server-Icons werden nicht gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Speicherung bis zur Kontolöschung.

### 6.2 Transkripte und Anhänge
Dein Bot lädt beim Schließen eines Tickets eine HTML-Datei hoch, die Namen, Avatare, Nachrichten und Zeitstempel der Ticket-Beteiligten enthalten kann (Premium/Premium+/Business zusätzlich Dateianhänge, die wir vom Discord-CDN abrufen). Wir speichern Datei, Uploadzeit, Größe, Ablaufdatum und Server-Zuordnung. Transkripte sind über eine zufällige, nicht verlinkte und nicht indexierte URL abrufbar; wer die URL kennt, kann sie öffnen. Löschung nach **30 / 180 / 365 Tagen / 10 Jahren** je nach Stufe. Wir verarbeiten diese Inhalte als **Auftragsverarbeiter** des Bot-Betreibers (Art. 28 DSGVO).

### 6.3 Abonnements (Stripe)
Name, Rechnungsadresse, E-Mail und Zahlungsdaten gibst du direkt bei **Stripe Payments Europe, Ltd.**, Dublin, ein. Wir speichern nur Kunden-/Abo-ID, Status, Stufe und Laufzeitende, die uns Stripe per Webhook meldet. Die kostenlose Testphase endet ohne Zahlungsmittel automatisch; drei Tage vorher senden wir **eine** Erinnerungs-E-Mail an die bei Stripe hinterlegte Adresse (Versand über **IONOS SE**, Montabaur, als Auftragsverarbeiter, Verarbeitung in der EU). Die Adresse speichern wir nicht, nur den Versandzeitpunkt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Abrechnungsbelege bewahren wir 10 Jahre auf (§ 147 AO, Art. 6 Abs. 1 lit. c DSGVO). Stripe kann Daten an Stripe, Inc. (USA) übermitteln; Grundlage sind das EU-US Data Privacy Framework und Standardvertragsklauseln.

### 6.4 Eigene Domain
Die Domain wird gespeichert, ein Apache-VirtualHost eingerichtet und ein Let's-Encrypt-Zertifikat ausgestellt (unsere Admin-Adresse wird bei Let's Encrypt/ISRG hinterlegt). Domainnamen erscheinen in öffentlichen Certificate-Transparency-Logs.

### 6.5 Hosted Bot Management (Premium, Premium+, Business)
Wir speichern in einem deinem Server zugeordneten Verzeichnis: `config.jsonc`, `snippets.jsonc`, die `.env` mit deinen Zugangsdaten (Bot-Token, OAuth-Secret, API-Keys), die Datenbank deines Bots (Tickets, Nachrichten, Discord-IDs deines Teams) sowie einen flüchtigen Log-Puffer. Für die öffentliche Adresse wird ein DNS-Eintrag bei **IONOS SE** angelegt. Auf diese Dateien können wir zu Wartungs- und Supportzwecken zugreifen. Nach Beendigung wird die Installation archiviert und nach **14 Tagen** endgültig gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO; für Inhalte der Bot-Datenbank sind wir Auftragsverarbeiter.

## 7. Giveaway-Bot

Der Bot speichert je Server: Server-, Kanal-, Nachrichten- und Rollen-IDs, Einstellungen, Discord-ID des Erstellers, Discord-IDs der Teilnehmer (bei Austritt vor Ende sofort gelöscht) und der Gewinner, Titel/Beschreibung/Laufzeit. Nach Ende wird eine öffentliche Ergebnisseite unter `/giveaway/g/{token}` mit **Nutzernamen der Gewinner** und der anonymen Teilnehmerzahl veröffentlicht. Die Statistikseite `/giveaway/stats` enthält nur aggregierte Zahlen. **Wird der Bot vom Server entfernt, werden alle Daten des Servers sofort gelöscht.** Das Dashboard nutzt Discord-Login (Scopes `identify`, `guilds`). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Bereitstellung der angeforderten Funktion) und lit. b DSGVO (Dashboard).

## 8. Bildergalerie

Zum Einreichen meldest du dich mit Discord an (Scope `identify`). Gespeichert werden: Discord-ID und Anzeigename, Kategorie, Name, optionale Angaben, Originaldateiname, technische Bilddaten, deine Rechtebestätigung mit Zeitstempel sowie die Prüfentscheidung. Die Datei wird neu kodiert und bis zur Prüfung unter zufälligem Namen in einem nicht öffentlichen Verzeichnis abgelegt. Bei Freigabe wird das Bild veröffentlicht, bei Ablehnung gelöscht; abgelehnte Einreichungen bleiben 1 Jahr als Vorgang gespeichert, veröffentlichte solange das Bild online ist. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und lit. f DSGVO.

## 9. Discord-Login (alle Dienste)

Die Anmeldung mit Discord erfolgt über **Discord Inc.**, 444 De Haro Street, San Francisco, USA (bzw. Discord Netherlands B.V.). Dabei erhält Discord die Information, dass du dich bei uns anmeldest. Die Übermittlung in die USA stützt sich auf das EU-US Data Privacy Framework und Standardvertragsklauseln. Wir fordern nur die jeweils genannten Scopes an. Datenschutz bei Discord: https://discord.com/privacy

## 10. Weitere Verarbeitungen

- **Discord-Mitgliederzahl:** Unsere Startseite zeigt die Online-Zahl unseres Discord-Servers; die Abfrage erfolgt serverseitig und wird 60 Sekunden gecacht. Es werden keine Daten von dir an Discord übertragen.
- **Ressourcen-Statistik (fivestats.io):** Die Seite `/resources` zeigt Serverzahlen unserer Ressourcen. Unser Server fragt fivestats.io serverseitig ab; dein Browser verbindet sich nicht mit fivestats.io, es werden keine Daten von dir übermittelt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
- **Rate-Limiting:** Öffentliche Endpunkte (Giveaway-Ergebnisseiten, Dashboard-Login, Transkript-Upload) zählen Anfragen pro IP-Adresse für kurze Zeit im Arbeitsspeicher; keine Speicherung in Datenbanken. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
- **MSK Paste** (paste.msk-scripts.de): Speichert den eingegebenen Text, Titel, Sprache, Ablaufdatum, optionales Passwort (gehasht) und einen Lösch-Token; Pastes werden nach dem gewählten Ablauf gelöscht. IP-Adressen nur in den Server-Logs.
- **MSK Shortener** (s.msk-scripts.de): Speichert Ziel-URL, Kurzcode, optionales Passwort (bcrypt) und Ablaufdatum; bei Erstellung und jedem Klick einen mit geheimem Salt gehashten (pseudonymisierten) IP-Wert, Gerätetyp, Browser, Betriebssystem und Referrer-Domain für Missbrauchsschutz und Klickstatistik. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und lit. f DSGVO.
- **Dokumentation** (docu.msk-scripts.de): statische Seiten, nur Server-Logs nach Abschnitt 3.
- **Widerrufs- und Kündigungsfunktion:** Nutzt du „Vertrag widerrufen“ oder „Verträge hier kündigen“, verarbeiten wir Name, Vertragsangaben, E-Mail-Adresse und Zeitpunkt und senden eine Eingangsbestätigung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und c DSGVO; Aufbewahrung 3 Jahre zum Jahresende.
- **E-Mail und Discord-Support:** Anfragen speichern wir zur Bearbeitung und löschen sie 12 Monate nach Abschluss, sofern keine Aufbewahrungspflicht besteht.

## 11. Empfänger

| Empfänger | Zweck | Rolle | Sitz |
|---|---|---|---|
| netcup GmbH | Hosting | Auftragsverarbeiter | DE |
| IONOS SE | E-Mail-Versand, DNS | Auftragsverarbeiter | DE |
| Tebex Limited | Shop-Verkauf und Zahlung | eigenständig Verantwortlicher | UK (Angemessenheitsbeschluss) |
| Stripe Payments Europe, Ltd. | Abo-Zahlungen | eigenständig Verantwortlicher | IE / USA (DPF, SCC) |
| Discord Inc. | OAuth-Login, Bot-API | eigenständig Verantwortlicher | USA (DPF, SCC) |
| Cfx.re (Tebex-Identitätsdienst) | CFX.re-Login | eigenständig Verantwortlicher | – |
| Internet Security Research Group (Let's Encrypt) | TLS-Zertifikate für eigene Domains | eigenständig Verantwortlicher | USA |
| fivestats.io | Ressourcen-Statistik (keine Nutzerdaten) | – | – |

## 12. Speicherdauer (Übersicht)

| Daten | Dauer |
|---|---|
| Server-Logs | 14 Tage |
| Shop-Bestelldaten von Tebex | 3 Jahre; Abrechnung 10 Jahre |
| Ticket-Bot-Konto, Stripe-Referenzen | bis Kontolöschung |
| Transkripte und Anhänge | 30 / 180 / 365 Tage / 10 Jahre je Stufe |
| Hosted-Bot-Dateien und -Datenbank | bis Beendigung + 14 Tage |
| Giveaway-Daten | bis Entfernen des Bots vom Server |
| Galerie-Einreichungen | solange veröffentlicht; abgelehnt 1 Jahr |
| Pastes | gewähltes Ablaufdatum (10 Min. bis 1 Jahr) |
| Kurzlinks | bis Löschung/Ablauf; Klickstatistik pseudonymisiert unbefristet |
| Widerrufs-/Kündigungserklärungen | 3 Jahre zum Jahresende |
| Support-Anfragen | 12 Monate nach Abschluss |

## 13. Deine Rechte

Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerruf von Einwilligungen (Art. 7 Abs. 3).

> **Widerspruchsrecht (Art. 21 DSGVO):** Gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO kannst du aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit Widerspruch einlegen. Wir verarbeiten die Daten dann nicht weiter, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die deine Interessen überwiegen.

Anfragen an info@msk-scripts.de; wir antworten innerhalb eines Monats. Bei Daten in Transkripten oder Bot-Datenbanken ist der jeweilige Server-Betreiber erster Ansprechpartner; wir helfen bei der Kontaktaufnahme.

**Beschwerderecht (Art. 77 DSGVO)** – zuständige Aufsichtsbehörde:
Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart, Tel. +49 711 615541-0, poststelle@lfdi.bwl.de, https://www.baden-wuerttemberg.datenschutz.de

## 14. Keine automatisierte Entscheidungsfindung, Sicherheit, Änderungen

Es findet keine automatisierte Entscheidungsfindung nach Art. 22 DSGVO statt. Alle Verbindungen sind TLS-verschlüsselt; Passwörter und Secrets werden gehasht bzw. verschlüsselt gespeichert; Zugriff auf Kundendaten hat nur der Verantwortliche. Diese Erklärung wird bei Änderungen der Dienste oder der Rechtslage aktualisiert.

# Datenschutzerklärung

*Stand: Mai 2026*

## 1. Verantwortlicher

Der Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:

**Moritz Kohm**  
c/o Impressumservice Dein-Impressum  
Stettiner Str. 41  
35410 Hungen  
Deutschland

E-Mail: [info@msk-scripts.de](mailto:info@msk-scripts.de)

---

## 2. Überblick der Datenverarbeitung

Diese Website betreibt zwei eigenständige Dienste mit jeweils eigener Datenverarbeitung:

**a) MSK Scripts Shop** — zum Kauf von FiveM-Ressourcen und Discord-Bots über Tebex.

**b) MSK Ticket Bot Transcript Service** — ein optionaler gehosteter Dienst für Nutzer, die den MSK Ticket Bot selbst betreiben. Er speichert Ticket-Transkripte online und stellt öffentliche Links bereit. Nutzer authentifizieren sich über GitHub und Discord OAuth, um einen API Key zu erhalten.

### Vom Shop erhobene Daten

- **CFX.re / FiveM-Nutzername und Nutzer-ID** — erforderlich zur Authentifizierung und Lieferung über das FiveM Asset Escrow-System
- **Discord-ID** — erforderlich für Pakete mit Discord-Rollenzuweisung
- **IP-Adresse** — wird beim Erstellen eines Warenkorbs an Tebex zur Betrugsprävention übermittelt
- **Warenkorbdaten** — lokal im Browser gespeichert (localStorage)
- **Technische Protokolldaten** — Webserver-Zugriffsprotokolle mit IP-Adresse, Browsertyp, Datum und Uhrzeit

### Vom Ticket Bot Transcript Service erhobene Daten

- **GitHub-Nutzername** — über GitHub OAuth während der Verifizierung erhoben, zur Identitäts- und Sponsoring-Prüfung
- **Discord-Nutzer-ID** — über Discord OAuth während der Verifizierung erhoben
- **Discord-Server-ID (Guild-ID)** — mit dem API Key verknüpft, um Transkripte dem richtigen Server zuzuordnen
- **Abo-Tier** — ermittelt anhand des GitHub-Sponsors-Status (Basic, Premium, Premium+)
- **API Key** — zufällig generiertes Token, in unserer Datenbank gespeichert, zur Authentifizierung von Transcript-Uploads
- **Eigene Domain** (optional, nur Premium) — gespeichert, wenn eine Custom Domain konfiguriert wird
- **Ticket-Transkriptinhalt** — HTML-Dateien, vom Bot generiert und auf unseren Server hochgeladen; je nach Tier 30–90 Tage gespeichert
- **Ticket-Anhänge** (nur Premium) — im Ticket verschickte Dateien, neben dem Transkript gespeichert
- **Rate-Limiting-Daten** — Anfragezähler pro API Key pro Stunde zur Missbrauchsverhinderung
- **GitHub-Sponsoring-Daten** — über GitHub Sponsors Webhook empfangen (GitHub-Nutzername und Tier); zur Aktivierung oder Aktualisierung des Abos verarbeitet

### Nicht erhobene Daten

- Wir erheben keine Zahlungsdaten für den Shop. Die Zahlungsabwicklung erfolgt ausschließlich durch **Tebex Limited**.
- Wir verwenden keine Tracking-Cookies, Analysedienste oder Werbetechnologien.
- Wir lesen oder speichern keine Discord-Nachrichten über das hinaus, was der Bot-Betreiber als Transkript hochlädt.

---

## 3. Rechtsgrundlagen der Verarbeitung

| Verarbeitungstätigkeit | Rechtsgrundlage |
|---|---|
| Shop-Käufe, Warenkorb, Lieferung | Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung |
| Webserver-Logs, Betrugsprävention | Art. 6 Abs. 1 lit. f DSGVO — berechtigte Interessen |
| Transcript Service — Kontoerstellung (Verify) | Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung |
| Transcript Service — Transkript- und Anhangsspeicherung | Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung |
| Transcript Service — GitHub Sponsors Webhook | Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung |
| Rate Limiting | Art. 6 Abs. 1 lit. f DSGVO — berechtigte Interessen (Missbrauchsschutz) |

---

## 4. Cookies und lokale Speicherung

### Session-Cookies (Ticket Bot Transcript Service)

Während des Verifizierungsprozesses unter **www.msk-scripts.de/verify** werden **httpOnly Session-Cookies** verwendet, um den mehrstufigen OAuth-Ablauf aufrechtzuerhalten:

| Cookie-Name | Zweck | Dauer |
|---|---|---|
| `msk_oauth_state` | CSRF-Schutz während des OAuth-Ablaufs | 10 Minuten |
| `msk_verify_session` | Speichert verifizierten GitHub-Nutzernamen und Discord-Server-Liste | 1 Stunde |
| `msk_dashboard_session` | Authentifizierung im Dashboard nach abgeschlossener Verifizierung | 30 Tage |

Alle Session-Cookies sind:
- **httpOnly** — nicht über JavaScript zugänglich
- **Secure** — ausschließlich über HTTPS übertragen
- **SameSite=Lax** — geschützt gegen Cross-Site Request Forgery

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO — technisch notwendig zur Erbringung des Verifizierungsdienstes.

### Lokaler Speicher (Shop — Warenkorb)

Der **localStorage** des Browsers wird zur Speicherung der Warenkorb-Kennung verwendet. Diese Daten verlassen Ihren Browser nicht und werden nicht an unsere Server übertragen.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO — technisch erforderlich für den Warenkorb.

### Session-Speicher (Shop — Authentifizierung)

Der **sessionStorage** wird zur vorübergehenden Speicherung des FiveM- und Discord-Authentifizierungsstatus während des Tebex-Checkout-Ablaufs verwendet. Die Daten werden beim Schließen des Browser-Tabs automatisch gelöscht.

### Tracking und Analyse

Diese Website verwendet **keine** Tracking-Cookies, Analysewerkzeuge (z.B. Google Analytics) oder Werbetechnologien. Ein Cookie-Hinweis-Banner ist nicht erforderlich, da keine nicht notwendigen Cookies gesetzt werden.

---

## 5. Ticket Bot Transcript Service — Detaillierte Verarbeitung

### 5.1 Verifizierung und Kontoerstellung

Bei der Registrierung unter **www.msk-scripts.de/verify** finden folgende Datenverarbeitungen statt:

**GitHub OAuth:** Sie werden zu GitHub weitergeleitet und autorisieren unsere Anwendung. GitHub übermittelt daraufhin Ihren GitHub-Nutzernamen an uns. Dieser wird vorübergehend in einem signierten Session-Cookie und nach Abschluss des Verify-Ablaufs dauerhaft in unserer Datenbank gespeichert.

**Discord OAuth:** Sie werden zu Discord weitergeleitet. Nach der Autorisierung übermittelt Discord Ihre Discord-Nutzer-ID sowie eine Liste der Server, auf denen Sie Administrator-Rechte haben (Server-Namen, -IDs und -Icons). Server-Namen und -Icons dienen ausschließlich der Anzeige der Auswahl und werden **nicht gespeichert**. Ihre Discord-Nutzer-ID und die ausgewählte Server-ID werden in unserer Datenbank gespeichert.

**In unserer Datenbank gespeicherte Daten nach erfolgreicher Verifizierung:**

| Feld | Beschreibung | Speicherdauer |
|---|---|---|
| `guild_id` | Ihre Discord-Server-ID | Bis zur Kontolöschung |
| `api_key` | Zufällig generiertes Authentifizierungstoken | Bis zur Neugenerierung oder Kontolöschung |
| `tier` | Abo-Tier (basic/premium/premium_plus) | Bis zur Kontolöschung |
| `github_username` | Ihr GitHub-Nutzername | Bis zur Kontolöschung |
| `discord_user_id` | Ihre Discord-Nutzer-ID | Bis zur Kontolöschung |
| `custom_domain` | Eigene Domain (falls konfiguriert) | Bis zur Entfernung |
| `domain_status` | Status der eigenen Domain | Bis zur Kontolöschung |

### 5.2 Transkriptspeicherung

Wenn ein Ticket auf einem selbst-gehosteten Bot mit gültigem API Key geschlossen wird, lädt der Bot das generierte HTML-Transkript auf unseren Server hoch. Gespeichert werden:

- Die **HTML-Datei** des Transkripts im Dateisystem unseres Servers
- Metadaten in unserer Datenbank: Upload-Zeitstempel, Dateigröße, Ablaufdatum, Server-Referenz

Transkripte werden nach Ablauf der für Ihr Tier geltenden Aufbewahrungsfrist (30, 60 oder 90 Tage) automatisch gelöscht. Transkripte sind über ihre eindeutige URL (mit zufälliger UUID) öffentlich abrufbar, werden jedoch nicht indiziert oder verlinkt.

### 5.3 Anhangsspeicherung (nur Premium)

Für Premium- und Premium+-Nutzer werden Dateianhänge aus Tickets (Bilder, PDFs etc.) vom Discord-CDN heruntergeladen und zusammen mit dem Transkript auf unserem Server gespeichert. Diese Dateien werden mit dem Transkript zum Ablaufzeitpunkt gelöscht.

### 5.4 GitHub Sponsors Webhook

Wir betreiben einen Webhook-Endpunkt, der Ereignisse von **GitHub Sponsors** empfängt, wenn Sie ein Sponsoring starten, ändern oder kündigen. Das Ereignis enthält Ihren GitHub-Nutzernamen und den monatlichen Betrag. Wir verarbeiten diese Daten, um Ihr Abo-Tier automatisch zu aktivieren, upzugraden oder downzugraden.

**Verarbeitete Daten:** GitHub-Nutzername, Abo-Tier (abgeleitet aus dem monatlichen Betrag), Aktion (created/cancelled/tier_changed).

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO — zur Erbringung des gebuchten Dienstes erforderlich.

### 5.5 Eigene Domain (nur Premium)

Bei Konfiguration einer eigenen Domain wird der Domain-Name in unserer Datenbank gespeichert. Bei der Aktivierung:
- Wird eine **Apache2 VirtualHost-Konfiguration** auf unserem Server erstellt
- Wird über Certbot ein **kostenloses SSL-Zertifikat** (Let's Encrypt) eingerichtet; dabei wird unsere Admin-E-Mail (`info@msk-scripts.de`) bei Let's Encrypt für Zertifikatsbenachrichtigungen hinterlegt

Ihr Domain-Name kann aufgrund der SSL-Zertifikatsausstellung in öffentlichen **Certificate Transparency Logs** erscheinen. Dies ist ein Standardmerkmal der öffentlichen Web-PKI-Infrastruktur.

---

## 6. Zahlungsabwicklung (Tebex — Shop)

Alle Shop-Käufe werden über **Tebex Limited**, 201 Haverstock Hill, Second Floor, London, NW3 4QG, Vereinigtes Königreich, abgewickelt. Tebex fungiert als Merchant of Record und ist allein für die Zahlungsverarbeitung verantwortlich.

- [Tebex Datenschutzerklärung](https://checkout.tebex.io/privacy)
- [Tebex Nutzungsbedingungen](https://checkout.tebex.io/terms)

---

## 7. Abo-Zahlungen (GitHub Sponsors)

Das Premium- und Premium+-Abo für den Ticket Bot Transcript Service wird über **GitHub Sponsors** (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA) abgewickelt.

GitHub Sponsors übernimmt die gesamte Zahlungsabwicklung, Rechnungsstellung und Rückerstattung. Wir erhalten ausschließlich Ihren GitHub-Nutzernamen und das Abo-Tier über Webhook — keine Zahlungsdaten.

Datenschutzerklärung von GitHub: [docs.github.com/site-policy](https://docs.github.com/de/site-policy/privacy-policies/github-privacy-statement)

---

## 8. Authentifizierung über CFX.re / FiveM (Shop)

Zum Kauf von Shop-Paketen authentifizieren Sie sich über den Tebex-Identitätsdienst mit Ihrem **CFX.re-Konto**. Ihr FiveM-Nutzername und Ihre Nutzer-ID werden vorübergehend im localStorage Ihres Browsers gespeichert.

---

## 9. Authentifizierung über Discord (Shop)

Für Pakete mit Discord-Rollenzuweisung wird Ihre **Discord-ID** über den Tebex-Identitätsdienst erhoben und als Teil des Kaufs an Tebex übermittelt. Eine dauerhafte Speicherung auf unseren Servern erfolgt nicht.

---

## 10. Webserver-Protokolle

Unser Server erfasst automatisch Zugriffsprotokolle mit: IP-Adresse, Datum und Uhrzeit, aufgerufener URL, HTTP-Statuscode, Browser-/Client-Typ. Diese werden für Sicherheits- und Betriebszwecke verwendet und nach maximal **14 Tagen** automatisch gelöscht.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse am Betrieb und der Absicherung der Website.

---

## 11. Discord-Mitgliederanzahl

Unsere Startseite zeigt die aktuelle Online-Mitgliederzahl unseres Discord-Servers an. Das Ergebnis wird 60 Sekunden auf unserem Server zwischengespeichert. Es werden keine personenbezogenen Daten an Discord übermittelt.

---

## 12. Speicherdauer

| Daten | Speicherdauer |
|---|---|
| Server-Zugriffsprotokolle | 14 Tage |
| Warenkorb (localStorage) | Bis zur Löschung durch den Nutzer oder Ablauf |
| Shop FiveM/Discord-Auth (sessionStorage) | Bis zum Schließen des Browser-Tabs |
| OAuth-State-Cookie | 10 Minuten |
| Verify-Session-Cookie | 1 Stunde |
| Dashboard-Session-Cookie | 30 Tage |
| Ticket Bot Kontodaten (guild_id, api_key, github_username, discord_user_id, tier) | Bis zur Löschanfrage |
| Rate-Limiting-Daten | 1 Stunde (gleitendes Fenster) |
| Transkript-HTML-Dateien | 30 Tage (Basic) / 60 Tage (Premium) / 90 Tage (Premium+) |
| Anhangsdateien | Wie Transkript |
| GitHub-Sponsoring-Daten | Bis zur Kontolöschung |

---

## 13. Datenübermittlung in Drittländer

**Tebex Limited** (UK): Das Vereinigte Königreich verfügt über einen Angemessenheitsbeschluss der EU-Kommission. Übermittlungen an Tebex gelten als DSGVO-konform.

**GitHub, Inc.** (USA): GitHub Sponsors und OAuth-Dienste werden von GitHub betrieben. Übermittlungen erfolgen auf Grundlage von Standardvertragsklauseln. Siehe: [github.com/site-policy](https://docs.github.com/de/site-policy/privacy-policies/github-privacy-statement)

Unser Webserver sowie alle Transkript- und Anhangsdaten sind innerhalb der **Europäischen Union** gespeichert.

---

## 14. Ihre Rechte nach der DSGVO

Als betroffene Person haben Sie folgende Rechte:

- **Auskunftsrecht** (Art. 15 DSGVO) — Auskunft über gespeicherte Daten verlangen
- **Recht auf Berichtigung** (Art. 16 DSGVO) — Berichtigung unrichtiger Daten verlangen
- **Recht auf Löschung** (Art. 17 DSGVO) — Löschung Ihrer Daten verlangen
- **Recht auf Einschränkung** (Art. 18 DSGVO) — Einschränkung der Verarbeitung verlangen
- **Recht auf Datenübertragbarkeit** (Art. 20 DSGVO) — Daten in maschinenlesbarem Format erhalten
- **Widerspruchsrecht** (Art. 21 DSGVO) — Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen
- **Beschwerderecht** — bei der zuständigen Aufsichtsbehörde (in Deutschland: der/die Landesbeauftragte für Datenschutz Ihres Bundeslandes)

Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: [info@msk-scripts.de](mailto:info@msk-scripts.de)

Wir bearbeiten Ihren Antrag innerhalb von **30 Tagen**.

---

## 15. Änderungen dieser Datenschutzerklärung

Wir behalten uns das Recht vor, diese Datenschutzerklärung zu aktualisieren, um Änderungen unserer Dienste oder des geltenden Rechts widerzuspiegeln. Die jeweils aktuelle Version ist immer unter dieser URL abrufbar. Das Datum oben zeigt an, wann die letzte Aktualisierung erfolgte.

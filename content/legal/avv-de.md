# Vereinbarung zur Auftragsverarbeitung (AVV)

gemäß Art. 28 Abs. 3 DSGVO

Stand: September 2026

Diese Vereinbarung wird Vertragsbestandteil, sobald du als Betreiber eines Discord-Servers den **Ticket-Bot-Transcript-Service**, das **Hosted Bot Management** oder **MSK Forms** aktivierst („Auftraggeber“, „du“). Auftragsverarbeiter ist Moritz Kohm, MSK Scripts, c/o Impressumservice Dein-Impressum, Stettiner Str. 41, 35410 Hungen („MSK Scripts“, „wir“). Du kannst diese Vereinbarung jederzeit unter https://www.msk-scripts.de/de/terms/avv abrufen und für deine Unterlagen speichern.

## 1. Gegenstand und Dauer

(1) Gegenstand ist die Speicherung, Bereitstellung und Verarbeitung von Daten, die dein Ticket-Bot bzw. deine MSK-Forms-Formulare erzeugen, auf unseren Systemen. Du entscheidest, welche Tickets hochgeladen, welche Formulare veröffentlicht und welche Daten darin erhoben werden; wir stellen die Infrastruktur.

(2) Die Vereinbarung gilt für die Dauer der Nutzung des jeweiligen Dienstes und endet mit dessen Beendigung und der Löschung bzw. Rückgabe der Daten nach Ziffer 9.

## 2. Art und Zweck der Verarbeitung, Datenkategorien, Betroffene

| | Transcript-Service | Hosted Bot Management | MSK Forms |
|---|---|---|---|
| **Zweck** | Speicherung und Abruf von Ticket-Transkripten und Anhängen | Betrieb deiner Bot-Instanz inkl. Konfiguration und Datenbank | Betrieb deiner Bewerbungs-/Antragsformulare, Speicherung und Statusverwaltung der Einsendungen |
| **Datenkategorien** | Discord-Nutzernamen, Anzeigenamen, Avatare, Nachrichteninhalte, Zeitstempel, Anhänge | Bot-Konfiguration, Zugangsdaten (Token, Secrets), Ticketdaten, Discord-IDs deines Teams | Antworten der Bewerber (von dir definierte Felder), Uploads, Discord-Identität angemeldeter Bewerber, Statusverlauf, Reviewer-Notizen |
| **Betroffene** | Nutzer deines Discord-Servers, dein Support-Team | dein Team, Nutzer deines Servers | Bewerber/Antragsteller, dein Review-Team |

Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO) dürfen nur verarbeitet werden, wenn du dafür eine Rechtsgrundlage hast; wir empfehlen, solche Daten nicht in Tickets oder Formulare aufzunehmen.

## 3. Weisungen

(1) Wir verarbeiten die Daten ausschließlich nach deinen dokumentierten Weisungen. Weisungen erteilst du durch die Konfiguration des Dienstes (Upload, Speicherdauer je Stufe, Formularfelder, Löschung im Dashboard) sowie in Textform an info@msk-scripts.de.

(2) Wir informieren dich unverzüglich, wenn wir der Auffassung sind, dass eine Weisung gegen Datenschutzrecht verstößt.

(3) Eine Verarbeitung zu eigenen Zwecken findet nicht statt; ausgenommen sind anonymisierte, aggregierte Nutzungsstatistiken ohne Personenbezug.

## 4. Pflichten von MSK Scripts

Wir verpflichten uns,

- Daten nur innerhalb der EU/des EWR zu verarbeiten (Serverstandort Deutschland, netcup GmbH);
- alle mit der Verarbeitung befassten Personen zur Vertraulichkeit zu verpflichten (derzeit ausschließlich der Inhaber);
- die technischen und organisatorischen Maßnahmen nach Ziffer 6 einzuhalten und regelmäßig zu überprüfen;
- dich bei der Beantwortung von Betroffenenanfragen (Art. 12–22 DSGVO) im Rahmen des Zumutbaren zu unterstützen, z. B. durch Löschung oder Export einzelner Transkripte und Einsendungen;
- dich bei der Einhaltung der Pflichten aus Art. 32–36 DSGVO (Sicherheit, Meldung von Datenpannen, Datenschutz-Folgenabschätzung) zu unterstützen;
- dich **unverzüglich, spätestens innerhalb von 48 Stunden** nach Kenntnis über Verletzungen des Schutzes personenbezogener Daten zu informieren, die deine Daten betreffen;
- dir alle Informationen zur Verfügung zu stellen, die zum Nachweis der Einhaltung dieser Vereinbarung erforderlich sind.

## 5. Pflichten des Auftraggebers

Du bist Verantwortlicher für die Daten in deinen Transkripten, Bot-Datenbanken und Formularen und stellst insbesondere sicher, dass

- eine Rechtsgrundlage für die Verarbeitung besteht und deine Nutzer bzw. Bewerber nach Art. 13/14 DSGVO informiert werden, einschließlich des Hinweises, dass MSK Scripts als Auftragsverarbeiter eingesetzt wird;
- du Transkript- und Formular-Links nur an berechtigte Personen weitergibst;
- du Zugangsdaten (API-Schlüssel, Bot-Token) geheim hältst und bei Kompromittierung sofort erneuerst;
- Betroffenenanfragen, die bei dir eingehen, von dir bearbeitet werden; wir unterstützen dich dabei.

## 6. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

- **Zugangskontrolle:** Serverzugriff nur über SSH mit Schlüsselauthentifizierung; Dashboard-Zugriff nur nach Discord-OAuth; Sessions als HttpOnly/Secure-Cookies.
- **Zugriffskontrolle:** Transkripte unter zufälligen, nicht erratbaren UUID-Pfaden; Formular-Einsendungen unter zufälligen IDs; API-Schlüssel serverspezifisch; Secrets (OAuth, Turnstile) verschlüsselt gespeichert.
- **Übertragungskontrolle:** ausschließlich TLS-verschlüsselte Verbindungen (HTTPS), Certbot/Let's Encrypt.
- **Trennung:** getrennte Verzeichnisse und Datenbankdatensätze je Discord-Server; Hosted Bots als separate Prozesse.
- **Verfügbarkeit und Wiederherstellbarkeit:** Rate-Limiting gegen Missbrauch; Betrieb auf Systemen innerhalb der EU. Tägliche verschlüsselte Sicherung (AES-256) der Datenbanken, Ticket-Transkripte und Konfigurationen; Aufbewahrung von 30 Tagesständen und 12 Monatsständen. Zusätzlich eine verschlüsselte Zweitkopie außerhalb des Produktivsystems bei einem Anbieter mit Rechenzentren in der Schweiz und in Deutschland. Die Sicherungen werden nach dem Schreiben automatisch gegengelesen; die Wiederherstellbarkeit wird durch Rückspielproben überprüft.
- **Löschung:** automatische Löschung nach Ablauf der Speicherdauer; Archivierung gelöschter Hosted-Bot-Installationen 14 Tage, danach endgültige Löschung.
- **Protokollierung:** Server-Logs 14 Tage.

## 7. Unterauftragsverarbeiter

Du stimmst dem Einsatz folgender Unterauftragsverarbeiter zu:

| Unterauftragsverarbeiter | Leistung | Sitz |
|---|---|---|
| netcup GmbH, Daimlerstraße 25, 76185 Karlsruhe | Hosting, Speicher | Deutschland |
| IONOS SE, Elgendorfer Str. 57, 56410 Montabaur | DNS, E-Mail-Versand | Deutschland |
| Proton AG, Route de la Galaise 32, 1228 Plan-les-Ouates, Genf | Verschlüsselte Backup-Zweitkopie | Schweiz (Angemessenheitsbeschluss der EU-Kommission), Deutschland |

Über den Einsatz weiterer Unterauftragsverarbeiter informieren wir dich mindestens 30 Tage vorher per E-Mail oder Hinweis im Dashboard. Du kannst innerhalb dieser Frist aus wichtigem Grund widersprechen; in diesem Fall kannst du den Dienst kündigen.

Discord Inc. und Stripe sind keine Unterauftragsverarbeiter, sondern eigenständig Verantwortliche für die von ihnen betriebenen Plattformen.

## 8. Kontrollrechte

Du kannst die Einhaltung dieser Vereinbarung überprüfen, in erster Linie durch Anforderung von Auskünften und Nachweisen in Textform. Vor-Ort-Prüfungen sind nach Ankündigung mit angemessener Frist (mindestens 14 Tage) zu üblichen Geschäftszeiten möglich, höchstens einmal jährlich, sofern kein konkreter Anlass besteht.

## 9. Löschung und Rückgabe nach Vertragsende

Nach Beendigung des Dienstes löschen wir alle für dich verarbeiteten Daten: Transkripte nach Ablauf ihrer jeweiligen Speicherdauer, Hosted-Bot-Installationen 14 Tage nach Deaktivierung, Formular-Daten mit Löschung des Formulars bzw. deines Kontos. Auf Wunsch geben wir dir vorher Konfigurationsdateien und Exporte (CSV/JSON) heraus. Gesetzliche Aufbewahrungspflichten bleiben unberührt.

## 10. Haftung und Schlussbestimmungen

(1) Für die Haftung gelten Art. 82 DSGVO und die Haftungsregelung der AGB.

(2) Diese Vereinbarung geht bei Widersprüchen den AGB vor, soweit es um den Datenschutz geht. Es gilt deutsches Recht.

(3) Änderungen dieser Vereinbarung teilen wir dir wie Änderungen der AGB mit.

---

Mit Aktivierung des jeweiligen Dienstes bestätigst du, diese Vereinbarung gelesen zu haben und sie abzuschließen. Eine unterschriebene Fassung stellen wir dir auf Anfrage an info@msk-scripts.de als PDF zur Verfügung.

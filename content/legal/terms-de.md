# Nutzungsbedingungen

*Stand: Mai 2026*

## 1. Geltungsbereich

Diese Nutzungsbedingungen gelten für die Nutzung aller MSK Scripts-Dienste unter **www.msk-scripts.de**, einschließlich:

- **MSK Scripts Shop** — Kauf digitaler Produkte (FiveM-Ressourcen und Discord-Bots) über Tebex
- **MSK Ticket Bot Transcript Service** — ein optionaler, abonnementbasierter Hosting-Dienst für Nutzer, die den MSK Ticket Bot selbst betreiben

Mit dem Abschluss eines Kaufs oder der Registrierung für den Transcript Service stimmen Sie diesen Bedingungen zu.

---

## 2. Shop — Zahlungsabwicklung (Tebex)

Alle Shop-Käufe werden über **Tebex Limited** (früher Buycraft) als Zahlungsdienstleister und Merchant of Record abgewickelt. Mit dem Kauf stimmen Sie auch den eigenen Bedingungen von Tebex zu:

- [Tebex Nutzungsbedingungen](https://checkout.tebex.io/terms)
- [Tebex Datenschutzerklärung](https://checkout.tebex.io/privacy)
- [Tebex Impressum](https://checkout.tebex.io/impressum)

---

## 3. Shop — Lizenzbedingungen

Mit dem Kauf einer MSK Scripts-Ressource erhalten Sie eine **nicht übertragbare, nicht exklusive Einzelserver-Lizenz** zur Nutzung der Ressource auf einem (1) FiveM-Server gleichzeitig.

Der Lizenzgeber (MSK Scripts) behält alle Rechte an der Software, einschließlich aller Rechte am geistigen Eigentum (Urheberrecht, Markenrecht und verwandte Rechte).

**Nicht gestattet ist:**
- Die gleichzeitige Nutzung auf mehr als einem FiveM-Server
- Weiterverkauf, Weitergabe, Unterlizenzierung oder öffentliche Verbreitung der Ressource
- Reverse Engineering, Dekompilierung oder Umgehung des Asset Escrow-Systems
- Das Teilen oder Veröffentlichen von Source-Code-Versionen (-S) einer Ressource

---

## 4. Shop — Rückgaben & Erstattungen

Da es sich um digitale Produkte handelt, besteht nach der Lieferung kein Widerrufsrecht, sofern Sie beim Checkout ausdrücklich zugestimmt haben, dass die Lieferung vor Ablauf der Widerrufsfrist beginnt.

Bei technischen Problemen, die auf unsere Seite zurückzuführen sind, bieten wir Support und können im Einzelfall Erstattungen gewähren. Kontakt: [info@msk-scripts.de](mailto:info@msk-scripts.de)

---

## 5. Shop — FiveM Asset Escrow

Viele Ressourcen nutzen das [FiveM Asset Escrow System](https://forum.cfx.re/t/introducing-asset-escrow-for-your-resources/4777151). Die Nutzung setzt ein aktives CFX.re-Konto voraus. Eine Offline-Nutzung ist nicht möglich.

---

## 6. Shop — Discord-Voraussetzungen

Pakete mit Discord-Integration erfordern eine gültige Discord-ID. Sie müssen Mitglied des MSK Scripts Discord-Servers sein, um Discord-Rollen und andere Discord-basierte Leistungen zu erhalten.

---

## 7. Ticket Bot Transcript Service

### 7.1 Leistungsbeschreibung

Der MSK Ticket Bot Transcript Service ermöglicht Nutzern, die den MSK Ticket Bot selbst betreiben, Ticket-Transkripte auf unsere Server hochzuladen und über einen öffentlichen Link abzurufen. Der Dienst wird in drei Stufen angeboten:

| Tier | Preis | Speicherdauer | Max. Transkript | Anhänge | Eigene Domain |
|---|---|---|---|---|---|
| **Basic** | Kostenlos | 30 Tage | 10 MB | Nein | Nein |
| **Premium** | 5 €/Monat | 60 Tage | 100 MB | Ja (150 MB/Ticket) | Ja |
| **Premium+** | 10 €/Monat | 90 Tage | 250 MB | Ja (500 MB/Ticket) | Ja |

### 7.2 Abonnement und Zahlung

Premium- und Premium+-Abonnements werden ausschließlich über **GitHub Sponsors** ([github.com/sponsors/MSK-Scripts](https://github.com/sponsors/MSK-Scripts)) verwaltet. GitHub wickelt alle Zahlungen ab. Mit dem Sponsoring stimmen Sie auch den Nutzungsbedingungen von GitHub zu.

Abo-Gebühren werden monatlich durch GitHub in Rechnung gestellt. Ihr Tier wird automatisch aktiviert, sobald das Sponsoring registriert ist, und bei Kündigung deaktiviert.

Wir haben keinen Einfluss auf die Zahlungsabwicklung, Abrechnungsintervalle oder Rückerstattungsrichtlinien von GitHub für Sponsorings.

### 7.3 Kündigung und Downgrade

Sie können Ihr GitHub Sponsors-Abonnement jederzeit über GitHub kündigen. Bei Kündigung gilt:
- Ihr Tier wird zum Ende des Abrechnungszeitraums auf **Basic** downgegradet
- Bestehende Transkripte bleiben bis zu ihrem individuellen Ablaufdatum abrufbar
- Eigene Domains werden zum Zeitpunkt des Downgrades deaktiviert
- Keine anteiligen Erstattungen für nicht genutzte Abo-Zeit

### 7.4 API Key

Nach erfolgreicher Registrierung über **www.msk-scripts.de/verify** erhalten Sie einen persönlichen API Key.

- Der API Key ist **mit einem Discord-Server verknüpft** und muss vertraulich behandelt werden
- **Teilen Sie Ihren API Key nicht** mit anderen Personen — er ermöglicht das Hochladen von Transkripten im Namen Ihres Servers
- Wenn Sie den Verify-Prozess für denselben Server erneut durchführen, wird ein neuer API Key generiert und der vorherige **sofort ungültig**; Sie müssen den Key in der Konfiguration Ihres Bots aktualisieren
- Wir behalten uns das Recht vor, API Keys bei Missbrauch oder Verstoß gegen diese Bedingungen zu widerrufen

### 7.5 Transkriptinhalt und Verantwortung

Der Transkriptinhalt wird vollständig von Ihrer selbst-gehosteten Bot-Instanz generiert und auf unsere Server hochgeladen. Sie sind allein verantwortlich für den Inhalt der auf unseren Servern gespeicherten Transkripte und Anhänge.

**Es ist verboten, Transkripte hochzuladen, die enthalten:**
- Rechtswidrige Inhalte jeglicher Art
- Inhalte, die Rechte Dritter verletzen
- Schadsoftware, Skripte oder ausführbaren Code mit schädigender Absicht

Wir behalten uns das Recht vor, gegen diese Bedingungen verstoßende Inhalte ohne vorherige Ankündigung zu löschen und den Zugang zum Dienst zu beenden.

### 7.6 Transkriptverfügbarkeit und öffentliche URLs

Transkripte sind über eine URL mit zufällig generierter UUID abrufbar (z.B. `https://www.msk-scripts.de/transcripts/.../...`). Diese URLs werden nicht aufgelistet, indiziert oder verlinkt. Jede Person, die die URL kennt, kann das Transkript abrufen — es liegt in Ihrer Verantwortung, diese Links verantwortungsvoll weiterzugeben.

Wir garantieren keine dauerhafte Verfügbarkeit von Transkripten über die für Ihr Tier angegebene Speicherdauer hinaus.

### 7.7 Eigene Domain (nur Premium)

Premium- und Premium+-Nutzer können eine eigene Domain für die Transkript-Auslieferung konfigurieren.

- Sie müssen die konfigurierte Domain **besitzen und kontrollieren**
- Sie müssen den erforderlichen DNS A-Record auf unseren Server setzen, bevor die Domain aktiviert wird
- Ein SSL-Zertifikat wird automatisch über Let's Encrypt ohne zusätzliche Kosten eingerichtet
- Wir behalten uns das Recht vor, fehlerhaft konfigurierte, Konflikte verursachende oder gegen geltendes Recht verstoßende Custom Domains zu entfernen
- Bei Kündigung oder Downgrade auf Basic wird die eigene Domain deaktiviert

### 7.8 Dienstverfügbarkeit

Wir bemühen uns um eine hohe Verfügbarkeit des Transcript Service, bieten jedoch keine garantierte Betriebszeit oder SLA. Geplante Wartungsarbeiten oder unvorhergesehene Ausfälle können den Dienst vorübergehend unterbrechen.

Ist der Dienst zum Zeitpunkt eines Transkript-Uploads nicht erreichbar, sendet der Bot das Transkript als Dateianhang per DM.

---

## 8. Haftungsbeschränkung

MSK Scripts übernimmt keine Haftung für Schäden, die durch die Nutzung unserer Produkte oder Dienste entstehen, es sei denn, diese sind auf grobe Fahrlässigkeit oder Vorsatz zurückzuführen.

Insbesondere übernehmen wir keine Haftung für:
- Änderungen an der FiveM-Plattform oder CFX.re, die die Funktionsfähigkeit gekaufter Ressourcen beeinträchtigen
- Vorübergehende Nichtverfügbarkeit des Transcript Service
- Verlust von Transkriptdaten nach Ablauf der Speicherfrist
- Folgen aus der Weitergabe von Transkript-URLs an Dritte
- Domain-bezogene Probleme aufgrund fehlerhafter DNS-Konfiguration durch den Nutzer

---

## 9. Support

Support für Shop-Produkte und den Transcript Service wird über unseren Discord-Server bereitgestellt. Wir bemühen uns um zeitnahe Antworten, können jedoch keine garantierten Reaktionszeiten zusichern.

---

## 10. Änderungen der Nutzungsbedingungen

Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu aktualisieren. Änderungen werden auf dieser Seite mit aktualisiertem Datum veröffentlicht. Die fortgesetzte Nutzung unserer Dienste nach Veröffentlichung der Änderungen gilt als Zustimmung zu den aktualisierten Bedingungen.

Bei wesentlichen Änderungen der Abo-Bedingungen für den Transcript Service werden wir betroffene Nutzer nach Möglichkeit vorab informieren.

---

## 11. Anwendbares Recht

Diese Nutzungsbedingungen unterliegen dem Recht der **Bundesrepublik Deutschland**. Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen Nutzungsbedingungen ist, soweit gesetzlich zulässig, der Sitz des Lizenzgebers.

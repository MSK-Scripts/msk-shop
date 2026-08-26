# Label-Generatoren

Diese Skripte bauen die JSON-Vorlagen, die `scripts/image-label-import.js` in die
Spalten `label` und `tags` von `msk_images` schreibt. Zwei Schritte, weil die
Vorlage dazwischen lesbar ist und sich vor dem Schreiben prüfen lässt.

```bash
# 1. Datendump holen (Fakten über das Spiel, keine Grafiken)
curl -sLO https://raw.githubusercontent.com/DurtyFree/gta-v-data-dumps/master/vehicles.json

# 2. Vorlage bauen
node scripts/labels/vehicles.js vehicles.json /srv/staging/vehicle-labels.json

# 3. Erst trocken, dann echt
node scripts/image-label-import.js vehicles /srv/staging/vehicle-labels.json --dry-run
node scripts/image-label-import.js vehicles /srv/staging/vehicle-labels.json
```

Auf dem Server davor `.env.local` sourcen und `NODE_PATH` setzen, wie bei
`cleanup.js`:

```bash
set -a; . /opt/msk-shop/.env.local; set +a
export NODE_PATH=/opt/msk-shop/node_modules
```

## Warum sie hier liegen

Sie lagen bis zum 26.08.2026 nur im Scratchpad auf dem Server. Der Generator für
Fahrzeuge war beim zweiten Bedarf verschwunden und musste neu gebaut werden,
inklusive der Frage, wie die bestehende Schreibweise eigentlich zustande kam.
Ein Generator ist die Dokumentation seiner eigenen Regel, und die gehört
versioniert.

## Was der Import garantiert

- **Ein vorhandenes Label wird nie überschrieben**, ausser mit `--force`. Ein von
  Hand gepflegter Wert ist mehr wert als ein automatischer.
- Der Schutz gilt **pro Feld**: ein leeres `tags` wird auch dann gefüllt, wenn
  das Label schon steht. Bis zum 26.08.2026 sprang der Import bei vorhandenem
  Label über die ganze Zeile, damit liessen sich nie Tags nachtragen.
- Einträge ohne Bild im Bestand werden gezählt, nicht angelegt.

## Die Quellen

| Kategorie | Quelle | Deckung |
|---|---|---|
| `vehicles` | `DurtyFree/gta-v-data-dumps`, `vehicles.json` | 910 von 916 |
| `peds` | `DurtyFree/gta-v-data-dumps`, `peds.json` | 1030 von 1030 |
| `weapons` | `DurtyFree/gta-v-data-dumps`, `weapons.json` | 107 von 113 |
| `items` | keine, Handarbeit (siehe `items.js`) | 83 von 83 |

Für Peds führt das Spiel nur bei 268 von 1109 Modellen einen Anzeigenamen, alle
übrigen Labels entstehen aus der CamelCase-Form des Modellnamens. Abkürzungen
bleiben dabei bewusst stehen (`StrPunk` wird "Str Punk"), ihre Auflösung wäre
Auslegung und keine Datenquelle.

Für `weapons` gibt es noch keinen Generator, die Labels stammen aus einem Lauf
vom 25.08.2026. Wer sie neu bauen muss, nimmt `weapons.json` aus demselben Dump.

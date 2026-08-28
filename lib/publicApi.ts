import { NextResponse } from 'next/server'

/**
 * Antwortkopf der oeffentlichen Lese-Endpunkte unter `/api/images`.
 *
 * Diese drei Routen (Liste, Kategorien, Einzelbild) liefern denselben Bestand,
 * den das CDN ohnehin an jeden ausliefert, und sie tun das ohne Sitzung. Ihnen
 * `Access-Control-Allow-Origin: *` zu geben ist deshalb keine Oeffnung, sondern
 * die Angleichung an die Bilder selbst: `cdn.msk-scripts.de` traegt den Header
 * seit dem ersten Tag, weil ein FiveM-NUI mit `nui://`-Origin sonst gar nicht
 * an die Datei kaeme. Ein Consumer, der vor dem Anzeigen nachschlaegt, ob es zu
 * einem Modellnamen ein Bild gibt, sitzt in genau derselben Lage.
 *
 * **Bewusst kein Praefix-Abgleich.** Unter `/api/images` liegt auch
 * `/api/images/upload`: Sitzungscookie, Schreibzugriff, Origin-Pruefung als
 * CSRF-Schutz. Eine Regel auf das Praefix haette den Header dorthin
 * mitgenommen und genau das Loch geoeffnet, das die Pruefung schliesst. Der
 * Kopf wird deshalb von jeder Leseroute einzeln gesetzt; wer eine neue Route
 * unter `/api/images` anlegt, bekommt ihn nicht geschenkt und muss sich
 * entscheiden.
 *
 * Kein `Access-Control-Allow-Credentials`. Mit `*` waere es ohnehin unzulaessig,
 * und diese Routen haben nichts, wofuer sich ein Cookie lohnte.
 */
export const PUBLIC_READ_HEADERS: Record<string, string> = {
  'Cache-Control':               'public, s-maxage=300, stale-while-revalidate=3600',
  'Access-Control-Allow-Origin': '*',
}

/** Eine oeffentlich lesbare JSON-Antwort mit den Koepfen von oben. */
export function publicJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PUBLIC_READ_HEADERS })
}

/**
 * Preflight fuer dieselben Routen.
 *
 * Ein schlichtes `fetch` ohne eigene Kopfzeilen loest keinen Preflight aus, ein
 * Aufrufer mit `Accept: application/json` oder einem eigenen Kopf aber schon.
 * Ohne diesen Handler antwortet Next darauf mit 405, und die eigentliche
 * Anfrage wird nie gestellt: der Endpunkt sieht dann funktionierend aus und
 * ist es fuer den halben Anwendungsfall nicht.
 */
export function corsPreflight(): NextResponse {
  return new NextResponse(null, {
    status:  204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age':       '86400',
    },
  })
}

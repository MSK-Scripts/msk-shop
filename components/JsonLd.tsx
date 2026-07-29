import type { JsonLdObject } from '@/lib/jsonLd'

/**
 * Gibt strukturierte Daten als `<script type="application/ld+json">` aus.
 *
 * `application/ld+json` ist ein Datenblock und wird vom Browser nicht als
 * JavaScript ausgeführt. Die Nonce-CSP aus `middleware.ts` greift hier deshalb
 * nicht, und die Komponente braucht keinen Nonce. Das ist wichtig, weil die
 * Paketseiten statisch vorgerendert werden (`generateStaticParams`): Ein
 * `headers()`-Aufruf zum Lesen des Nonce würde sie zu dynamischen Seiten machen.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      // Der Inhalt ist kein HTML, sondern JSON. `serialize` neutralisiert jedes
      // `<`, damit ein Paketname wie "</script><img onerror=…>" den Block nicht
      // verlassen kann.
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  )
}

/**
 * JSON für die Einbettung in ein `<script>`-Element serialisieren.
 *
 * Ein `<` in einem Wert könnte sonst als `</script>` den Block beenden (bzw.
 * als `<!--` einen Kommentar öffnen). `<` ist innerhalb eines
 * JSON-Strings äquivalent, wird vom HTML-Parser aber nicht als Tag gelesen.
 */
function serialize(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

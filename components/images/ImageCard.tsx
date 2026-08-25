import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Card } from '@/components/ui/Card'
import type { ImageRecord } from '@/lib/images'

/**
 * Eine Kachel im Bildraster.
 *
 * Bewusst ein schlichtes `<img>` und kein `next/image`: die Datei liegt bereits
 * in genau der gebrauchten Groesse auf dem CDN. Der Optimizer wuerde jedes Bild
 * ein zweites Mal durch den Node-Prozess schicken, um dasselbe Ergebnis zu
 * erzeugen, und bei tausenden Bildern mit beliebigen Filterkombinationen ist
 * das CPU-Last und ein Cache-Verzeichnis fuer nichts.
 *
 * Der karierte Hintergrund macht sichtbar, dass die Bilder freigestellt sind.
 * Ohne ihn sieht ein weisses Fahrzeug im hellen Theme aus wie ein Ladefehler.
 */
export function ImageCard({ image, priority = false }: { image: ImageRecord; priority?: boolean }) {
  return (
    <Link
      href={`/images/${image.category}/${image.name}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded-xl"
    >
      <Card hoverLift className="h-full overflow-hidden p-3">
        <div className="checker-bg mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element --
              Bewusst kein next/image: die Datei liegt bereits in genau dieser
              Groesse auf dem CDN, vom Ingest einmalig mit sharp erzeugt. Der
              Optimizer wuerde sie ein zweites Mal durch den Node-Prozess
              schicken, um dasselbe Ergebnis zu bekommen, und bei tausenden
              Bildern mit beliebigen Filtern ist das CPU-Last fuer nichts. */}
          <img
            src={image.card}
            // Der Ingest legt jedes Bild in zwei Breiten ab, hier stehen beide
            // zur Wahl. Gemessen (1280 px Fenster, DPR 1): die Kachel rendert
            // 155 px, `sizes` nennt mit 180 px die Obergrenze des Rasters, und
            // der Browser nimmt daraufhin den 400er — 160 w liegt unter dem
            // angeforderten Wert, er waehlt also den naechstgroesseren.
            //
            // Das ist Absicht, kein Versehen: die Rasterspalten sind `1fr` und
            // wachsen auf breiten Schirmen ueber 180 px hinaus. Wuerde `sizes`
            // die gemessenen 155 px behaupten, spart es dort ein paar Kilobyte
            // und liefert dafuer ein sichtbar unscharfes Bild.
            //
            // Der 160er greift damit auf schmalen Viewports (45 vw unter
            // 640 px Fensterbreite) und auf jedem Schirm mit DPR unter 1,15.
            // Wer den Thumb haeufiger nutzen will, muss zuerst die Kacheln
            // deckeln, nicht `sizes` schoenrechnen.
            srcSet={`${image.thumb} 160w, ${image.card} 400w`}
            sizes="(max-width: 640px) 45vw, 180px"
            alt={image.label || image.name}
            width={image.width}
            height={image.height}
            // Der erste Bildschirm laedt sofort, alles darunter erst beim
            // Scrollen. Ohne das laedt eine Seite mit 60 Kacheln 60 Bilder
            // auf einmal, auch die, die niemand zu sehen bekommt.
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="max-h-full w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        <p className="truncate font-mono text-xs text-[var(--color-foreground)]" title={image.name}>
          {image.name}
        </p>
        {image.label && (
          <p className="truncate text-xs text-[var(--color-muted-foreground)]" title={image.label}>
            {image.label}
          </p>
        )}
      </Card>
    </Link>
  )
}

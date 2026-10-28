import { Check } from '@/components/icons'
import { PackagePrice, type PriceSource } from '@/components/packages/PackagePrice'
import { packagesTranslations, type Lang } from '@/lib/i18n'

interface Props {
  lang: Lang
  /** Prices of the two variants; without them the price row is left out (catalogue). */
  prices?: { encrypted: PriceSource; source: PriceSource }
  subscription?: boolean
  /** Id of the caption, for the scroll region's name. */
  id: string
}

function Yes({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-foreground)]">
      <Check className="h-4 w-4 text-[var(--color-success)]" />
      {label}
    </span>
  )
}

/**
 * Encrypted and Source side by side: variants as columns, features as rows
 * (plan 5.6, item 4). The facts are the ones Tebex states in its category
 * texts and package descriptions: Encrypted leaves config.lua, translation.lua
 * and server_discordlog.lua open, Source about 90 percent of the code with
 * the core functions encrypted, and both are delivered through Asset Escrow.
 *
 * Yes and No as words with a sign rather than as colour. The table scrolls in
 * itself on a narrow screen, the page does not (plan 4.7).
 */
export function VariantComparison({ lang, prices, subscription, id }: Props) {
  const t = packagesTranslations[lang]
  const th = 'border-b border-[var(--color-border)] px-3.5 py-2.5 text-left align-top'
  const td = `${th} text-[var(--color-muted-foreground)]`

  return (
    <div
      className="max-w-[72rem] overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
      role="region"
      aria-labelledby={id}
      tabIndex={0}
    >
      <table className="w-full border-collapse text-small">
        <caption id={id} className="border-b border-[var(--color-border)] px-3.5 py-3 text-left font-semibold">
          {t.compare_caption}
        </caption>
        <thead className="bg-[var(--color-accent-soft)]">
          <tr>
            <th scope="col" className={`${th} font-semibold`}>{t.compare_feature}</th>
            <th scope="col" className={`${th} font-display font-[650]`}>{t.variant_encrypted}</th>
            <th scope="col" className={`${th} font-display font-[650]`}>{t.variant_source}</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>*]:border-b-0">
          {prices && (
            <tr>
              <th scope="row" className={`${th} font-semibold`}>{t.compare_price}</th>
              <td className={td}>
                <PackagePrice variants={[prices.encrypted]} lang={lang} perMonth={subscription} className="text-[var(--color-foreground)]" />
              </td>
              <td className={td}>
                <PackagePrice variants={[prices.source]} lang={lang} perMonth={subscription} className="text-[var(--color-foreground)]" />
              </td>
            </tr>
          )}
          <tr>
            <th scope="row" className={`${th} font-semibold`}>{t.compare_open}</th>
            <td className={td}>{t.compare_open_encrypted}</td>
            <td className={td}>{t.compare_open_source}</td>
          </tr>
          <tr>
            <th scope="row" className={`${th} font-semibold`}>{t.compare_locked}</th>
            <td className={td}>{t.compare_locked_encrypted}</td>
            <td className={td}>{t.compare_locked_source}</td>
          </tr>
          <tr>
            <th scope="row" className={`${th} font-semibold`}>{t.compare_edit}</th>
            <td className={td}>{t.compare_no}</td>
            <td className={td}><Yes label={t.compare_yes} /></td>
          </tr>
          <tr>
            <th scope="row" className={`${th} font-semibold`}>{t.compare_escrow}</th>
            <td className={td}><Yes label={t.compare_yes} /></td>
            <td className={td}><Yes label={t.compare_yes} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

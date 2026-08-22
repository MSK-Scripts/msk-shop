/**
 * Stylesheet für `/sitemap.xml`.
 *
 * Reine Lesehilfe für Menschen: Browser rendern eine Sitemap ohne
 * `<?xml-stylesheet?>` als aneinandergehängten Text aller Tags, was jede
 * Sichtprüfung von Hand wertlos macht. Suchmaschinen ignorieren das Stylesheet,
 * sie lesen das XML.
 *
 * Als Route-Handler statt als Datei in `public/`, damit der Content-Type
 * garantiert `text/xsl` ist. Mit `X-Content-Type-Options: nosniff` im Spiel
 * verweigert der Browser die Transformation, wenn der Typ nicht stimmt, und
 * die Sitemap sähe wieder aus wie vorher.
 */

const XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap &#183; MSK Scripts</title>
        <meta name="robots" content="noindex"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          :root { color-scheme: dark; }
          body {
            margin: 0; padding: 2rem 1.25rem;
            background: #0d1117; color: #e6edf3;
            font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
            font-size: 14px; line-height: 1.5;
          }
          .wrap { max-width: 1100px; margin: 0 auto; }
          h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
          p.meta { margin: 0 0 1.75rem; color: #8b949e; }
          p.meta strong { color: #5eb131; }
          .scroll { overflow-x: auto; border: 1px solid #30363d; border-radius: 10px; }
          table { border-collapse: collapse; width: 100%; min-width: 640px; }
          th, td { text-align: left; padding: .6rem .85rem; border-bottom: 1px solid #21262d; }
          th {
            position: sticky; top: 0; background: #161b22; color: #8b949e;
            font-weight: 600; font-size: .75rem; letter-spacing: .04em; text-transform: uppercase;
          }
          tr:last-child td { border-bottom: 0; }
          tr:hover td { background: #161b22; }
          td.num { color: #6e7681; width: 3rem; font-variant-numeric: tabular-nums; }
          a { color: #5eb131; text-decoration: none; }
          a:hover { text-decoration: underline; }
          td.date, td.langs {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: .8rem; color: #8b949e; white-space: nowrap;
          }
          .none { color: #484f58; }
          footer { margin-top: 1.5rem; color: #6e7681; font-size: .8rem; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>XML Sitemap</h1>
          <p class="meta">
            <strong><xsl:value-of select="count(s:urlset/s:url)"/></strong>
            <xsl:text> URLs. This page is a readable view of sitemap.xml. </xsl:text>
            <xsl:text>Search engines read the XML and ignore this stylesheet.</xsl:text>
          </p>
          <div class="scroll">
            <table>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Last modified</th>
                <th>Languages</th>
              </tr>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()"/></td>
                  <td>
                    <a target="_blank" rel="noopener">
                      <xsl:attribute name="href"><xsl:value-of select="s:loc"/></xsl:attribute>
                      <xsl:value-of select="s:loc"/>
                    </a>
                  </td>
                  <td class="date">
                    <xsl:choose>
                      <xsl:when test="s:lastmod">
                        <xsl:value-of select="substring(s:lastmod, 1, 10)"/>
                      </xsl:when>
                      <xsl:otherwise><span class="none">not set</span></xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td class="langs">
                    <xsl:choose>
                      <xsl:when test="xhtml:link">
                        <xsl:for-each select="xhtml:link">
                          <xsl:if test="position() &gt; 1"><xsl:text>, </xsl:text></xsl:if>
                          <xsl:value-of select="@hreflang"/>
                        </xsl:for-each>
                      </xsl:when>
                      <xsl:otherwise><span class="none">&#8212;</span></xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
              </xsl:for-each>
            </table>
          </div>
          <footer>
            No lastmod on static pages is deliberate: Google only uses the value
            when it is verifiably accurate, and a made up date costs more than a
            missing one.
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`

// Konstanter Text, also einmal beim Build erzeugen statt bei jeder Anfrage.
export const dynamic = 'force-static'

export function GET() {
  return new Response(XSL, {
    headers: {
      'Content-Type':  'text/xsl; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

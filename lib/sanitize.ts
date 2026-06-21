import sanitizeHtml from 'sanitize-html'

// Sanitizer for Tebex package/category descriptions. These come from a
// third-party API and are rendered via dangerouslySetInnerHTML, so we strip
// scripts, inline event handlers and dangerous URL schemes while keeping the
// formatting tags Tebex actually uses (headings, lists, links, images, …).
// Defense-in-depth on top of the strict CSP — even if the upstream content
// were tampered with, no executable markup survives.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'figure', 'figcaption', 'span',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'style'],
    a:   ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  // Drop href/src using javascript:, data:, etc. — only safe schemes survive.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    // Force safe rel on every link.
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

export function sanitizeTebexHtml(html: string | null | undefined): string {
  return sanitizeHtml(html ?? '', OPTIONS)
}

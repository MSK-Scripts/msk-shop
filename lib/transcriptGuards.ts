import path from 'path';

// Pure, dependency-free validation helpers for the transcript upload route
// (app/api/transcript/upload). Extracted so the security-critical guards
// (api-key shape, attachment extension/MIME allow-lists, bot-supplied id shape)
// are unit-testable without standing up the whole route.

/** Lowercase UUID (any version) — the only shape accepted as a bot-supplied
 *  attachment id. Anything else must fall back to a server-generated UUID, so a
 *  malicious value can never influence the on-disk filename. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Extract and validate the Bearer token from an Authorization header value. */
export function extractApiKey(authHeader: string | null | undefined): string | null {
  const match = (authHeader ?? '').match(/^Bearer\s+([A-Za-z0-9_\-]{32,128})$/);
  return match ? match[1] : null;
}

/** Extensions the browser may render inline. Apache serves these with their real
 *  Content-Type (plus nosniff, so a mislabelled file still can't become a page).
 *
 *  Images belong here even when the browser can't decode them (heic): the
 *  transcript references every `image/*` attachment through an `<img>` tag, and
 *  a forced download would break that tag outright. Media the browser cannot
 *  play (mkv, avi) is deliberately in the download set instead — it is rendered
 *  as a link either way, so a download is the better outcome. */
export const INLINE_ATTACHMENT_EXTS = new Set([
  // images — always inline, see above
  'png', 'jpg', 'jpeg', 'jfif', 'gif', 'webp', 'bmp', 'avif',
  'tif', 'tiff', 'ico', 'heic', 'heif',
  'pdf',
  // media the browser can generally play in place
  'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'flac', 'opus',
]);

/** Extensions stored for download only. Support tickets are full of these
 *  (FiveM configs, scripts, archives, logs), but their content is user-supplied
 *  and must never be interpreted by the browser: the Apache transcripts block
 *  serves them as `application/octet-stream` + `Content-Disposition: attachment`,
 *  with `X-Content-Type-Options: nosniff` so a `.lua` starting with "<html>"
 *  cannot be sniffed into a rendered page on the shop domain. */
export const DOWNLOAD_ONLY_ATTACHMENT_EXTS = new Set([
  // archives
  'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst',
  // plain text, logs, tabular
  'txt', 'log', 'md', 'csv', 'conf', 'properties', 'patch', 'diff',
  // code and configuration
  'lua', 'js', 'ts', 'css', 'json', 'xml', 'sql', 'cfg', 'ini', 'toml',
  'yml', 'yaml',
  // GTA / FiveM resource formats — the whole point of this bot's support cases
  'meta', 'ymap', 'ytyp', 'ytd', 'yft', 'ydr', 'ydd', 'ybn', 'ycd', 'ynv',
  'rpf', 'fxap',
  // databases
  'db', 'sqlite',
  // media the browser can't play in place, so a download beats a dead player
  'mkv', 'avi', 'wmv', 'mpg', 'mpeg', 'm4v',
  // documents
  'docx', 'xlsx', 'pptx', 'odt', 'ods',
]);

/** Allow-listed attachment extensions — mirrors the Apache FilesMatch allowlist,
 *  minus html/svg (which can carry active content) and executables. The on-disk
 *  filename is rebuilt as `<uuid>.<ext>`, so an attacker-controlled name such as
 *  "x.php.png", "../x" or a null-byte trick can never reach the web root.
 *
 *  Keep this in sync with THREE places, or attachments silently fall back to the
 *  expiring Discord CDN link in the transcript:
 *    1. the Apache `<Directory /var/www/html/transcripts>` FilesMatch blocks
 *       (main vhost AND the custom-domain vhost template),
 *    2. this set,
 *    3. ALLOWED_ATTACHMENT_EXTS in the bot (src/utils/ticketActions.js).
 *  Widen the server side FIRST — the upload route rejects the whole request with
 *  400 over a single unknown extension, which costs the hosted transcript. */
export const ALLOWED_ATTACHMENT_EXTS = new Set([
  ...INLINE_ATTACHMENT_EXTS,
  ...DOWNLOAD_ONLY_ATTACHMENT_EXTS,
]);

/** Return a lowercased, allow-listed file extension, or null if not allowed. */
export function safeAttachmentExt(name: string): string | null {
  const ext = path.extname(name).slice(1).toLowerCase();
  return ALLOWED_ATTACHMENT_EXTS.has(ext) ? ext : null;
}

/** Image extensions re-encoded through sharp (strips polyglots/metadata).
 *  Deliberately only the formats sharp can re-encode in every build: a throw in
 *  here is answered with 400 for the WHOLE upload, so an exotic format must not
 *  be able to cost the transcript. Everything else in INLINE_ATTACHMENT_EXTS is
 *  stored as-is and kept harmless by its Content-Type plus nosniff. */
export const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'jfif', 'webp', 'gif']);

/** Reject attachment MIME types that denote executables/scripts. */
export function isAllowedMime(mime: string): boolean {
  const blocked = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-sh',
    'text/x-sh',
    'application/x-bat',
  ];
  return !blocked.some(b => (mime ?? '').toLowerCase().startsWith(b));
}

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

/** Allow-listed attachment extensions — mirrors the Apache FilesMatch allowlist,
 *  minus html/svg (which can carry active content). The on-disk filename is
 *  rebuilt as `<uuid>.<ext>`, so an attacker-controlled name such as "x.php.png",
 *  "../x" or a null-byte trick can never reach the web root. */
export const ALLOWED_ATTACHMENT_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'mp4', 'mp3', 'zip', 'txt',
]);

/** Return a lowercased, allow-listed file extension, or null if not allowed. */
export function safeAttachmentExt(name: string): string | null {
  const ext = path.extname(name).slice(1).toLowerCase();
  return ALLOWED_ATTACHMENT_EXTS.has(ext) ? ext : null;
}

/** Image extensions re-encoded through sharp (strips polyglots/metadata). */
export const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

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

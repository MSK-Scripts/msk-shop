import { describe, it, expect } from 'vitest'
import {
  UUID_RE, extractApiKey, safeAttachmentExt, isAllowedMime, IMAGE_EXTS,
  ALLOWED_ATTACHMENT_EXTS, INLINE_ATTACHMENT_EXTS, DOWNLOAD_ONLY_ATTACHMENT_EXTS,
} from '@/lib/transcriptGuards'

describe('extractApiKey', () => {
  it('accepts a valid Bearer token', () => {
    const key = 'a'.repeat(40)
    expect(extractApiKey(`Bearer ${key}`)).toBe(key)
  })
  it('rejects missing / wrong-scheme / too-short / too-long tokens', () => {
    expect(extractApiKey(null)).toBeNull()
    expect(extractApiKey('')).toBeNull()
    expect(extractApiKey('Bearer short')).toBeNull()
    expect(extractApiKey(`Basic ${'a'.repeat(40)}`)).toBeNull()
    expect(extractApiKey(`Bearer ${'a'.repeat(200)}`)).toBeNull()
  })
})

describe('safeAttachmentExt', () => {
  it('allows image / document types (case-insensitive)', () => {
    expect(safeAttachmentExt('pic.PNG')).toBe('png')
    expect(safeAttachmentExt('a.jpeg')).toBe('jpeg')
    expect(safeAttachmentExt('archive.zip')).toBe('zip')
  })
  it('allows the file types support tickets actually carry', () => {
    // Regression: these used to be rejected, so the transcript kept the signed
    // Discord CDN link instead — dead ~24h after the ticket closed.
    expect(safeAttachmentExt('sh_utils.lua')).toBe('lua')
    expect(safeAttachmentExt('krow_vehicleshop.rar')).toBe('rar')
    expect(safeAttachmentExt('server.cfg')).toBe('cfg')
    expect(safeAttachmentExt('dump.sql')).toBe('sql')
    expect(safeAttachmentExt('server.log')).toBe('log')
    expect(safeAttachmentExt('data.json')).toBe('json')
    expect(safeAttachmentExt('backup.7z')).toBe('7z')
  })
  it('allows the GTA/FiveM resource formats this bot exists for', () => {
    expect(safeAttachmentExt('vehicles.meta')).toBe('meta')
    expect(safeAttachmentExt('handling.meta')).toBe('meta')
    expect(safeAttachmentExt('bahama.ymap')).toBe('ymap')
    expect(safeAttachmentExt('adder.ytd')).toBe('ytd')
    expect(safeAttachmentExt('adder.yft')).toBe('yft')
    expect(safeAttachmentExt('asset.fxap')).toBe('fxap')
  })
  it('allows phone screenshots and screen recordings', () => {
    expect(safeAttachmentExt('IMG_0421.heic')).toBe('heic')
    expect(safeAttachmentExt('screenshot.jfif')).toBe('jfif')
    expect(safeAttachmentExt('bug.mkv')).toBe('mkv')
    expect(safeAttachmentExt('clip.m4v')).toBe('m4v')
    expect(safeAttachmentExt('voice.m4a')).toBe('m4a')
  })
  it('blocks active/executable and extension-less names', () => {
    expect(safeAttachmentExt('x.php')).toBeNull()
    expect(safeAttachmentExt('x.html')).toBeNull()
    expect(safeAttachmentExt('x.htm')).toBeNull()
    expect(safeAttachmentExt('x.svg')).toBeNull()
    expect(safeAttachmentExt('x.exe')).toBeNull()
    expect(safeAttachmentExt('x.bat')).toBeNull()
    expect(safeAttachmentExt('x.sh')).toBeNull()
    expect(safeAttachmentExt('x.jar')).toBeNull()
    expect(safeAttachmentExt('../../etc/passwd')).toBeNull()
    expect(safeAttachmentExt('noext')).toBeNull()
  })
  it('takes only the FINAL extension (x.php.png resolves to png)', () => {
    expect(safeAttachmentExt('x.php.png')).toBe('png')
    expect(safeAttachmentExt('x.html.lua')).toBe('lua')
  })
})

describe('inline vs. download-only split', () => {
  it('keeps the two sets disjoint and their union the allow-list', () => {
    for (const ext of INLINE_ATTACHMENT_EXTS) {
      expect(DOWNLOAD_ONLY_ATTACHMENT_EXTS.has(ext)).toBe(false)
    }
    expect(ALLOWED_ATTACHMENT_EXTS.size)
      .toBe(INLINE_ATTACHMENT_EXTS.size + DOWNLOAD_ONLY_ATTACHMENT_EXTS.size)
  })
  it('never lets a browser-renderable type into the inline set', () => {
    // Everything inline is served with its real Content-Type, so nothing that
    // can execute script in the page origin may appear here.
    for (const ext of ['html', 'htm', 'svg', 'xml', 'js']) {
      expect(INLINE_ATTACHMENT_EXTS.has(ext)).toBe(false)
    }
  })
  it('routes user-authored text/code through the download-only path', () => {
    for (const ext of ['lua', 'js', 'json', 'xml', 'cfg', 'log', 'txt']) {
      expect(DOWNLOAD_ONLY_ATTACHMENT_EXTS.has(ext)).toBe(true)
    }
  })
})

describe('isAllowedMime', () => {
  it('blocks executable/script MIME types', () => {
    expect(isAllowedMime('application/x-msdownload')).toBe(false)
    expect(isAllowedMime('text/x-sh')).toBe(false)
    expect(isAllowedMime('application/x-executable')).toBe(false)
  })
  it('allows normal types, empty and undefined', () => {
    expect(isAllowedMime('image/png')).toBe(true)
    expect(isAllowedMime('')).toBe(true)
    expect(isAllowedMime(undefined as unknown as string)).toBe(true)
  })
})

describe('UUID_RE / IMAGE_EXTS', () => {
  it('matches a lowercase uuid only', () => {
    expect(UUID_RE.test('12345678-1234-1234-1234-123456789abc')).toBe(true)
    expect(UUID_RE.test('12345678-1234-1234-1234-123456789ABC')).toBe(false)
    expect(UUID_RE.test('../evil')).toBe(false)
  })
  it('re-encodes only images, not other allow-listed types', () => {
    expect(IMAGE_EXTS.has('png')).toBe(true)
    expect(IMAGE_EXTS.has('webp')).toBe(true)
    expect(IMAGE_EXTS.has('jfif')).toBe(true)   // a JPEG under another name
    expect(IMAGE_EXTS.has('pdf')).toBe(false)
    expect(IMAGE_EXTS.has('zip')).toBe(false)
  })
  it('never re-encodes something that is served as a download', () => {
    // A re-encoded file is served inline; the two sets must not disagree, or an
    // image would be pushed through sharp and then handed out as octet-stream.
    for (const ext of IMAGE_EXTS) {
      expect(INLINE_ATTACHMENT_EXTS.has(ext)).toBe(true)
    }
  })
})

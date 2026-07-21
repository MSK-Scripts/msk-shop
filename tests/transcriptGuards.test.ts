import { describe, it, expect } from 'vitest'
import {
  UUID_RE, extractApiKey, safeAttachmentExt, isAllowedMime, IMAGE_EXTS,
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
  it('blocks active/executable and extension-less names', () => {
    expect(safeAttachmentExt('x.php')).toBeNull()
    expect(safeAttachmentExt('x.html')).toBeNull()
    expect(safeAttachmentExt('x.svg')).toBeNull()
    expect(safeAttachmentExt('../../etc/passwd')).toBeNull()
    expect(safeAttachmentExt('noext')).toBeNull()
  })
  it('takes only the FINAL extension (x.php.png resolves to png)', () => {
    expect(safeAttachmentExt('x.php.png')).toBe('png')
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
    expect(IMAGE_EXTS.has('pdf')).toBe(false)
    expect(IMAGE_EXTS.has('zip')).toBe(false)
  })
})

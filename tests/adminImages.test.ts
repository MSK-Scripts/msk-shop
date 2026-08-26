import { describe, it, expect } from 'vitest'
import {
  normalizeTags,
  normalizeLabel,
  splitTags,
  isImageStatus,
  isAdminImageFilter,
  permissionForStatusChange,
  IMAGE_STATUSES,
} from '@/lib/adminImages'
import { searchClause } from '@/lib/images'
import { ADMIN_PERMISSIONS } from '@/lib/adminPerms'

describe('normalizeTags', () => {
  it('lowercases, trims and drops empties', () => {
    expect(normalizeTags(' Sports ,  DLC , ')).toBe('sports,dlc')
  })

  it('removes duplicates, including ones that only differ in case', () => {
    expect(normalizeTags('Sports, sports , SPORTS')).toBe('sports')
  })

  it('keeps underscores and hyphens, because spawn names have them', () => {
    expect(normalizeTags('msk_core, low-rider')).toBe('msk_core,low-rider')
  })

  it('returns null for an empty result, never an empty string', () => {
    // The column is nullable; '' would be a third state for "no tags" and the
    // no_tags filter would have to know about both.
    expect(normalizeTags('')).toBeNull()
    expect(normalizeTags('  ,  , ')).toBeNull()
  })

  it('stays inside the column width', () => {
    const long = Array.from({ length: 200 }, (_, i) => `tag${i}`).join(',')
    expect(normalizeTags(long)!.length).toBeLessThanOrEqual(255)
  })

  it('round-trips through splitTags', () => {
    const stored = normalizeTags('Sports, DLC, msk_core')
    expect(splitTags(stored)).toEqual(['sports', 'dlc', 'msk_core'])
  })
})

describe('normalizeLabel', () => {
  it('trims and returns null when nothing is left', () => {
    expect(normalizeLabel('  Pegassi Zentorno ')).toBe('Pegassi Zentorno')
    expect(normalizeLabel('   ')).toBeNull()
  })

  it('stays inside the column width', () => {
    expect(normalizeLabel('x'.repeat(400))!.length).toBe(160)
  })
})

describe('isImageStatus', () => {
  it('accepts the three schema states and nothing else', () => {
    expect(IMAGE_STATUSES).toEqual(['pending', 'published', 'hidden'])
    for (const s of IMAGE_STATUSES) expect(isImageStatus(s)).toBe(true)
    expect(isImageStatus('deleted')).toBe(false)
    expect(isImageStatus(null)).toBe(false)
    expect(isImageStatus(1)).toBe(false)
  })
})

describe('isAdminImageFilter', () => {
  it('narrows a query parameter to a known filter', () => {
    expect(isAdminImageFilter('no_label')).toBe(true)
    expect(isAdminImageFilter('pending')).toBe(true)
    expect(isAdminImageFilter('everything')).toBe(false)
    expect(isAdminImageFilter(undefined)).toBe(false)
  })
})

describe('permissionForStatusChange', () => {
  it('needs moderation to resolve a pending row', () => {
    expect(permissionForStatusChange('pending')).toBe('images.moderate')
  })

  it('needs plain management for our own inventory', () => {
    expect(permissionForStatusChange('published')).toBe('images.manage')
    expect(permissionForStatusChange('hidden')).toBe('images.manage')
  })

  it('names permissions that actually exist', () => {
    // A typo here would fall back to "member does not have it" and silently
    // lock everyone out of the action instead of failing loudly.
    for (const s of IMAGE_STATUSES) {
      expect(ADMIN_PERMISSIONS).toContain(permissionForStatusChange(s))
    }
  })
})

describe('searchClause', () => {
  it('is null for an empty term, so the caller adds no condition at all', () => {
    expect(searchClause('')).toBeNull()
    expect(searchClause('   ')).toBeNull()
  })

  it('uses fulltext from three characters up, with a prefix wildcard', () => {
    const c = searchClause('zent')!
    expect(c.sql).toContain('MATCH')
    expect(c.params).toEqual(['zent*'])
  })

  it('falls back to LIKE below the fulltext minimum word length', () => {
    // "gt" and "50" are the normal case for spawn names, and MariaDB's
    // ft_min_word_len would return nothing for them.
    const c = searchClause('gt')!
    expect(c.sql).toContain('LIKE')
    expect(c.params).toEqual(['%gt%', '%gt%'])
  })

  it('strips boolean-mode operators instead of letting them change the query', () => {
    const c = searchClause('pistol -50')!
    expect(c.params).toEqual(['pistol* 50*'])
  })

  it('keeps a hyphen inside a word, where it is part of the tag', () => {
    // The fix for the leading hyphen must not break `low-rider`.
    expect(searchClause('low-rider')!.params).toEqual(['low-rider*'])
  })

  it('falls back to LIKE when nothing survives the stripping', () => {
    const c = searchClause('"""')!
    expect(c.sql).toContain('LIKE')
    expect(c.params).toEqual(['%"""%', '%"""%'])
  })

  it('aliases the table as i, which both callers must match', () => {
    expect(searchClause('zentorno')!.sql).toContain('i.name')
  })
})

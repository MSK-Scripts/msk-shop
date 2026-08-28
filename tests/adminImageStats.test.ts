import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { adminReq, staticCtx } from './helpers'

vi.mock('@/lib/db', () => ({
  query:    vi.fn(),
  queryOne: vi.fn(),
}))

import { query, queryOne } from '@/lib/db'
import { GET } from '@/app/api/admin/images/stats/route'
import { adminImageStats } from '@/lib/adminImages'

const mQuery    = query    as unknown as ReturnType<typeof vi.fn>
const mQueryOne = queryOne as unknown as ReturnType<typeof vi.fn>

/** One owner, plus the two counting queries this endpoint runs. */
function wire(opts: { categories?: unknown[]; pendingUploads?: number } = {}) {
  const categories = opts.categories ?? []
  const pending    = opts.pendingUploads ?? 0

  mQueryOne.mockImplementation(async (sql: string) => {
    if (sql.includes('msk_image_uploads')) return { total: pending }
    if (sql.includes('display_name'))      return { discord_user_id: '1', display_name: null, is_owner: 1, permissions: '[]', active: 1 }
    return { is_owner: 1 }
  })
  mQuery.mockImplementation(async (sql: string) => (sql.includes('msk_image_categories') ? categories : []))
}

async function figures() {
  const res = await GET(adminReq('/api/admin/images/stats'), staticCtx)
  expect(res.status).toBe(200)
  return (await res.json()).figures
}

beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })

beforeEach(() => {
  mQuery.mockReset()
  mQueryOne.mockReset()
})

describe('image stats endpoint', () => {
  /**
   * The reported bug. A submission lives in `msk_image_uploads` and never
   * touches `msk_images`, so every per-category `pending` can legitimately be
   * 0 while a file is waiting in the Uploads tab. The tile read those counts
   * and therefore showed 0 with one submission open.
   */
  it('reports the queue from msk_image_uploads, not from the category rows', async () => {
    wire({
      categories: [{ slug: 'items', name_en: 'Items', is_public: 1, total: 83, published: 83, pending: 0, hidden: 0, no_label: 0, no_tags: 0 }],
      pendingUploads: 1,
    })

    const f = await figures()
    expect(f.uploadQueue).toBe(1)
    expect(f.categories.every((c: { pending: number }) => c.pending === 0)).toBe(true)
  })

  it('reports an empty queue as 0', async () => {
    wire({ pendingUploads: 0 })
    expect((await figures()).uploadQueue).toBe(0)
  })

  it('actually asks the uploads table for the queue', async () => {
    wire({ pendingUploads: 3 })
    await figures()
    const asked = mQueryOne.mock.calls.map(c => String(c[0])).join('\n')
    expect(asked).toMatch(/FROM msk_image_uploads[\s\S]*status = 'pending'/)
  })
})

describe('adminImageStats', () => {
  /**
   * The second bug, visible as `props` reporting 1 missing label while holding
   * 0 images: with a LEFT JOIN and no match, `i.label` is NULL, and
   * `NULL IS NULL` counts. Guarding on `i.id IS NOT NULL` is what separates
   * "row without a label" from "no row at all".
   */
  it('guards the shortfall counters against the empty side of the LEFT JOIN', async () => {
    mQuery.mockResolvedValue([])
    await adminImageStats()

    const sql = String(mQuery.mock.calls[0][0])
    expect(sql).toContain('LEFT JOIN')
    for (const col of ['label', 'tags']) {
      const line = sql.split('\n').find(l => l.includes(`AS no_${col}`))!
      expect(line).toContain('i.id IS NOT NULL')
    }
  })

  it('does not report a shortfall for a category with no images', async () => {
    mQuery.mockResolvedValue([
      { slug: 'props', name_en: 'Props', is_public: 1, total: 0, published: null, pending: null, hidden: null, no_label: 0, no_tags: 0 },
    ])
    const [props] = await adminImageStats()
    expect(props.total).toBe(0)
    expect(props.noLabel).toBe(0)
    expect(props.noTags).toBe(0)
  })
})

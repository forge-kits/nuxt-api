import { describe, it, expect, vi } from 'vitest'
import { useForgeCursorPagination } from '../src/runtime/composables/useForgeCursorPagination'

function mockCursor(cursor: string | null = 'next-abc', prevCursor: string | null = null, items = [{ id: 1 }]) {
  return {
    data: items,
    meta: { next_cursor: cursor, prev_cursor: prevCursor, per_page: 15 },
  }
}

describe('useForgeCursorPagination', () => {
  it('fetch() loads data and meta', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor('cursor-2', null, [{ id: 1 }, { id: 2 }]))
    const { fetch, data, meta } = useForgeCursorPagination('/posts')
    await fetch()
    expect(data.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(meta.value?.next_cursor).toBe('cursor-2')
  })

  it('fetch(cursor) sends cursor as query param', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor(null))
    const { fetch } = useForgeCursorPagination('/posts')
    await fetch('cursor-abc')
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      query: expect.objectContaining({ cursor: 'cursor-abc' }),
    }))
  })

  it('fetch() without cursor does not send cursor param', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor('next'))
    const { fetch } = useForgeCursorPagination('/posts')
    await fetch()
    const query = (vi.mocked($fetch).mock.calls[0][1] as any).query
    expect(query?.cursor).toBeUndefined()
  })

  it('hasMore is true when next_cursor exists', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor('cursor-next'))
    const { fetch, hasMore } = useForgeCursorPagination('/posts')
    expect(hasMore.value).toBe(false)
    await fetch()
    expect(hasMore.value).toBe(true)
  })

  it('hasMore is false when next_cursor is null', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor(null))
    const { fetch, hasMore } = useForgeCursorPagination('/posts')
    await fetch()
    expect(hasMore.value).toBe(false)
  })

  it('loadMore() appends data and uses nextCursor', async () => {
    vi.mocked($fetch)
      .mockResolvedValueOnce(mockCursor('cursor-2', null, [{ id: 1 }]))
      .mockResolvedValueOnce(mockCursor(null, 'cursor-2', [{ id: 2 }]))

    const { fetch, loadMore, data } = useForgeCursorPagination('/posts')
    await fetch()
    await loadMore()

    expect(data.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(vi.mocked($fetch)).toHaveBeenNthCalledWith(2, '/posts', expect.objectContaining({
      query: expect.objectContaining({ cursor: 'cursor-2' }),
    }))
  })

  it('loadMore() does nothing when hasMore is false', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor(null))
    const { fetch, loadMore } = useForgeCursorPagination('/posts')
    await fetch()
    await loadMore()
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(1)
  })

  it('reset() clears data and meta', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor('cursor-2'))
    const { fetch, reset, data, meta } = useForgeCursorPagination('/posts')
    await fetch()
    reset()
    expect(data.value).toEqual([])
    expect(meta.value).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    vi.mocked($fetch).mockRejectedValueOnce(new Error('500'))
    const { fetch, error } = useForgeCursorPagination('/posts')
    await fetch()
    expect(error.value?.message).toBe('500')
  })

  it('perPage option is sent as query param', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockCursor(null))
    const { fetch } = useForgeCursorPagination('/posts', { perPage: 30 })
    await fetch()
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      query: expect.objectContaining({ per_page: 30 }),
    }))
  })
})

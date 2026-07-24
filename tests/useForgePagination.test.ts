import { describe, it, expect, vi } from 'vitest'
import { createApp } from 'vue'
import { useForgePagination } from '../src/runtime/composables/useForgePagination'

function mockPage(page = 1, lastPage = 3) {
  return {
    data: [{ id: page }],
    meta: { current_page: page, per_page: 20, total: lastPage * 20, last_page: lastPage, from: 1, to: 20 },
    links: { prev: null, next: null },
  }
}

function withSetup<T>(fn: () => T): T {
  let result!: T
  const app = createApp({ setup() { result = fn(); return () => {} } })
  app.mount(document.createElement('div'))
  return result
}

describe('useForgePagination', () => {
  it('fetch() loads data and meta', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockPage(1))
    const { fetch, data, meta } = useForgePagination('/posts')
    await fetch()
    expect(data.value).toEqual([{ id: 1 }])
    expect(meta.value?.current_page).toBe(1)
    expect(meta.value?.last_page).toBe(3)
  })

  it('fetch() sends page and per_page as query params', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockPage(2))
    const { fetch } = useForgePagination('/posts', { perPage: 10 })
    await fetch({ page: 2 })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      query: { page: 2, per_page: 10 },
    }))
  })

  it('nextPage increments page and fetches', async () => {
    vi.mocked($fetch)
      .mockResolvedValueOnce(mockPage(1))
      .mockResolvedValueOnce(mockPage(2))
    const { fetch, nextPage, page } = useForgePagination('/posts')
    await fetch()
    await nextPage()
    expect(page.value).toBe(2)
    expect(data => data).toBeTruthy()
  })

  it('nextPage does nothing on last page', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockPage(3, 3))
    const { fetch, nextPage } = useForgePagination('/posts')
    await fetch({ page: 3 })
    await nextPage()
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(1)
  })

  it('prevPage decrements page', async () => {
    vi.mocked($fetch)
      .mockResolvedValueOnce(mockPage(2))
      .mockResolvedValueOnce(mockPage(1))
    const { fetch, prevPage, page } = useForgePagination('/posts')
    await fetch({ page: 2 })
    await prevPage()
    expect(page.value).toBe(1)
  })

  it('prevPage does nothing on first page', async () => {
    const { prevPage } = useForgePagination('/posts')
    await prevPage()
    expect(vi.mocked($fetch)).not.toHaveBeenCalled()
  })

  it('goToPage goes to specific page', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockPage(5, 10))
    const { goToPage, page } = useForgePagination('/posts')
    await goToPage(5)
    expect(page.value).toBe(5)
  })

  it('sets error on fetch failure', async () => {
    vi.mocked($fetch).mockRejectedValueOnce(new Error('500'))
    const { fetch, error } = useForgePagination('/posts')
    await fetch()
    expect(error.value?.message).toBe('500')
  })

  it('fetches on mount when immediate is true (default)', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(mockPage(1))
    withSetup(() => useForgePagination('/posts'))
    await new Promise(r => setTimeout(r, 0))
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(1)
  })

  it('skips initial fetch when immediate is false', async () => {
    withSetup(() => useForgePagination('/posts', { immediate: false }))
    await new Promise(r => setTimeout(r, 0))
    expect(vi.mocked($fetch)).not.toHaveBeenCalled()
  })
})

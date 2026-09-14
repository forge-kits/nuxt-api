import { describe, it, expect, vi } from 'vitest'
import { useForgeCrud } from '../src/runtime/composables/useForgeCrud'

const BASE = 'http://localhost:8000/api/v1'

describe('useForgeCrud', () => {
  it('list() calls GET /posts', async () => {
    vi.mocked($fetch).mockResolvedValueOnce([{ id: 1 }])
    const { list } = useForgeCrud('/posts')
    const result = await list()
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      baseURL: BASE,
      method: 'GET',
    }))
    expect(result).toEqual([{ id: 1 }])
  })

  it('list() passes params as query', async () => {
    vi.mocked($fetch).mockResolvedValueOnce([])
    const { list } = useForgeCrud('/posts')
    await list({ page: 2, search: 'nuxt' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      query: { page: 2, search: 'nuxt' },
    }))
  })

  it('get() calls GET /posts/1', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({ id: 1 })
    const { get } = useForgeCrud('/posts')
    const result = await get(1)
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual({ id: 1 })
  })

  it('create() calls POST /posts with body', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({ id: 2, title: 'Hello' })
    const { create } = useForgeCrud('/posts')
    await create({ title: 'Hello' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      method: 'POST',
      body: { title: 'Hello' },
    }))
  })

  it('update() calls PATCH /posts/1 with body', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({ id: 1, title: 'Updated' })
    const { update } = useForgeCrud('/posts')
    await update(1, { title: 'Updated' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({
      method: 'PATCH',
      body: { title: 'Updated' },
    }))
  })

  it('replace() calls PUT /posts/1 with body', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({ id: 1 })
    const { replace } = useForgeCrud('/posts')
    await replace(1, { title: 'Replaced', body: '...' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({ method: 'PUT' }))
  })

  it('remove() calls DELETE /posts/1', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    const { remove } = useForgeCrud('/posts')
    await remove(1)
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('loading.list is true while fetching', async () => {
    let resolve!: (v: unknown) => void
    vi.mocked($fetch).mockReturnValueOnce(new Promise(r => { resolve = r }))
    const { list, loading } = useForgeCrud('/posts')
    expect(loading.list.value).toBe(false)
    const promise = list()
    expect(loading.list.value).toBe(true)
    resolve([])
    await promise
    expect(loading.list.value).toBe(false)
  })

  it('loading.create is true while creating', async () => {
    let resolve!: (v: unknown) => void
    vi.mocked($fetch).mockReturnValueOnce(new Promise(r => { resolve = r }))
    const { create, loading } = useForgeCrud('/posts')
    const promise = create({ title: 'x' })
    expect(loading.create.value).toBe(true)
    resolve({ id: 1 })
    await promise
    expect(loading.create.value).toBe(false)
  })

  it('two crud instances have independent loading states', async () => {
    vi.mocked($fetch)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const posts = useForgeCrud('/posts')
    const comments = useForgeCrud('/comments')

    await Promise.all([posts.list(), comments.list()])

    expect(posts.loading.list.value).toBe(false)
    expect(comments.loading.list.value).toBe(false)

    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.anything())
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/comments', expect.anything())
  })
})

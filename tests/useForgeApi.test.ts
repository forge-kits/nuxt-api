import { describe, it, expect, vi } from 'vitest'
import { setStrategy } from './__mocks__/imports'
import { useForgeApi } from '../src/runtime/composables/useForgeApi'

const BASE = 'http://localhost:8000/api/v1'

describe('useForgeApi', () => {
  it('get() calls $fetch with GET method', async () => {
    vi.mocked($fetch).mockResolvedValueOnce([])
    await useForgeApi().get('/posts')
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      baseURL: BASE,
      method: 'GET',
      credentials: 'include',
    }))
  })

  it('post() calls $fetch with POST and body', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({ id: 1 })
    await useForgeApi().post('/posts', { title: 'Hello' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      method: 'POST',
      body: { title: 'Hello' },
    }))
  })

  it('patch() calls $fetch with PATCH', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({})
    await useForgeApi().patch('/posts/1', { title: 'Updated' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({ method: 'PATCH' }))
  })

  it('put() calls $fetch with PUT', async () => {
    vi.mocked($fetch).mockResolvedValueOnce({})
    await useForgeApi().put('/posts/1', { title: 'Replaced' })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({ method: 'PUT' }))
  })

  it('delete() calls $fetch with DELETE', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(undefined)
    await useForgeApi().delete('/posts/1')
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts/1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('passes params as query', async () => {
    vi.mocked($fetch).mockResolvedValueOnce([])
    await useForgeApi().get('/posts', { params: { page: 2, search: 'nuxt' } })
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      query: { page: 2, search: 'nuxt' },
    }))
  })

  it('always sends credentials: include', async () => {
    vi.mocked($fetch).mockResolvedValueOnce(null)
    await useForgeApi().get('/me')
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/me', expect.objectContaining({
      credentials: 'include',
    }))
  })

  it('telegram strategy adds X-Telegram-Init-Data header', async () => {
    setStrategy('telegram')
    vi.stubGlobal('Telegram', { WebApp: { initData: 'tg-data' } })
    vi.mocked($fetch).mockResolvedValueOnce([])
    await useForgeApi().get('/posts')
    expect(vi.mocked($fetch)).toHaveBeenCalledWith('/posts', expect.objectContaining({
      headers: expect.objectContaining({ 'X-Telegram-Init-Data': 'tg-data' }),
    }))
  })

  it('cookie strategy does not add telegram header', async () => {
    vi.mocked($fetch).mockResolvedValueOnce([])
    await useForgeApi().get('/posts')
    const call = vi.mocked($fetch).mock.calls[0][1] as any
    expect(call.headers?.['X-Telegram-Init-Data']).toBeUndefined()
  })
})

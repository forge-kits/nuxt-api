import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setStrategy, setPrefix, resetConfig } from './__mocks__/imports'
import { useForgeAuth } from '../src/runtime/composables/useForgeAuth'

describe('useForgeAuth', () => {
  describe('cookie strategy – default guard (api)', () => {
    it('login calls POST /auth/login then fetchUser', async () => {
      vi.mocked($fetch)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 1, email: 'a@b.com' })

      const { login, user } = useForgeAuth()
      await login({ email: 'a@b.com', password: 'secret' })

      expect(vi.mocked($fetch)).toHaveBeenNthCalledWith(1, '/auth/login', expect.objectContaining({
        method: 'POST',
        body: { email: 'a@b.com', password: 'secret' },
        credentials: 'include',
      }))
      expect(user.value).toEqual({ id: 1, email: 'a@b.com' })
    })

    it('logout calls POST /auth/logout and clears user', async () => {
      vi.mocked($fetch)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(undefined)

      const { fetchUser, logout, user } = useForgeAuth()
      await fetchUser()
      await logout()

      expect(vi.mocked($fetch)).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }))
      expect(user.value).toBeNull()
    })

    it('isAuthenticated is true when user is set', async () => {
      vi.mocked($fetch).mockResolvedValueOnce({ id: 1 })
      const { fetchUser, isAuthenticated } = useForgeAuth()
      expect(isAuthenticated.value).toBe(false)
      await fetchUser()
      expect(isAuthenticated.value).toBe(true)
    })

    it('fetchUser sets user to null on error', async () => {
      vi.mocked($fetch).mockRejectedValueOnce(new Error('401'))
      const { fetchUser, user } = useForgeAuth()
      await fetchUser()
      expect(user.value).toBeNull()
    })
  })

  describe('telegram strategy', () => {
    beforeEach(() => {
      setStrategy('telegram')
      vi.stubGlobal('Telegram', { WebApp: { initData: 'tg-init-data' } })
      vi.stubGlobal('$fetch', vi.fn())
    })

    it('login is a no-op', async () => {
      const { login } = useForgeAuth()
      await login({ email: 'a@b.com', password: 'secret' })
      expect(vi.mocked($fetch)).not.toHaveBeenCalled()
    })

    it('logout is a no-op', async () => {
      const { logout } = useForgeAuth()
      await logout()
      expect(vi.mocked($fetch)).not.toHaveBeenCalled()
    })

    it('fetchUser sends X-Telegram-Init-Data header', async () => {
      vi.mocked($fetch).mockResolvedValueOnce({ id: 42 })
      const { fetchUser } = useForgeAuth()
      await fetchUser()
      expect(vi.mocked($fetch)).toHaveBeenCalledWith('/auth/me', expect.objectContaining({
        headers: { 'X-Telegram-Init-Data': 'tg-init-data' },
      }))
    })
  })

  describe('admin guard', () => {
    beforeEach(() => resetConfig())

    it('login calls POST /admin/auth/login then fetchUser', async () => {
      vi.mocked($fetch)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 99, email: 'admin@b.com' })

      const { login, user } = useForgeAuth('admin')
      await login({ email: 'admin@b.com', password: 'secret' })

      expect(vi.mocked($fetch)).toHaveBeenNthCalledWith(1, '/admin/auth/login', expect.objectContaining({
        method: 'POST',
        body: { email: 'admin@b.com', password: 'secret' },
      }))
      expect(user.value).toEqual({ id: 99, email: 'admin@b.com' })
    })

    it('logout calls POST /admin/auth/logout and clears user', async () => {
      vi.mocked($fetch)
        .mockResolvedValueOnce({ id: 99 })
        .mockResolvedValueOnce(undefined)

      const { fetchUser, logout, user } = useForgeAuth('admin')
      await fetchUser()
      await logout()

      expect(vi.mocked($fetch)).toHaveBeenCalledWith('/admin/auth/logout', expect.objectContaining({
        method: 'POST',
      }))
      expect(user.value).toBeNull()
    })

    it('api and admin states are independent', async () => {
      vi.mocked($fetch)
        .mockResolvedValueOnce({ id: 1, email: 'user@b.com' })
        .mockResolvedValueOnce({ id: 99, email: 'admin@b.com' })

      const { fetchUser: fetchApi, user: apiUser } = useForgeAuth('api')
      const { fetchUser: fetchAdmin, user: adminUser } = useForgeAuth('admin')
      await fetchApi()
      await fetchAdmin()

      expect(apiUser.value?.email).toBe('user@b.com')
      expect(adminUser.value?.email).toBe('admin@b.com')
    })
  })

  describe('prefix: false', () => {
    beforeEach(() => setPrefix(false))
    afterEach(() => resetConfig())

    it('baseURL is just the url without prefix', async () => {
      vi.mocked($fetch).mockResolvedValueOnce({ id: 1 })
      await useForgeAuth().fetchUser()
      expect(vi.mocked($fetch)).toHaveBeenCalledWith('/auth/me', expect.objectContaining({
        baseURL: 'http://localhost:8000',
      }))
    })
  })
})

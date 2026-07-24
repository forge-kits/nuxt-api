import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setStrategy } from './__mocks__/imports'
import { useForgeAuth } from '../src/runtime/composables/useForgeAuth'

const tgWebApp = (initData = 'tg-init-data') => ({
  initData,
  initDataUnsafe: {
    user: {
      id: 42,
      first_name: 'Ivan',
      last_name: 'Petrov',
      username: 'ivanp',
      language_code: 'ru',
      is_premium: true,
      allows_write_to_pm: false,
      photo_url: 'https://t.me/photo.jpg',
    },
  },
})

describe('useForgeAuth', () => {
  describe('Cookie strategy', () => {
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

  describe('Telegram strategy', () => {
    beforeEach(() => {
      setStrategy('telegram')
      vi.stubGlobal('Telegram', { WebApp: tgWebApp() })
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

    it('exposes tg user fields from initDataUnsafe', () => {
      const { tgUserId, tgUsername, tgFullName, tgPhotoUrl, tgLanguageCode, tgIsPremium, isWebApp } = useForgeAuth()
      expect(tgUserId.value).toBe(42)
      expect(tgUsername.value).toBe('ivanp')
      expect(tgFullName.value).toBe('Ivan Petrov')
      expect(tgPhotoUrl.value).toBe('https://t.me/photo.jpg')
      expect(tgLanguageCode.value).toBe('ru')
      expect(tgIsPremium.value).toBe(true)
      expect(isWebApp.value).toBe(true)
    })

    it('tgAllowsWriteToPm reflects the field', () => {
      const { tgAllowsWriteToPm } = useForgeAuth()
      expect(tgAllowsWriteToPm.value).toBe(false)
    })

    it('tg fields are null/false when Telegram is not available', () => {
      vi.stubGlobal('Telegram', undefined)
      const { tgUserId, tgFullName, tgPhotoUrl, isWebApp } = useForgeAuth()
      expect(tgUserId.value).toBeNull()
      expect(tgFullName.value).toBeNull()
      expect(tgPhotoUrl.value).toBeNull()
      expect(isWebApp.value).toBe(false)
    })

    it('tgFullName trims correctly with only first name', () => {
      vi.stubGlobal('Telegram', {
        WebApp: {
          initData: 'x',
          initDataUnsafe: { user: { id: 1, first_name: 'Solo', last_name: '' } },
        },
      })
      const { tgFullName } = useForgeAuth()
      expect(tgFullName.value).toBe('Solo')
    })
  })
})

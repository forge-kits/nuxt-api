import { describe, it, expect, vi } from 'vitest'
import { useForgeTg } from '../src/runtime/composables/useForgeTg'

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

describe('useForgeTg', () => {
  it('exposes tg user fields from initDataUnsafe', () => {
    vi.stubGlobal('Telegram', { WebApp: tgWebApp() })
    const { tgUserId, tgUsername, tgFullName, tgPhotoUrl, tgLanguageCode, tgIsPremium, isWebApp } = useForgeTg()
    expect(tgUserId.value).toBe(42)
    expect(tgUsername.value).toBe('ivanp')
    expect(tgFullName.value).toBe('Ivan Petrov')
    expect(tgPhotoUrl.value).toBe('https://t.me/photo.jpg')
    expect(tgLanguageCode.value).toBe('ru')
    expect(tgIsPremium.value).toBe(true)
    expect(isWebApp.value).toBe(true)
  })

  it('tgAllowsWriteToPm reflects the field', () => {
    vi.stubGlobal('Telegram', { WebApp: tgWebApp() })
    const { tgAllowsWriteToPm } = useForgeTg()
    expect(tgAllowsWriteToPm.value).toBe(false)
  })

  it('tg fields are null/false when Telegram is not available', () => {
    vi.stubGlobal('Telegram', undefined)
    const { tgUserId, tgFullName, tgPhotoUrl, isWebApp } = useForgeTg()
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
    const { tgFullName } = useForgeTg()
    expect(tgFullName.value).toBe('Solo')
  })

  it('tgFullName is null when no user', () => {
    vi.stubGlobal('Telegram', { WebApp: { initData: 'x', initDataUnsafe: {} } })
    const { tgFullName } = useForgeTg()
    expect(tgFullName.value).toBeNull()
  })

  it('tgReady calls WebApp.ready without throwing', () => {
    const ready = vi.fn()
    vi.stubGlobal('Telegram', { WebApp: { ...tgWebApp(), ready } })
    const { tgReady } = useForgeTg()
    expect(() => tgReady()).not.toThrow()
    expect(ready).toHaveBeenCalled()
  })

  it('tgHaptic calls HapticFeedback.impactOccurred', () => {
    const impactOccurred = vi.fn()
    vi.stubGlobal('Telegram', {
      WebApp: { ...tgWebApp(), HapticFeedback: { impactOccurred, notificationOccurred: vi.fn() } },
    })
    const { tgHaptic } = useForgeTg()
    tgHaptic('light')
    expect(impactOccurred).toHaveBeenCalledWith('light')
  })

  it('tgHapticSuccess calls HapticFeedback.notificationOccurred with success', () => {
    const notificationOccurred = vi.fn()
    vi.stubGlobal('Telegram', {
      WebApp: { ...tgWebApp(), HapticFeedback: { impactOccurred: vi.fn(), notificationOccurred } },
    })
    const { tgHapticSuccess } = useForgeTg()
    tgHapticSuccess()
    expect(notificationOccurred).toHaveBeenCalledWith('success')
  })
})

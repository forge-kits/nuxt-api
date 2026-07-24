import { computed } from 'vue'
import { useRuntimeConfig, useState } from '#imports'

export interface ForgeUser {
  id: string | number
  username?: string
  email?: string
  permissions?: string[]
  roles?: string[]
  [key: string]: unknown
}

export interface LoginCredentials {
  email: string
  password: string
}

export const useForgeAuth = () => {
  const config = useRuntimeConfig()
  const { baseUrl, prefix, strategy, auth: endpoints } = config.public.forgeApi
  const baseURL = `${baseUrl}${prefix}`

  // ─── Backend user ────────────────────────────────────────────────────────────
  const user = useState<ForgeUser | null>('forge_user', () => null)
  const isAuthenticated = computed(() => !!user.value)

  // ─── Telegram WebApp ─────────────────────────────────────────────────────────
  const tgWebApp = computed(() =>
    import.meta.client ? (window as any)?.Telegram?.WebApp ?? null : null,
  )

  const initData = computed<string>(() => {
    if (tgWebApp.value?.initData) return tgWebApp.value.initData
    if (import.meta.dev) return import.meta.env.VITE_TELEGRAM_INIT_DATA ?? ''
    return ''
  })

  const initDataUnsafe = computed(() => tgWebApp.value?.initDataUnsafe ?? null)

  const tgUser = computed(() => initDataUnsafe.value?.user ?? null)
  const tgUserId = computed<number | null>(() => tgUser.value?.id ?? null)
  const tgUsername = computed<string | null>(() => tgUser.value?.username ?? null)
  const tgFullName = computed<string | null>(() => {
    const first = tgUser.value?.first_name ?? ''
    const last = tgUser.value?.last_name ?? ''
    const name = `${first} ${last}`.trim()
    return name || null
  })
  const tgLanguageCode = computed<string | null>(() => tgUser.value?.language_code ?? null)
  const tgIsPremium = computed<boolean>(() => !!tgUser.value?.is_premium)
  const tgAllowsWriteToPm = computed<boolean>(() => !!tgUser.value?.allows_write_to_pm)
  const tgPhotoUrl = computed<string | null>(() => tgUser.value?.photo_url ?? null)
  const isWebApp = computed<boolean>(() => !!initData.value)

  const tgReady = (): void => {
    try { tgWebApp.value?.ready?.() } catch {}
  }

  const tgHaptic = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void => {
    try { tgWebApp.value?.HapticFeedback?.impactOccurred(style) } catch {}
  }

  const tgHapticSuccess = (): void => {
    try { tgWebApp.value?.HapticFeedback?.notificationOccurred('success') } catch {}
  }

  // ─── HTTP ────────────────────────────────────────────────────────────────────
  function buildHeaders(): Record<string, string> {
    if (strategy === 'telegram' && import.meta.client) {
      return initData.value ? { 'X-Telegram-Init-Data': initData.value } : {}
    }
    return {}
  }

  const fetchUser = async (): Promise<void> => {
    if (!endpoints.me) return
    try {
      user.value = await $fetch<ForgeUser>(endpoints.me, {
        baseURL,
        headers: buildHeaders(),
        credentials: 'include',
      })
    }
    catch {
      user.value = null
    }
  }

  const login = async (credentials: LoginCredentials): Promise<void> => {
    if (strategy === 'telegram') return
    await $fetch(endpoints.login, {
      baseURL,
      method: 'POST',
      body: credentials,
      credentials: 'include',
    })
    await fetchUser()
  }

  const logout = async (): Promise<void> => {
    if (strategy === 'telegram') return
    await $fetch(endpoints.logout, {
      baseURL,
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    user.value = null
  }

  return {
    // backend
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser,
    // telegram (UI-only, untrusted until backend verifies initData)
    initData,
    initDataUnsafe,
    tgUser,
    tgUserId,
    tgUsername,
    tgFullName,
    tgLanguageCode,
    tgIsPremium,
    tgAllowsWriteToPm,
    tgPhotoUrl,
    isWebApp,
    tgReady,
    tgHaptic,
    tgHapticSuccess,
  }
}

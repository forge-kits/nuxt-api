import { computed } from 'vue'
import { useRuntimeConfig, useState } from '#imports'
import { useForgeHttp } from '../utils/forge-http'

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

export const useForgeAuth = (guard?: string) => {
  const config = useRuntimeConfig()
  const { guards, default: defaultGuard } = config.public.forgeApi
  const guardName = guard ?? defaultGuard
  const { strategy, endpoints } = guards[guardName]
  const { baseURL, credentialsMode } = useForgeHttp(guardName)

  const user = useState<ForgeUser | null>(`forge_${guardName}`, () => null)
  const isAuthenticated = computed(() => !!user.value)

  function buildHeaders(): Record<string, string> {
    if (strategy === 'telegram' && import.meta.client) {
      const initData = (window as any)?.Telegram?.WebApp?.initData
        ?? (import.meta.dev ? (import.meta.env.VITE_TELEGRAM_INIT_DATA ?? '') : '')
      if (initData) return { 'X-Telegram-Init-Data': initData }
    }
    return {}
  }

  const fetchUser = async (extra?: Record<string, unknown>): Promise<void> => {
    try {
      user.value = await $fetch<ForgeUser>(endpoints.me, {
        baseURL,
        headers: buildHeaders(),
        credentials: credentialsMode,
        ...extra,
      })
    }
    catch {
      user.value = null
    }
  }

  const login = async (creds: LoginCredentials): Promise<void> => {
    if (strategy === 'telegram' || !endpoints.login) return
    await $fetch(endpoints.login, {
      baseURL,
      method: 'POST',
      body: creds,
      credentials: credentialsMode,
    })
    await fetchUser()
  }

  const logout = async (): Promise<void> => {
    if (strategy === 'telegram' || !endpoints.logout) return
    await $fetch(endpoints.logout, {
      baseURL,
      method: 'POST',
      credentials: credentialsMode,
    }).catch(() => {})
    user.value = null
  }

  return { user, isAuthenticated, login, logout, fetchUser }
}

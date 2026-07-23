import { computed, onMounted } from 'vue'
import { useRuntimeConfig, useState } from '#imports'
import { useForgePermissions } from './useForgePermissions'

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

type TelegramWindow = typeof window & {
  Telegram?: { WebApp: { initData: string } }
}

export const useForgeAuth = () => {
  const config = useRuntimeConfig()
  const { baseUrl, prefix, strategy, auth: endpoints } = config.public.forgeApi
  const baseURL = `${baseUrl}${prefix}`

  const user = useState<ForgeUser | null>('forge_user', () => null)
  const isAuthenticated = computed(() => !!user.value)

  function buildHeaders(): Record<string, string> {
    if (strategy === 'telegram' && import.meta.client) {
      const initData = (window as TelegramWindow).Telegram?.WebApp?.initData ?? ''
      return initData ? { 'X-Telegram-Init-Data': initData } : {}
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
    if (strategy === 'telegram') {
      throw new Error('[forge-kits] Telegram strategy does not use email/password login')
    }
    await $fetch(endpoints.login, {
      baseURL,
      method: 'POST',
      body: credentials,
      credentials: 'include',
    })
    await fetchUser()
  }

  const logout = async (): Promise<void> => {
    if (endpoints.logout) {
      await $fetch(endpoints.logout, {
        baseURL,
        method: 'POST',
        headers: buildHeaders(),
        credentials: 'include',
      }).catch(() => {})
    }
    user.value = null
  }

  if (strategy === 'telegram' && import.meta.client) {
    onMounted(fetchUser)
  }

  const { can, canAll, hasRole, hasAllRoles, permissions, roles } = useForgePermissions()

  return {
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser,
    can,
    canAll,
    hasRole,
    hasAllRoles,
    permissions,
    roles,
  }
}

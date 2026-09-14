import { computed } from 'vue'
import { useRuntimeConfig, useState } from '#imports'
import type { ForgeUser } from './useForgeAuth'

export const useForgePermissions = (guard?: string) => {
  const config = useRuntimeConfig()
  const { default: defaultGuard } = config.public.forgeApi
  const guardName = guard ?? defaultGuard

  const user = useState<ForgeUser | null>(`forge_${guardName}`, () => null)

  const permissions = computed<string[]>(() => (user.value?.permissions ?? []) as string[])
  const roles = computed<string[]>(() => (user.value?.roles ?? []) as string[])

  const can = (...perms: string[]): boolean => perms.some(p => permissions.value.includes(p))
  const canAll = (...perms: string[]): boolean => perms.every(p => permissions.value.includes(p))
  const hasRole = (...roleNames: string[]): boolean => roleNames.some(r => roles.value.includes(r))
  const hasAllRoles = (...roleNames: string[]): boolean => roleNames.every(r => roles.value.includes(r))

  return { permissions, roles, can, canAll, hasRole, hasAllRoles }
}

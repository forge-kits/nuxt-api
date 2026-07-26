import { computed } from 'vue'
import { useState } from '#imports'
import type { ForgeUser } from './useForgeAuth'

export const useForgePermissions = () => {
  const user = useState<ForgeUser | null>('forge_admin', () => null)

  const permissions = computed<string[]>(() =>
    (user.value?.permissions ?? []) as string[],
  )

  const roles = computed<string[]>(() =>
    (user.value?.roles ?? []) as string[],
  )

  // True if user has ANY of the given permissions
  const can = (...perms: string[]): boolean =>
    perms.some(p => permissions.value.includes(p))

  // True if user has ALL of the given permissions
  const canAll = (...perms: string[]): boolean =>
    perms.every(p => permissions.value.includes(p))

  // True if user has ANY of the given roles
  const hasRole = (...roleNames: string[]): boolean =>
    roleNames.some(r => roles.value.includes(r))

  // True if user has ALL of the given roles
  const hasAllRoles = (...roleNames: string[]): boolean =>
    roleNames.every(r => roles.value.includes(r))

  return {
    permissions,
    roles,
    can,
    canAll,
    hasRole,
    hasAllRoles,
  }
}

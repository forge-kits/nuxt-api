import { defineNuxtRouteMiddleware, createError } from '#imports'
import { useForgePermissions } from '../composables/useForgePermissions'

export const PermissionMiddleware = (...permissions: string[]) =>
  defineNuxtRouteMiddleware(() => {
    const { can } = useForgePermissions()
    if (!can(...permissions)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  })

export const RoleMiddleware = (...roles: string[]) =>
  defineNuxtRouteMiddleware(() => {
    const { hasRole } = useForgePermissions()
    if (!hasRole(...roles)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  })

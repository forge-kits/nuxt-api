import { defineNuxtRouteMiddleware, navigateTo, createError } from '#imports'
import { useForgePermissions } from '../composables/useForgePermissions'

interface MiddlewareOptions {
  redirect?: string
}

function deny(redirect?: string) {
  if (redirect) return navigateTo(redirect)
  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

export const PermissionMiddleware = (
  perm: string | string[],
  options: MiddlewareOptions = {},
) =>
  defineNuxtRouteMiddleware(() => {
    const { can } = useForgePermissions()
    const perms = Array.isArray(perm) ? perm : [perm]
    if (!can(...perms)) return deny(options.redirect)
  })

export const PermissionAllMiddleware = (
  perm: string | string[],
  options: MiddlewareOptions = {},
) =>
  defineNuxtRouteMiddleware(() => {
    const { canAll } = useForgePermissions()
    const perms = Array.isArray(perm) ? perm : [perm]
    if (!canAll(...perms)) return deny(options.redirect)
  })

export const RoleMiddleware = (
  role: string | string[],
  options: MiddlewareOptions = {},
) =>
  defineNuxtRouteMiddleware(() => {
    const { hasRole } = useForgePermissions()
    const roles = Array.isArray(role) ? role : [role]
    if (!hasRole(...roles)) return deny(options.redirect)
  })

export const RoleAllMiddleware = (
  role: string | string[],
  options: MiddlewareOptions = {},
) =>
  defineNuxtRouteMiddleware(() => {
    const { hasAllRoles } = useForgePermissions()
    const roles = Array.isArray(role) ? role : [role]
    if (!hasAllRoles(...roles)) return deny(options.redirect)
  })

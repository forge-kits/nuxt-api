import { defineNuxtRouteMiddleware, navigateTo, createError } from '#imports'
import { useForgeAuth } from '../composables/useForgeAuth'
import { useForgePermissions } from '../composables/useForgePermissions'

interface MiddlewareOptions {
  redirect?: string
  guard?: string
}

function deny(redirect?: string) {
  if (redirect) return navigateTo(redirect)
  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

export const ForgeAuthMiddleware = (options: MiddlewareOptions = {}) =>
  defineNuxtRouteMiddleware(() => {
    const { isAuthenticated } = useForgeAuth(options.guard)
    if (!isAuthenticated.value) return deny(options.redirect)
  })

export const PermissionMiddleware = (perm: string | string[], options: MiddlewareOptions = {}) =>
  defineNuxtRouteMiddleware(() => {
    const { can } = useForgePermissions(options.guard)
    const perms = Array.isArray(perm) ? perm : [perm]
    if (!can(...perms)) return deny(options.redirect)
  })

export const PermissionAllMiddleware = (perm: string | string[], options: MiddlewareOptions = {}) =>
  defineNuxtRouteMiddleware(() => {
    const { canAll } = useForgePermissions(options.guard)
    const perms = Array.isArray(perm) ? perm : [perm]
    if (!canAll(...perms)) return deny(options.redirect)
  })

export const RoleMiddleware = (role: string | string[], options: MiddlewareOptions = {}) =>
  defineNuxtRouteMiddleware(() => {
    const { hasRole } = useForgePermissions(options.guard)
    const roles = Array.isArray(role) ? role : [role]
    if (!hasRole(...roles)) return deny(options.redirect)
  })

export const RoleAllMiddleware = (role: string | string[], options: MiddlewareOptions = {}) =>
  defineNuxtRouteMiddleware(() => {
    const { hasAllRoles } = useForgePermissions(options.guard)
    const roles = Array.isArray(role) ? role : [role]
    if (!hasAllRoles(...roles)) return deny(options.redirect)
  })

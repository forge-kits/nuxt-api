import { describe, it, expect } from 'vitest'
import { useState } from './__mocks__/imports'
import { useForgePermissions } from '../src/runtime/composables/useForgePermissions'

function setUser(data: { permissions?: string[], roles?: string[] } | null) {
  useState('forge_user', () => null).value = data
}

describe('useForgePermissions', () => {
  it('returns empty arrays when user is null', () => {
    const { permissions, roles } = useForgePermissions()
    expect(permissions.value).toEqual([])
    expect(roles.value).toEqual([])
  })

  describe('can()', () => {
    it('returns true if user has any of the given permissions', () => {
      setUser({ permissions: ['edit:posts', 'view:posts'] })
      const { can } = useForgePermissions()
      expect(can('edit:posts')).toBe(true)
      expect(can('delete:posts', 'edit:posts')).toBe(true)
    })

    it('returns false if user has none of the given permissions', () => {
      setUser({ permissions: ['view:posts'] })
      const { can } = useForgePermissions()
      expect(can('edit:posts', 'delete:posts')).toBe(false)
    })
  })

  describe('canAll()', () => {
    it('returns true only when user has all permissions', () => {
      setUser({ permissions: ['edit:posts', 'publish:posts'] })
      const { canAll } = useForgePermissions()
      expect(canAll('edit:posts', 'publish:posts')).toBe(true)
      expect(canAll('edit:posts', 'delete:posts')).toBe(false)
    })
  })

  describe('hasRole()', () => {
    it('returns true if user has any of the given roles', () => {
      setUser({ roles: ['admin', 'editor'] })
      const { hasRole } = useForgePermissions()
      expect(hasRole('admin')).toBe(true)
      expect(hasRole('viewer', 'editor')).toBe(true)
      expect(hasRole('viewer')).toBe(false)
    })
  })

  describe('hasAllRoles()', () => {
    it('returns true only when user has all roles', () => {
      setUser({ roles: ['admin', 'editor'] })
      const { hasAllRoles } = useForgePermissions()
      expect(hasAllRoles('admin', 'editor')).toBe(true)
      expect(hasAllRoles('admin', 'viewer')).toBe(false)
    })
  })
})

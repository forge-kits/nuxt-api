import { defineNuxtModule, addImports, addPlugin, addComponent, createResolver } from '@nuxt/kit'
import { defu } from 'defu'

export type AuthStrategy = 'cookie' | 'telegram'
export type AuthRole = 'user' | 'admin'

export interface ForgeAuthRoleEndpoints {
  login: string
  logout: string
  me: string
}

export interface ForgeAuthEndpoints {
  autoFetch: boolean
  user: ForgeAuthRoleEndpoints
  admin: ForgeAuthRoleEndpoints
}

export interface ModuleOptions {
  url: string
  prefix: string
  strategy: AuthStrategy
  credentials: boolean
  auth: ForgeAuthEndpoints
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    forgeApi: ModuleOptions
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@forge-kits/nuxt',
    configKey: 'forgeApi',
    compatibility: { nuxt: '>=3.10.0' },
  },
  defaults: {
    url: 'http://localhost:8000',
    prefix: '/api/v1',
    strategy: 'cookie' as AuthStrategy,
    credentials: true,
    auth: {
      autoFetch: true,
      user: {
        login: '/auth/login',
        logout: '/auth/logout',
        me: '/auth/me',
      },
      admin: {
        login: '/admin/auth/login',
        logout: '/admin/auth/logout',
        me: '/admin/auth/me',
      },
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.forgeApi = defu(
      nuxt.options.runtimeConfig.public.forgeApi as ModuleOptions,
      options,
    )

    addPlugin(resolver.resolve('./runtime/plugins/forge-auth'))

    addImports([
      // API
      { name: 'useForgeApi', from: resolver.resolve('./runtime/composables/useForgeApi') },
      // Auth
      { name: 'useForgeAuth', from: resolver.resolve('./runtime/composables/useForgeAuth') },
      // Permissions / RBAC
      { name: 'useForgePermissions', from: resolver.resolve('./runtime/composables/useForgePermissions') },
      // Forms
      { name: 'useForgeForm', from: resolver.resolve('./runtime/composables/useForgeForm') },
      // Pagination
      { name: 'useForgePagination', from: resolver.resolve('./runtime/composables/useForgePagination') },
      // Uploads
      { name: 'useForgeUpload', from: resolver.resolve('./runtime/composables/useForgeUpload') },
      // Middleware factories
      { name: 'PermissionMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'PermissionAllMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'RoleMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'RoleAllMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
    ])

    addComponent({ name: 'ForgeCan', filePath: resolver.resolve('./runtime/components/ForgeCan') })
    addComponent({ name: 'ForgeRole', filePath: resolver.resolve('./runtime/components/ForgeRole') })
  },
})

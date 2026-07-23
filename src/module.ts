import { defineNuxtModule, addImports, addPlugin, createResolver } from '@nuxt/kit'
import { defu } from 'defu'

export type AuthStrategy = 'cookie' | 'telegram'

export interface ForgeAuthEndpoints {
  login: string
  refresh: string
  logout: string
  me: string
}

export interface ModuleOptions {
  baseUrl: string
  prefix: string
  strategy: AuthStrategy
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
    baseUrl: 'http://localhost:8000',
    prefix: '/api/v1',
    strategy: 'cookie' as AuthStrategy,
    auth: {
      login: '/auth/login',
      refresh: '/auth/refresh',
      logout: '/auth/logout',
      me: '/auth/me',
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
      { name: 'RoleMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
    ])
  },
})

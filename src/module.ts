import { defineNuxtModule, addImports, addPlugin, addComponent, createResolver } from '@nuxt/kit'
import { defu } from 'defu'

export type AuthStrategy = 'cookie' | 'telegram'

export interface CookieGuardConfig {
  strategy: 'cookie'
  autoFetch?: boolean
  endpoints?: {
    login?: string
    logout?: string
    me?: string
  }
}

export interface TelegramGuardConfig {
  strategy: 'telegram'
  autoFetch?: boolean
  endpoints?: {
    me?: string
  }
}

export type GuardConfig = CookieGuardConfig | TelegramGuardConfig

export interface ResolvedGuard {
  strategy: AuthStrategy
  autoFetch: boolean
  endpoints: {
    login?: string
    logout?: string
    me: string
  }
}

export interface ModuleOptions {
  url: string
  prefix?: string | false
  credentials?: boolean
  default?: string
  guards: Record<string, GuardConfig>
}

export interface ResolvedModuleOptions {
  url: string
  prefix: string | false
  credentials: boolean
  default: string
  guards: Record<string, ResolvedGuard>
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    forgeApi: ResolvedModuleOptions
  }
}

function resolveEndpoints(
  name: string,
  isDefault: boolean,
  guard: GuardConfig,
): ResolvedGuard['endpoints'] {
  const base = isDefault ? '/auth' : `/${name}/auth`

  if (guard.strategy === 'telegram') {
    return { me: guard.endpoints?.me ?? `${base}/me` }
  }

  return {
    login: guard.endpoints?.login ?? `${base}/login`,
    logout: guard.endpoints?.logout ?? `${base}/logout`,
    me: guard.endpoints?.me ?? `${base}/me`,
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
    credentials: true,
    default: 'api',
    guards: {
      api: { strategy: 'cookie' },
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const defaultGuard = options.default ?? 'api'

    const resolvedGuards: Record<string, ResolvedGuard> = {}
    for (const [name, guard] of Object.entries(options.guards)) {
      resolvedGuards[name] = {
        strategy: guard.strategy,
        autoFetch: guard.autoFetch ?? false,
        endpoints: resolveEndpoints(name, name === defaultGuard, guard),
      }
    }

    nuxt.options.runtimeConfig.public.forgeApi = defu(
      nuxt.options.runtimeConfig.public.forgeApi as ResolvedModuleOptions,
      {
        url: options.url,
        prefix: options.prefix ?? '/api/v1',
        credentials: options.credentials ?? true,
        default: defaultGuard,
        guards: resolvedGuards,
      },
    )

    addPlugin(resolver.resolve('./runtime/plugins/forge-auth'))

    addImports([
      { name: 'useForgeApi', from: resolver.resolve('./runtime/composables/useForgeApi') },
      { name: 'useForgeAuth', from: resolver.resolve('./runtime/composables/useForgeAuth') },
      { name: 'useForgePermissions', from: resolver.resolve('./runtime/composables/useForgePermissions') },
      { name: 'useForgeForm', from: resolver.resolve('./runtime/composables/useForgeForm') },
      { name: 'useForgePagination', from: resolver.resolve('./runtime/composables/useForgePagination') },
      { name: 'useForgeUpload', from: resolver.resolve('./runtime/composables/useForgeUpload') },
      { name: 'useForgeTg', from: resolver.resolve('./runtime/composables/useForgeTg') },
      { name: 'useForgeCrud', from: resolver.resolve('./runtime/composables/useForgeCrud') },
      { name: 'useForgeCursorPagination', from: resolver.resolve('./runtime/composables/useForgeCursorPagination') },
      { name: 'ForgeAuthMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'PermissionMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'PermissionAllMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'RoleMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
      { name: 'RoleAllMiddleware', from: resolver.resolve('./runtime/utils/forgeCanMiddleware') },
    ])

    addComponent({ name: 'ForgeCan', filePath: resolver.resolve('./runtime/components/ForgeCan') })
    addComponent({ name: 'ForgeRole', filePath: resolver.resolve('./runtime/components/ForgeRole') })
    addComponent({ name: 'ForgeAuth', filePath: resolver.resolve('./runtime/components/ForgeAuth') })
    addComponent({ name: 'ForgeTg', filePath: resolver.resolve('./runtime/components/ForgeTg') })
  },
})

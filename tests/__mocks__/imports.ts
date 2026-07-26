import { ref, type Ref } from 'vue'

const _store = new Map<string, Ref>()

export const resetStore = () => _store.clear()

export const useState = <T>(key: string, init: () => T): Ref<T> => {
  if (!_store.has(key)) _store.set(key, ref(init()))
  return _store.get(key) as Ref<T>
}

type Strategy = 'cookie' | 'telegram'

interface ConfigOverrides {
  strategy?: Strategy
  prefix?: string | false
}

function buildConfig({ strategy = 'cookie', prefix = '/api/v1' }: ConfigOverrides = {}) {
  return {
    public: {
      forgeApi: {
        url: 'http://localhost:8000',
        prefix,
        strategy,
        credentials: true,
        auth: {
          client: {
            autoFetch: false,
            login: '/auth/login',
            logout: '/auth/logout',
            me: '/auth/me',
          },
          guard: {
            autoFetch: false,
            login: '/admin/auth/login',
            logout: '/admin/auth/logout',
            me: '/admin/auth/me',
          },
        },
      },
    },
  }
}

let _config = buildConfig()

export const setStrategy = (strategy: Strategy) => { _config = buildConfig({ strategy }) }
export const setPrefix = (prefix: string | false) => { _config = buildConfig({ prefix }) }
export const resetConfig = () => { _config = buildConfig() }
export const useRuntimeConfig = () => _config

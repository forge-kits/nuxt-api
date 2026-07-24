import { ref, type Ref } from 'vue'

const _store = new Map<string, Ref>()

export const resetStore = () => _store.clear()

export const useState = <T>(key: string, init: () => T): Ref<T> => {
  if (!_store.has(key)) _store.set(key, ref(init()))
  return _store.get(key) as Ref<T>
}

type Strategy = 'cookie' | 'telegram'

function buildConfig(strategy: Strategy) {
  return {
    public: {
      forgeApi: {
        baseUrl: 'http://localhost:8000',
        prefix: '/api/v1',
        strategy,
        credentials: true,
        auth: {
          login: '/auth/login',
          logout: '/auth/logout',
          me: '/auth/me',
          refresh: '/auth/refresh',
        },
      },
    },
  }
}

let _config = buildConfig('cookie')

export const setStrategy = (strategy: Strategy) => { _config = buildConfig(strategy) }
export const resetConfig = () => { _config = buildConfig('cookie') }
export const useRuntimeConfig = () => _config

import { useRuntimeConfig } from '#imports'

type TelegramWindow = typeof window & {
  Telegram?: { WebApp: { initData: string } }
}

export interface ForgeRequestOptions {
  params?: Record<string, string | number | boolean>
  headers?: Record<string, string>
  [key: string]: unknown
}

export const useForgeApi = () => {
  const config = useRuntimeConfig()
  const { baseUrl, prefix, strategy, credentials } = config.public.forgeApi
  const baseURL = `${baseUrl}${prefix}`

  function buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { ...extra }

    if (strategy === 'telegram' && import.meta.client) {
      const initData = (window as TelegramWindow).Telegram?.WebApp?.initData ?? ''
      if (initData) h['X-Telegram-Init-Data'] = initData
    }

    return h
  }

  const request = async <T>(
    method: string,
    path: string,
    options: ForgeRequestOptions = {},
  ): Promise<T> => {
    const { params, headers: extraHeaders, ...rest } = options

    return $fetch<T>(path, {
      baseURL,
      method,
      query: params,
      headers: buildHeaders(extraHeaders),
      credentials: credentials ? 'include' : 'omit',
      ...rest,
    })
  }

  return {
    get: <T>(path: string, options?: ForgeRequestOptions) =>
      request<T>('GET', path, options),

    post: <T>(path: string, body?: unknown, options?: ForgeRequestOptions) =>
      request<T>('POST', path, { body, ...options }),

    patch: <T>(path: string, body?: unknown, options?: ForgeRequestOptions) =>
      request<T>('PATCH', path, { body, ...options }),

    put: <T>(path: string, body?: unknown, options?: ForgeRequestOptions) =>
      request<T>('PUT', path, { body, ...options }),

    delete: <T>(path: string, options?: ForgeRequestOptions) =>
      request<T>('DELETE', path, options),
  }
}

import { useForgeHttp } from '../utils/forge-http'

export interface ForgeRequestOptions {
  params?: Record<string, string | number | boolean>
  headers?: Record<string, string>
  [key: string]: unknown
}

export const useForgeApi = (guard?: string) => {
  const { baseURL, credentialsMode, buildHeaders } = useForgeHttp(guard)

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
      credentials: credentialsMode,
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
